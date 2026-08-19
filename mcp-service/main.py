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
    server_params = StdioServerParameters(command="python", args=["server.py"])

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            mcp_tools = (await session.list_tools()).tools
            tools = [{"type": "function", "function": {
                        "name": t.name, "description": t.description, "parameters": t.inputSchema}}
                      for t in mcp_tools]

            system = {"role": "system", "content": """You are a Server Flow assistant. 
Always use MCP tools before answering. Use project_files for file work. 
React Flow HTTP nodes are API routes, DATABASE nodes are data-store notes, and AUTH nodes are authentication notes. 
Keep replies short and helpful."""}

            # Handle master_json workflow generation
            if req.master_json is not None:
                try:
                    # First validate the flow
                    validation_result = await session.call_tool("validate_flow", {"flow": req.master_json})
                    if validation_result.isError:
                        error_msg = validation_result.content[0].text
                        return {"reply": f"❌ Flow validation failed: {error_msg}"}
                    
                    # Generate server from flow
                    result = await session.call_tool("generate_server_from_flow", {"flow": req.master_json})
                    outcome = result.content[0].text
                    
                    if result.isError:
                        error_msg = outcome
                        # Try to get a more helpful error message
                        suggestion = "Please ensure all HTTP nodes have an endpoint starting with '/' and all required fields are filled."
                        msg = ask_llm([system, {"role": "user", "content": f"MCP build error: {error_msg}. Provide suggestion in one sentence."}])
                        return {"reply": f"❌ {error_msg}. 💡 {msg.get('content', suggestion)}"}
                    
                    # Confirm build
                    msg = ask_llm([system, {"role": "user", "content": f"MCP build result: {outcome}. Confirm the build in one sentence."}])
                    return {"reply": msg.get("content") or outcome}
                    
                except Exception as e:
                    return {"reply": f"❌ Error processing workflow: {str(e)}. Please check your node configurations."}

            # Regular chat - get project state
            try:
                project_state = await session.call_tool("project_files", {"action": "list"})
                state_text = project_state.content[0].text
            except Exception as e:
                state_text = f"Error reading project: {str(e)}"

            # Build conversation history
            history.clear()
            history.append(system)
            history.append({"role": "system", "content": f"MCP project file list: {state_text}"})
            history.append({"role": "user", "content": req.message})

            # Handle tool calls loop
            while True:
                msg = ask_llm(history, tools)

                if msg.get("tool_calls"):
                    history.append(msg)
                    for call in msg["tool_calls"]:
                        try:
                            args = json.loads(call["function"]["arguments"])
                            result = await session.call_tool(call["function"]["name"], args)
                            tool_result = result.content[0].text
                            history.append({
                                "role": "tool", 
                                "tool_call_id": call["id"],
                                "content": tool_result
                            })
                        except Exception as e:
                            history.append({
                                "role": "tool",
                                "tool_call_id": call["id"],
                                "content": f"Error executing tool: {str(e)}"
                            })
                    continue  
                
                # No more tool calls, return final response
                history.append({"role": "assistant", "content": msg["content"]})
                return {"reply": msg["content"]}