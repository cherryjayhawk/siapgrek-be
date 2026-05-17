"""
Chatbot orchestration — bridges OpenAI LLM with MCP tools dynamically.

Flow:
  1. User chat history arrives via REST endpoint.
  2. System prompt grounds the LLM as an orchid greenhouse expert.
  3. OpenAI receives the messages + tools (from MCP).
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

Your role is to interact with the greenhouse operator and answer their questions \
or provide recommendations. You have access to a set of live tools that can \
query greenhouse data in real-time. Use them as needed.

**Guidelines:**
1. Only call tools if you need to fetch specific data to answer the user's question.
2. Provide conversational, helpful answers.
3. If a tool call fails, inform the user that live data is temporarily \
   unavailable but still provide general best-practice advice.
4. Never fabricate sensor readings or database records.
5. Use the Indonesian and/or English language based on what the user uses.
6. Use markdown formatting.
7. Keep your answer consise and short.
8. You have access to the conversation history. Do not repeat previous answers verbatim. If the user asks a follow-up question (e.g. "how do you know?"), explain that you retrieved the information directly from the greenhouse's database and sensors using your available tools.
9. Don't use emoji.
10. Don't ask back to user.
11. Don't use bullet points if unnecessary.
"""


# ---------------------------------------------------------------------------
# Result dataclass
# ---------------------------------------------------------------------------
@dataclass
class ChatResult:
    """Structured result from the orchestration loop."""
    answer: str
    input_tokens: int = 0
    output_tokens: int = 0
    tools_called: list[dict[str, Any]] = field(default_factory=list)
    tool_results: list[str] = field(default_factory=list)


# ---------------------------------------------------------------------------
# Orchestrator
# ---------------------------------------------------------------------------
class ChatbotOrchestrator:
    """
    Manages the OpenAI ↔ MCP tool-calling loop for a multi-turn chat.
    """

    def __init__(self, mcp_client: MCPClient) -> None:
        self._mcp = mcp_client
        self._openai = AsyncOpenAI(api_key=OPENAI_API_KEY)

    async def generate(self, conversation_history: list[dict[str, str]]) -> ChatResult:
        """
        Run the full orchestration loop and return the final LLM answer
        along with execution metrics (tokens, tools called).
        """
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": SYSTEM_PROMPT},
        ]
        
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

        logger.info("Incoming chat history length: %d", len(conversation_history))
        logger.debug("Chat history: %s", json.dumps(conversation_history, indent=2))

        tools = self._mcp.get_openai_tools() if self._mcp.is_connected else []

        # Accumulators
        total_input_tokens = 0
        total_output_tokens = 0
        tools_called: list[dict[str, Any]] = []
        tool_results_list: list[str] = []

        # Cap iterations to avoid infinite loops
        max_iterations = 5

        for _ in range(max_iterations):
            try:
                kwargs: dict[str, Any] = {
                    "model": OPENAI_MODEL,
                    "messages": messages,
                    "max_completion_tokens": OPENAI_MAX_TOKENS
                }
                if tools:
                    kwargs["tools"] = tools

                response = await self._openai.chat.completions.create(**kwargs)
                logger.info("OpenAI Chat API response received.")

            except Exception:
                logger.exception("OpenAI API call failed")
                return ChatResult(
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
                logger.debug("Final LLM message: %s", message.model_dump())
                final_content = message.content or getattr(message, 'refusal', None)
                if not final_content:
                    final_content = "Maaf, saya tidak dapat memproses data tersebut untuk saat ini. Silakan coba pertanyaan lain."
                    
                return ChatResult(
                    answer=final_content,
                    input_tokens=total_input_tokens,
                    output_tokens=total_output_tokens,
                    tools_called=tools_called,
                    tool_results=tool_results_list,
                )

            # Append the assistant message (with tool_calls) to history safely
            assistant_msg = message.model_dump(exclude_unset=True, exclude_none=True)
            messages.append(assistant_msg)

            # Execute each requested tool call via MCP
            for tool_call in message.tool_calls:
                fn_name = tool_call.function.name
                try:
                    fn_args = json.loads(tool_call.function.arguments)
                except json.JSONDecodeError:
                    fn_args = {}

                logger.info("Chat LLM requested tool '%s' with args %s", fn_name, fn_args)

                tools_called.append({
                    "tool": fn_name,
                    "arguments": fn_args,
                })

                tool_result = await self._mcp.call_tool(fn_name, fn_args)
                tool_results_list.append(tool_result)

                messages.append(
                    {
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "content": tool_result,
                    }
                )

        logger.warning("Tool-calling loop hit max iterations (%d)", max_iterations)
        return ChatResult(
            answer=(
                "I gathered a lot of data but couldn't finish processing. "
                "Please try a more specific question."
            ),
            input_tokens=total_input_tokens,
            output_tokens=total_output_tokens,
            tools_called=tools_called,
            tool_results=tool_results_list,
        )
