"""Scan manager for coordinating Strix scans via subprocess."""
import asyncio
import json
import os
import subprocess
import uuid
from datetime import datetime
from pathlib import Path
from typing import Any

from .models import (
    Agent,
    AgentStatus,
    ChatMessage,
    LiveStats,
    ScanConfig,
    ScanRun,
    ToolExecution,
    ToolStatus,
    Vulnerability,
    Severity,
)
from .websocket_manager import manager as ws_manager


class ScanManager:
    """Manages scan runs and integrates with Strix CLI."""

    def __init__(self):
        self.scans: dict[str, ScanRun] = {}
        self._scan_processes: dict[str, subprocess.Popen] = {}
        self._scan_tasks: dict[str, asyncio.Task] = {}
        self._next_execution_id: dict[str, int] = {}
        self._next_message_id: dict[str, int] = {}

    def create_scan(self, config: ScanConfig, name: str | None = None) -> ScanRun:
        """Create a new scan run."""
        scan_id = name or f"scan-{uuid.uuid4().hex[:8]}"
        scan = ScanRun(id=scan_id, name=name, config=config)
        self.scans[scan_id] = scan
        self._next_execution_id[scan_id] = 1
        self._next_message_id[scan_id] = 1
        return scan

    def get_scan(self, scan_id: str) -> ScanRun | None:
        """Get a scan by ID."""
        return self.scans.get(scan_id)

    def list_scans(self) -> list[ScanRun]:
        """List all scans."""
        return list(self.scans.values())

    async def start_scan(self, scan_id: str) -> bool:
        """Start a scan in the background."""
        scan = self.scans.get(scan_id)
        if not scan:
            return False

        task = asyncio.create_task(self._run_scan(scan_id))
        self._scan_tasks[scan_id] = task
        return True

    async def stop_scan(self, scan_id: str) -> bool:
        """Stop a running scan."""
        if scan_id in self._scan_processes:
            proc = self._scan_processes[scan_id]
            proc.terminate()
            del self._scan_processes[scan_id]

        if scan_id in self._scan_tasks:
            self._scan_tasks[scan_id].cancel()
            del self._scan_tasks[scan_id]

        scan = self.scans.get(scan_id)
        if scan:
            scan.status = "stopped"
            scan.completed_at = datetime.utcnow()
            return True
        return False

    async def send_user_message(self, scan_id: str, message: str) -> bool:
        """Send a user message to the scan agent."""
        scan = self.scans.get(scan_id)
        if not scan:
            return False

        message_id = self._next_message_id[scan_id]
        self._next_message_id[scan_id] += 1

        chat_msg = ChatMessage(
            id=message_id,
            content=message,
            role="user",
        )
        scan.chat_messages.append(chat_msg)

        await ws_manager.send_chat_message(
            scan_id, message_id, message, "user"
        )
        return True

    async def _run_scan(self, scan_id: str):
        """Run the actual scan using Strix CLI subprocess."""
        scan = self.scans.get(scan_id)
        if not scan:
            return

        try:
            scan.status = "running"
            await ws_manager.send_scan_started(scan_id, scan.config.model_dump())

            # Build target arguments - Strix uses -t/--target for all types
            target_args = []
            for target in scan.config.targets:
                target_args.extend(["--target", target.value])

            # Find strix binary
            strix_path = Path.home() / ".local" / "bin" / "strix"
            if not strix_path.exists():
                # Try pipx location
                import shutil
                strix_path = shutil.which("strix")
                if not strix_path:
                    raise RuntimeError("Strix CLI not found. Please install via: pipx install strix-agent")

            # Build command (strix only supports: -t TARGET, --instruction, --run-name, -n)
            cmd = [
                str(strix_path),
                *target_args,
                "-n",  # Non-interactive mode
            ]

            # Add instruction if provided
            if scan.config.user_instructions:
                cmd.extend(["--instruction", scan.config.user_instructions])

            # Set environment - ensure API key is passed
            env = os.environ.copy()
            env["STRIX_LLM"] = scan.config.llm_model

            # Ensure LLM_API_KEY is set (check multiple sources)
            api_key = os.environ.get("LLM_API_KEY") or os.environ.get("OPENAI_API_KEY")
            if api_key:
                env["LLM_API_KEY"] = api_key

            # Add Docker and common binary paths to PATH
            docker_paths = "/Applications/Docker.app/Contents/Resources/bin:/usr/local/bin:/opt/homebrew/bin"
            current_path = env.get("PATH", "/usr/bin:/bin")
            env["PATH"] = f"{docker_paths}:{current_path}"

            # Disable Python buffering for real-time output
            env["PYTHONUNBUFFERED"] = "1"

            # Create root agent in UI
            root_agent_id = f"agent-{uuid.uuid4().hex[:8]}"
            root_agent = Agent(
                id=root_agent_id,
                name="Strix Agent",
                task="Security Scan",
                status=AgentStatus.RUNNING,
            )
            scan.agents[root_agent_id] = root_agent
            await ws_manager.send_agent_created(
                scan_id, root_agent_id, "Strix Agent", "Security Scan"
            )

            # Start the process
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
                env=env,
                cwd=str(Path(__file__).parent.parent.parent.parent),
            )

            exec_counter = 0

            # Read output and parse events
            async for line in process.stdout:
                line_text = line.decode().strip()
                if not line_text:
                    continue

                # Parse tool executions from output
                exec_counter += 1
                exec_id = exec_counter

                # Detect tool type from output patterns
                tool_name = "terminal"
                if "browser" in line_text.lower() or "http" in line_text.lower():
                    tool_name = "browser"
                elif "python" in line_text.lower():
                    tool_name = "python"
                elif "vulnerability" in line_text.lower() or "vuln" in line_text.lower():
                    tool_name = "reporting"
                elif "thinking" in line_text.lower() or "analyzing" in line_text.lower():
                    tool_name = "thinking"

                # Create tool execution
                tool_exec = ToolExecution(
                    id=exec_id,
                    agent_id=root_agent_id,
                    tool_name=tool_name,
                    args={"command": line_text[:200]},
                    status=ToolStatus.COMPLETED,
                    result=line_text,
                    completed_at=datetime.utcnow(),
                )
                scan.tool_executions[exec_id] = tool_exec

                await ws_manager.send_tool_execution_start(
                    scan_id, exec_id, root_agent_id, tool_name, {"output": line_text[:200]}
                )
                await ws_manager.send_tool_execution_complete(
                    scan_id, exec_id, "completed", line_text
                )

                # Update stats
                scan.stats.tools = len(scan.tool_executions)
                await ws_manager.send_stats_update(
                    scan_id,
                    scan.stats.agents,
                    scan.stats.tools,
                    scan.stats.tokens,
                    scan.stats.cost,
                )

                # Check for vulnerability reports in output
                if "VULNERABILITY" in line_text.upper() or "CVE-" in line_text:
                    vuln_id = f"vuln-{uuid.uuid4().hex[:8]}"
                    vuln = Vulnerability(
                        id=vuln_id,
                        title="Potential Vulnerability Detected",
                        content=line_text,
                        severity=Severity.MEDIUM,
                    )
                    scan.vulnerabilities.append(vuln)
                    await ws_manager.send_vulnerability_found(
                        scan_id, vuln_id, vuln.title, vuln.severity.value, vuln.content
                    )

            # Wait for process to complete
            return_code = await process.wait()

            # Mark agent as completed
            scan.agents[root_agent_id].status = AgentStatus.COMPLETED
            await ws_manager.send_agent_status_changed(
                scan_id, root_agent_id, "completed", None
            )

            # Mark scan completed
            if return_code == 0:
                scan.status = "completed"
            else:
                scan.status = "failed"
            scan.completed_at = datetime.utcnow()
            await ws_manager.send_scan_completed(scan_id, return_code == 0, f"Exit code: {return_code}")

        except asyncio.CancelledError:
            scan.status = "stopped"
            scan.completed_at = datetime.utcnow()
            await ws_manager.send_scan_completed(scan_id, False, "Scan cancelled")

        except Exception as e:
            scan.status = "failed"
            scan.completed_at = datetime.utcnow()
            error_msg = str(e)
            await ws_manager.send_scan_completed(scan_id, False, error_msg)

            # Update root agent to failed state
            for agent_id, agent in scan.agents.items():
                if agent.status == AgentStatus.RUNNING:
                    agent.status = AgentStatus.FAILED
                    agent.error_message = error_msg
                    await ws_manager.send_agent_status_changed(
                        scan_id, agent_id, "failed", error_msg
                    )


scan_manager = ScanManager()
