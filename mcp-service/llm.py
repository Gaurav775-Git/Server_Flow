import os
import sys
from dotenv import load_dotenv
import requests

load_dotenv()

API_KEY = os.getenv("LLM_API_KEY")

# ✅ Fail fast if key is missing
if not API_KEY:
    sys.stderr.write("LLM_API_KEY is not set. Set it in environment variables.\n")
    raise ValueError("LLM_API_KEY environment variable is required")

MODEL = "meta-llama/llama-3.3-70b-instruct:free"


def ask_llm(messages, tools=None):
    payload = {"model": MODEL, "messages": messages}
    if tools:
        payload["tools"] = tools

    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        json=payload,
    )

    if response.status_code != 200:
        sys.stderr.write(f"LLM ERROR: {response.status_code} {response.text}\n")
        raise Exception(f"LLM request failed: {response.status_code}")

    return response.json()["choices"][0]["message"]