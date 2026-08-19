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
os.makedirs(PROJECT_DIR, exist_ok=True)

@app.get("/download")
async def download_project():
    """Download the entire user_project folder as a zip file."""
    try:
        # Check if project directory exists and has content
        if not os.path.exists(PROJECT_DIR):
            raise HTTPException(status_code=404, detail="Project directory not found")
        
        if not os.listdir(PROJECT_DIR):
            raise HTTPException(status_code=404, detail="Project directory is empty")
        
        # Create zip file name with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"server_flow_project_{timestamp}"
        zip_path = os.path.join(BASE_DIR, f"{zip_filename}.zip")
        
        # Create zip of user_project folder
        shutil.make_archive(zip_filename, "zip", PROJECT_DIR)
        
        # Check if zip was created successfully
        if not os.path.exists(zip_path):
            raise HTTPException(status_code=500, detail="Failed to create zip file")
        
        # Return zip file for download
        return FileResponse(
            zip_path,
            media_type="application/zip",
            filename=f"server_flow_project_{timestamp}.zip"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")
    
    finally:
        # Clean up the zip file after sending
        try:
            if os.path.exists(zip_path):
                os.remove(zip_path)
        except:
            pass

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

            if req.master_json is not None:
                try:
                    validation_result = await session.call_tool("validate_flow", {"flow": req.master_json})
                    if validation_result.isError:
                        error_msg = validation_result.content[0].text
                        return {"reply": f"Flow validation failed: {error_msg}"}
                    
                    result = await session.call_tool("generate_server_from_flow", {"flow": req.master_json})
                    outcome = result.content[0].text
                    
                    if result.isError:
                        error_msg = outcome
                        suggestion = "Please ensure all HTTP nodes have an endpoint starting with '/' and all required fields are filled."
                        msg = ask_llm([system, {"role": "user", "content": f"MCP build error: {error_msg}. Provide suggestion in one sentence."}])
                        return {"reply": f"{error_msg}. {msg.get('content', suggestion)}"}
                    
                    msg = ask_llm([system, {"role": "user", "content": f"MCP build result: {outcome}. Confirm the build in one sentence."}])
                    return {"reply": msg.get("content") or outcome}
                    
                except Exception as e:
                    return {"reply": f"Error processing workflow: {str(e)}. Please check your node configurations."}

            try:
                project_state = await session.call_tool("project_files", {"action": "list"})
                state_text = project_state.content[0].text
            except Exception as e:
                state_text = f"Error reading project: {str(e)}"

            history.clear()
            history.append(system)
            history.append({"role": "system", "content": f"MCP project file list: {state_text}"})
            history.append({"role": "user", "content": req.message})

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
                
                history.append({"role": "assistant", "content": msg["content"]})
                return {"reply": msg["content"]}