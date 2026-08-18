import json
import shutil
import os
from fastapi.responses import FileResponse
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from llm import ask_llm
from server import build_server_from_flow

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

history = []

class ChatRequest(BaseModel):
    message: str = ""
    master_json: dict | None = None

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.join(BASE_DIR, "user_project")


@app.get("/download")
async def download_project():
    zip_path = shutil.make_archive("project_export", "zip", BASE_DIR)
    return FileResponse(zip_path, media_type="application/zip", filename="project.zip")    

@app.post("/chat")
async def chat(req: ChatRequest):
    if req.master_json is not None:
        try:
            return {"reply": build_server_from_flow(req.master_json)}
        except (ValueError, json.JSONDecodeError) as exc:
            raise HTTPException(status_code=422, detail=f"Build failed: {exc}") from exc

    server_params = StdioServerParameters(command="python", args=["server.py"])

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            mcp_tools = (await session.list_tools()).tools
            tools = [{"type": "function", "function": {
                        "name": t.name, "description": t.description, "parameters": t.inputSchema}}
                      for t in mcp_tools]

            history.append({"role": "system", "content": "You are a Server Flow assistant. A React Flow graph uses HTTP nodes as API routes and DATABASE nodes as data-store notes. When a user provides a graph, call generate_server_from_flow; never guess missing endpoints. Keep replies short."})
            history.append({"role": "user", "content": req.message})

            while True:
                msg = ask_llm(history, tools)

                if msg.get("tool_calls"):
                    history.append(msg)
                    for call in msg["tool_calls"]:
                        args = json.loads(call["function"]["arguments"])
                        result = await session.call_tool(call["function"]["name"], args)
                        history.append({"role": "tool", "tool_call_id": call["id"],
                                         "content": result.content[0].text})
                    continue  
                
                history.append({"role": "assistant", "content": msg["content"]})
                return {"reply": msg["content"]}
