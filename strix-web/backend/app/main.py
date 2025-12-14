"""Main FastAPI application for Strix Web Dashboard."""
import os
from pathlib import Path

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .models import ScanConfig, Target, TargetType, ExportFormat
from .scan_manager import scan_manager
from .websocket_manager import manager as ws_manager

app = FastAPI(
    title="Strix Web Dashboard",
    description="Web interface for Strix AI Security Scanner",
    version="0.1.0",
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class StartScanRequest(BaseModel):
    targets: list[dict]
    user_instructions: str = ""
    llm_model: str = "openai/gpt-4o"
    max_iterations: int = 300
    name: str | None = None


class UserMessageRequest(BaseModel):
    message: str


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Strix Web Dashboard API", "version": "0.1.0"}


@app.get("/api/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


@app.post("/api/scans")
async def create_scan(request: StartScanRequest):
    """Create and start a new scan."""
    targets = []
    for t in request.targets:
        target_type = t.get("type", "local_code")
        target = Target(
            type=TargetType(target_type),
            value=t.get("value", ""),
            workspace_subdir=t.get("workspace_subdir"),
        )
        targets.append(target)

    config = ScanConfig(
        targets=targets,
        user_instructions=request.user_instructions,
        llm_model=request.llm_model,
        max_iterations=request.max_iterations,
    )

    scan = scan_manager.create_scan(config, request.name)
    await scan_manager.start_scan(scan.id)

    return {
        "id": scan.id,
        "status": scan.status,
        "message": "Scan started successfully",
    }


@app.get("/api/scans")
async def list_scans():
    """List all scans."""
    scans = scan_manager.list_scans()
    return {
        "scans": [
            {
                "id": s.id,
                "name": s.name,
                "status": s.status,
                "started_at": s.started_at.isoformat(),
                "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                "vulnerabilities_count": len(s.vulnerabilities),
                "agents_count": len(s.agents),
            }
            for s in scans
        ]
    }


@app.get("/api/scans/{scan_id}")
async def get_scan(scan_id: str):
    """Get scan details."""
    scan = scan_manager.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {
        "id": scan.id,
        "name": scan.name,
        "status": scan.status,
        "config": scan.config.model_dump(),
        "agents": {k: v.model_dump() for k, v in scan.agents.items()},
        "tool_executions": {k: v.model_dump() for k, v in scan.tool_executions.items()},
        "chat_messages": [m.model_dump() for m in scan.chat_messages],
        "vulnerabilities": [v.model_dump() for v in scan.vulnerabilities],
        "stats": scan.stats.model_dump(),
        "started_at": scan.started_at.isoformat(),
        "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
    }


@app.post("/api/scans/{scan_id}/stop")
async def stop_scan(scan_id: str):
    """Stop a running scan."""
    success = await scan_manager.stop_scan(scan_id)
    if not success:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Scan stopped", "id": scan_id}


@app.post("/api/scans/{scan_id}/message")
async def send_message(scan_id: str, request: UserMessageRequest):
    """Send a message to the scan agent."""
    success = await scan_manager.send_user_message(scan_id, request.message)
    if not success:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"message": "Message sent", "id": scan_id}


@app.get("/api/scans/{scan_id}/vulnerabilities")
async def get_vulnerabilities(scan_id: str):
    """Get vulnerabilities for a scan."""
    scan = scan_manager.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    return {
        "vulnerabilities": [v.model_dump() for v in scan.vulnerabilities],
        "summary": {
            "critical": sum(1 for v in scan.vulnerabilities if v.severity.value == "critical"),
            "high": sum(1 for v in scan.vulnerabilities if v.severity.value == "high"),
            "medium": sum(1 for v in scan.vulnerabilities if v.severity.value == "medium"),
            "low": sum(1 for v in scan.vulnerabilities if v.severity.value == "low"),
            "info": sum(1 for v in scan.vulnerabilities if v.severity.value == "info"),
        },
    }


@app.get("/api/scans/{scan_id}/report")
async def get_report(scan_id: str):
    """Get the full markdown report for a scan."""
    scan = scan_manager.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    # Check if scan has a run_name (completed scan with file system report)
    if not scan.run_name:
        raise HTTPException(status_code=404, detail="Report not yet available. Scan may still be running.")

    # Get report content from file system
    report_content = scan_manager.report_service.get_report_content(scan.run_name)
    if not report_content:
        raise HTTPException(status_code=404, detail="Report file not found")

    # Get vulnerabilities list
    vulnerabilities_list = scan_manager.report_service.list_vulnerabilities(scan.run_name)

    return {
        "report": report_content,
        "vulnerabilities": vulnerabilities_list,
        "run_name": scan.run_name,
        "generated_at": scan.completed_at.isoformat() if scan.completed_at else None,
    }


@app.get("/api/scans/{scan_id}/export")
async def export_report(scan_id: str, format: str = "md"):
    """Export report in the specified format (md, json, csv, pdf)."""
    scan = scan_manager.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if not scan.run_name:
        raise HTTPException(status_code=404, detail="Report not yet available")

    # Validate format
    try:
        export_format = ExportFormat(format.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid format. Supported: md, json, csv, pdf")

    # Export to the specified format
    export_bytes = scan_manager.report_service.export_to_format(scan.run_name, export_format.value)
    if not export_bytes:
        raise HTTPException(status_code=500, detail="Failed to export report")

    # Determine content type and filename
    content_types = {
        "md": "text/markdown",
        "json": "application/json",
        "csv": "text/csv",
        "pdf": "application/pdf",
    }

    extensions = {
        "md": "md",
        "json": "json",
        "csv": "csv",
        "pdf": "pdf",
    }

    content_type = content_types.get(export_format.value, "application/octet-stream")
    extension = extensions.get(export_format.value, "txt")
    filename = f"{scan.run_name}_report.{extension}"

    return Response(
        content=export_bytes,
        media_type=content_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


@app.get("/api/scans/{scan_id}/vulnerabilities/{vuln_id}/report")
async def get_vulnerability_report(scan_id: str, vuln_id: str):
    """Get detailed report for a specific vulnerability."""
    scan = scan_manager.get_scan(scan_id)
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")

    if not scan.run_name:
        raise HTTPException(status_code=404, detail="Report not yet available")

    # Get vulnerability report from file system
    vuln_report = scan_manager.report_service.get_vulnerability_report(scan.run_name, vuln_id)
    if not vuln_report:
        raise HTTPException(status_code=404, detail="Vulnerability report not found")

    return vuln_report


@app.websocket("/ws/{scan_id}")
async def websocket_endpoint(websocket: WebSocket, scan_id: str):
    """WebSocket endpoint for real-time scan updates."""
    await ws_manager.connect(websocket, scan_id)
    try:
        # Send initial state if scan exists
        scan = scan_manager.get_scan(scan_id)
        if scan:
            initial_data = {
                "type": "initial_state",
                "data": {
                    "id": scan.id,
                    "status": scan.status,
                    "agents": {k: v.model_dump(mode='json') for k, v in scan.agents.items()},
                    "tool_executions": {
                        str(k): v.model_dump(mode='json') for k, v in scan.tool_executions.items()
                    },
                    "vulnerabilities": [v.model_dump(mode='json') for v in scan.vulnerabilities],
                    "stats": scan.stats.model_dump(mode='json'),
                },
            }
            await websocket.send_json(initial_data)

        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            # Handle user messages from WebSocket
            import json
            try:
                msg = json.loads(data)
                if msg.get("type") == "user_message":
                    await scan_manager.send_user_message(scan_id, msg.get("content", ""))
            except json.JSONDecodeError:
                pass

    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket, scan_id)


# Serve frontend static files in production
frontend_dist = Path(__file__).parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
