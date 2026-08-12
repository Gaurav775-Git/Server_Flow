import json
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from llm import ask_llm

app =  FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origin = ["*"],
    allow_method = ["*"],
    allow_headers = ["*"],
)

history = []

class ChatRequest(BaseModel):
    message : str

@app.post("/chat")
async def chat( req:ChatRequest):
    Server_params = StdioServerParameters(command="python" , args = "server.py")
    



