"""WebSocket connection manager for real-time updates."""
import asyncio
import json
from datetime import datetime
from typing import Any

from fastapi import WebSocket

from .models import WSEvent, WSEventType


class ConnectionManager:
    """Manages WebSocket connections and broadcasting."""

    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, scan_id: str):
        """Accept a new WebSocket connection for a scan."""
        await websocket.accept()
        async with self._lock:
            if scan_id not in self.active_connections:
                self.active_connections[scan_id] = []
            self.active_connections[scan_id].append(websocket)

    async def disconnect(self, websocket: WebSocket, scan_id: str):
        """Remove a WebSocket connection."""
        async with self._lock:
            if scan_id in self.active_connections:
                if websocket in self.active_connections[scan_id]:
                    self.active_connections[scan_id].remove(websocket)
                if not self.active_connections[scan_id]:
                    del self.active_connections[scan_id]

    async def broadcast(self, scan_id: str, event: WSEvent):
        """Broadcast an event to all connections for a scan."""
        if scan_id not in self.active_connections:
            return

        message = event.model_dump_json()
        disconnected = []

        for connection in self.active_connections[scan_id]:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.append(connection)

        for conn in disconnected:
            await self.disconnect(conn, scan_id)

    async def send_agent_created(
        self,
        scan_id: str,
        agent_id: str,
        name: str,
        task: str,
        parent_id: str | None = None,
    ):
        """Send agent created event."""
        event = WSEvent(
            type=WSEventType.AGENT_CREATED,
            data={
                "agent_id": agent_id,
                "name": name,
                "task": task,
                "parent_id": parent_id,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_agent_status_changed(
        self,
        scan_id: str,
        agent_id: str,
        status: str,
        error_message: str | None = None,
    ):
        """Send agent status changed event."""
        event = WSEvent(
            type=WSEventType.AGENT_STATUS_CHANGED,
            data={
                "agent_id": agent_id,
                "status": status,
                "error_message": error_message,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_tool_execution_start(
        self,
        scan_id: str,
        execution_id: int,
        agent_id: str,
        tool_name: str,
        args: dict[str, Any],
    ):
        """Send tool execution start event."""
        event = WSEvent(
            type=WSEventType.TOOL_EXECUTION_START,
            data={
                "execution_id": execution_id,
                "agent_id": agent_id,
                "tool_name": tool_name,
                "args": args,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_tool_execution_complete(
        self,
        scan_id: str,
        execution_id: int,
        status: str,
        result: Any = None,
    ):
        """Send tool execution complete event."""
        event = WSEvent(
            type=WSEventType.TOOL_EXECUTION_COMPLETE,
            data={
                "execution_id": execution_id,
                "status": status,
                "result": result,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_chat_message(
        self,
        scan_id: str,
        message_id: int,
        content: str,
        role: str,
        agent_id: str | None = None,
    ):
        """Send chat message event."""
        event = WSEvent(
            type=WSEventType.CHAT_MESSAGE,
            data={
                "message_id": message_id,
                "content": content,
                "role": role,
                "agent_id": agent_id,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_vulnerability_found(
        self,
        scan_id: str,
        vuln_id: str,
        title: str,
        severity: str,
        content: str,
    ):
        """Send vulnerability found event."""
        event = WSEvent(
            type=WSEventType.VULNERABILITY_FOUND,
            data={
                "id": vuln_id,
                "title": title,
                "severity": severity,
                "content": content,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_stats_update(
        self,
        scan_id: str,
        agents: int,
        tools: int,
        tokens: int,
        cost: float,
    ):
        """Send stats update event."""
        event = WSEvent(
            type=WSEventType.STATS_UPDATE,
            data={
                "agents": agents,
                "tools": tools,
                "tokens": tokens,
                "cost": cost,
            },
        )
        await self.broadcast(scan_id, event)

    async def send_scan_started(self, scan_id: str, config: dict[str, Any]):
        """Send scan started event."""
        event = WSEvent(
            type=WSEventType.SCAN_STARTED,
            data={"scan_id": scan_id, "config": config},
        )
        await self.broadcast(scan_id, event)

    async def send_scan_completed(
        self, scan_id: str, success: bool, result: str | None = None
    ):
        """Send scan completed event."""
        event = WSEvent(
            type=WSEventType.SCAN_COMPLETED,
            data={"scan_id": scan_id, "success": success, "result": result},
        )
        await self.broadcast(scan_id, event)


manager = ConnectionManager()
