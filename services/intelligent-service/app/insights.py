"""
Insight orchestration — bridges OpenAI LLM with MCP tools.

Flow:
  1. User query arrives via REST endpoint.
  2. System prompt grounds the LLM as an orchid greenhouse expert.
  3. OpenAI receives the prompt + tools (from MCP).
  4. If OpenAI requests tool calls, we proxy them via MCPClient.call_tool(),
     append results, and re-query until a final text answer is yielded.
"""

import json
import logging
from dataclasses import dataclass, field
from typing import Any

from openai import AsyncOpenAI

from app.core.config import OPENAI_API_KEY, OPENAI_MODEL, OPENAI_MAX_TOKENS
from app.mcp_client import MCPClient

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# System prompt
# ---------------------------------------------------------------------------
SYSTEM_PROMPT = """\
You are **SiapGrek AI**, an expert agricultural assistant specialising in \
orchid greenhouse management.

Your role is to provide personalised, actionable insights and recommendations \
to the greenhouse operator. You have access to a set of live tools that can \
query greenhouse data in real-time:

• **preference** – Retrieves uploaded agricultural knowledge documents \
  containing user preferences and domain knowledge.
• **sensor_history** – Queries historical sensor telemetry (soil temperature, \
  soil humidity, environmental temperature/humidity, lux, pH, EC).
• **disease_log** – Retrieves plant disease classification records.
• **latest_sensor_data** – Retrieves the most recent sensor telemetry reading from TimescaleDB. Returns the absolute latest environmental and soil data snapshot.
• **weather_forecast** – Fetches weather forecast data from OpenWeatherMap using geographic coordinates (latitude and longitude). Provides external environmental context for agricultural decision-making.

**Guidelines:**
1. Always fetch relevant data using the tools before answering.
2. Provide concise and short, but comprehensive insights.
3. If a tool call fails, inform the user that live data is temporarily \
   unavailable but still provide general best-practice advice.
4. Never fabricate sensor readings or database records.
5. If all is well, write a short positive sentence.
6. Use the Indonesian and/or English language based on what the user uses.
7. Don't use bullet points if unnecessary.
8. Don't use emoji.
9. Don't ask back to user.
10. Use markdown formatting.
"""


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------
@dataclass
class InsightResult:
    """Structured result from the orchestration loop."""
    answer: str
    input_tokens: int = 0
    output_tokens: int = 0
    tools_called: list[dict[str, Any]] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------
class InsightOrchestrator:
    """
    Manages the OpenAI ↔ MCP tool-calling loop for a single query.
    """

    def __init__(self, mcp_client: MCPClient) -> None:
        self._mcp = mcp_client
        self._openai = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate(self, query: str) -> InsightResult:
        """
        Run the full orchestration loop and return the final LLM answer
        along with execution metrics (tokens, tools called).
        """
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": query},
        ]

        tools = self._mcp.get_openai_tools() if self._mcp.is_connected else []

        # Accumulators
        total_input_tokens = 0
        total_output_tokens = 0
        tools_called: list[dict[str, Any]] = []

        # Cap iterations to avoid infinite loops
        max_iterations = 5

        for _ in range(max_iterations):
            try:
                kwargs: dict[str, Any] = {
                    "model": OPENAI_MODEL,
                    "messages": messages,
                    "max_completion_tokens": 2000
                }
                if tools:
                    kwargs["tools"] = tools

                response = await self._openai.chat.completions.create(**kwargs)
                logger.info("OpenAI API response: %s", response)

            except Exception:
                logger.exception("OpenAI API call failed")
                return InsightResult(
                    answer=(
                        "I'm sorry, I'm currently unable to reach the AI service. "
                        "Please try again in a moment."
                    ),
                    input_tokens=total_input_tokens,
                    output_tokens=total_output_tokens,
                    tools_called=tools_called,
                )

            # Accumulate token usage
            if response.usage:
                total_input_tokens += response.usage.prompt_tokens or 0
                total_output_tokens += response.usage.completion_tokens or 0

            choice = response.choices[0]
            message = choice.message

            # If no tool calls, we have the final answer
            if not message.tool_calls:
                return InsightResult(
                    answer=message.content or "",
                    input_tokens=total_input_tokens,
                    output_tokens=total_output_tokens,
                    tools_called=tools_called,
                )

            # Append the assistant message (with tool_calls) to history
            messages.append(message.model_dump())

            # Execute each requested tool call via MCP
            for tool_call in message.tool_calls:
                fn_name = tool_call.function.name
                try:
                    fn_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    fn_args = {}

                logger.info("LLM requested tool '%s' with args %s", fn_name, fn_args)

                # Track the tool call
                tools_called.append({
                    "tool": fn_name,
                    "arguments": fn_args,
                })

                tool_result = await self._mcp.call_tool(fn_name, fn_args)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result,
                    }
                )

            # Loop continues — OpenAI will now see the tool results

        # Exhausted iterations (should be rare)
        logger.warning("Tool-calling loop hit max iterations (%d)", max_iterations)
        return InsightResult(
            answer=(
                "I gathered a lot of data but couldn't finish processing. "
                "Please try a more specific question."
            ),
            input_tokens=total_input_tokens,
            output_tokens=total_output_tokens,
            tools_called=tools_called,
        )
