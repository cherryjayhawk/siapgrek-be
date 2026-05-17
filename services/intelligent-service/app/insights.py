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
11. You MUST answer directly starting with "Ringkasan: ". Keep your answer consise and short. Do not include any long analysis or preamble.
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
    tool_results: list[str] = field(default_factory=list)


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

    async def generate(self, query: str, lat: float, lon: float) -> InsightResult:
        """
        Manually fetch all tool data upfront, inject into the prompt,
        and get a single comprehensive response from the LLM.
        """
        # 1. Fetch data from all available tools concurrently or sequentially
        # Assuming defaults for weather_forecast (Surabaya) and no specific topic for preference.
        logger.info("InsightOrchestrator: Pre-fetching MCP tools...")
        
        try:
            latest_sensor = await self._mcp.call_tool("latest_sensor_data", {})
        except Exception as e:
            latest_sensor = f"Error fetching latest sensor data: {e}"

        try:
            weather = await self._mcp.call_tool("weather_forecast", {"lat": str(lat), "lon": str(lon)})
        except Exception as e:
            weather = f"Error fetching weather: {e}"

        try:
            prefs = await self._mcp.call_tool("preference", {})
        except Exception as e:
            prefs = f"Error fetching preference: {e}"
            
        try:
            disease = await self._mcp.call_tool("disease_log", {"limit": 5})
        except Exception as e:
            disease = f"Error fetching disease log: {e}"

        # 2. Build the context block
        context_block = f"""
=== GREENHOUSE CONTEXT ===
[Latest Sensor Data]
{latest_sensor}

[Weather Forecast]
{weather}

[Recent Diseases]
{disease}

[Knowledge & Preferences]
{prefs}
==========================
"""

        full_system_prompt = f"{SYSTEM_PROMPT}\n\nHere is the current state of the greenhouse. Use this data strictly to answer the user's query.\n{context_block}"

        messages: list[dict[str, Any]] = [
            {"role": "system", "content": full_system_prompt},
            {"role": "user", "content": query},
        ]

        total_input_tokens = 0
        total_output_tokens = 0
        tools_called = [
            {"tool": "latest_sensor_data", "arguments": {}},
            {"tool": "weather_forecast", "arguments": {"lat": lat, "lon": lon}},
            {"tool": "preference", "arguments": {}},
            {"tool": "disease_log", "arguments": {"limit": 5}}
        ]

        try:
            response = await self._openai.chat.completions.create(
                model=OPENAI_MODEL,
                messages=messages,
                max_completion_tokens=OPENAI_MAX_TOKENS
            )
            logger.info("OpenAI API response received for Insights.")
            
            if response.usage:
                total_input_tokens = response.usage.prompt_tokens or 0
                total_output_tokens = response.usage.completion_tokens or 0

            final_content = response.choices[0].message.content or getattr(response.choices[0].message, 'refusal', None)
            if not final_content:
                final_content = "Maaf, saya tidak dapat memproses data tersebut untuk saat ini. Silakan coba lagi."

            return InsightResult(
                answer=final_content,
                input_tokens=total_input_tokens,
                output_tokens=total_output_tokens,
                tools_called=tools_called,
                tool_results=[latest_sensor, weather, prefs, disease]
            )

        except Exception:
            logger.exception("OpenAI API call failed for Insights")
            return InsightResult(
                answer=(
                    "I'm sorry, I'm currently unable to reach the AI service to generate insights. "
                    "Please try again in a moment."
                ),
                input_tokens=total_input_tokens,
                output_tokens=total_output_tokens,
                tools_called=tools_called,
                tool_results=[latest_sensor, weather, prefs, disease]
            )
