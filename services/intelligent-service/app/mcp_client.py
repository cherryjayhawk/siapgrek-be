"""
MCP Client — connects to the knowledge-service Streamable HTTP endpoint.

Provides:
  - connect():     establish session & discover tools
  - call_tool():   execute a single MCP tool by name
  - get_openai_tools():  return tool list in OpenAI function-calling format
  - disconnect():  tear down the session
"""

import json
import logging
from typing import Any

from mcp import ClientSession
from mcp.client.streamable_http import streamablehttp_client

from app.core.config import KNOWLEDGE_MCP_URL

logger = logging.getLogger(__name__)


from contextlib import AsyncExitStack

class MCPClient:
    """
    Thin wrapper around MCP ClientSession that manages the lifecycle
    of a Streamable-HTTP connection to the knowledge-service.
    """

    def __init__(self, url: str = KNOWLEDGE_MCP_URL) -> None:
        self._url = url
        self._session: ClientSession | None = None
        self._tools: list[dict[str, Any]] = []
        
        # Manages all async context managers safely
        self._exit_stack = AsyncExitStack()

    # ------------------------------------------------------------------
    # Lifecycle
    # ------------------------------------------------------------------
    async def connect(self) -> None:
        """
        Open the Streamable HTTP transport, initialize the MCP session,
        and cache the list of available tools.
        """
        if not self._url:
            logger.warning("KNOWLEDGE_MCP_URL is empty. Running without MCP context.")
            return

        try:
            logger.info("Connecting to MCP server at %s …", self._url)

            streams_cm = streamablehttp_client(self._url)
            read_stream, write_stream, _ = await self._exit_stack.enter_async_context(streams_cm)

            session_cm = ClientSession(read_stream, write_stream)
            self._session = await self._exit_stack.enter_async_context(session_cm)
            
            await self._session.initialize()

            tools_result = await self._session.list_tools()
            self._tools = self._map_tools(tools_result.tools)

            logger.info(
                "MCP connected — %d tool(s) available: %s",
                len(self._tools),
                [t["function"]["name"] for t in self._tools],
            )
        except Exception:
            logger.exception("Failed to connect to MCP server at %s", self._url)
            # Ensure we clean up partially-opened resources without throwing anyio errors
            await self.disconnect()

    async def disconnect(self) -> None:
        """Gracefully tear down session and transport."""
        await self._exit_stack.aclose()
        self._session = None
        logger.info("MCP session disconnected.")

    # ------------------------------------------------------------------
    # Tool discovery
    # ------------------------------------------------------------------
    @staticmethod
    def _map_tools(mcp_tools: list) -> list[dict[str, Any]]:
        """
        Convert MCP tool definitions into the OpenAI function-calling
        format so they can be passed directly to ``tools=`` in the
        ChatCompletion API.
        """
        openai_tools: list[dict[str, Any]] = []
        for tool in mcp_tools:
            openai_tools.append(
                {
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description or "",
                        "parameters": tool.inputSchema if tool.inputSchema else {"type": "object", "properties": {}},
                    },
                }
            )
        return openai_tools

    def get_openai_tools(self) -> list[dict[str, Any]]:
        """Return cached tools in OpenAI format. Empty list if not connected."""
        return self._tools

    @property
    def is_connected(self) -> bool:
        return self._session is not None

    # ------------------------------------------------------------------
    # Tool execution
    # ------------------------------------------------------------------
    async def call_tool(self, name: str, arguments: dict[str, Any]) -> str:
        """
        Execute an MCP tool by name and return the text result.

        Returns a JSON-serialised error string on failure so the LLM
        can still reason about what went wrong.
        """
        if self._session is None:
            return json.dumps({"error": "MCP session is not connected."})

        try:
            result = await self._session.call_tool(name, arguments)

            # Concatenate all text content blocks
            texts: list[str] = []
            for block in result.content:
                if hasattr(block, "text"):
                    texts.append(block.text)
            return "\n".join(texts) if texts else "(empty response)"

        except Exception as exc:
            logger.exception("MCP tool '%s' call failed", name)
            return json.dumps({"error": f"Tool call failed: {exc}"})
