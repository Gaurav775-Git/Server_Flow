import os
from dotenv import load_dotenv
import requests

load_dotenv()

API_KEY = os.getenv("LLM_API_KEY")

# ✅ Fail fast if key is missing
if not API_KEY:
    sys.stderr.write("LLM_API_KEY is not set. Set it in environment variables.\n")
    raise ValueError("LLM_API_KEY environment variable is required")

MODEL = "openrouter/free"


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
        print("LLM ERROR:", response.status_code, response.text)
        raise Exception(f"LLM request failed: {response.status_code} - {response.text}")

    return response.json()["choices"][0]["message"]


# ====================== TEST BLOCK ======================
# Run this file directly to test the LLM:
#     python llm.py

# if __name__ == "__main__":
#     print("=" * 60)
#     print("  Testing LLM Connection")
#     print("=" * 60)

#     masked_key = API_KEY[:10] + "..." + API_KEY[-4:]
#     print(f"API Key : {masked_key}")
#     print(f"Model   : {MODEL}")
#     print("-" * 60)

#     # Test 1: Simple prompt
#     print("\n[TEST 1] Simple prompt...")
#     try:
#         response = ask_llm([
#             {"role": "user", "content": "Say 'hello' and nothing else."}
#         ])
#         content = response.get("content", "")
#         print(f"Response: {content}")
#         print("✅ TEST 1 PASSED")
#     except Exception as e:
#         print(f"❌ TEST 1 FAILED: {e}")

#     # Test 2: Code generation
#     print("\n[TEST 2] Code generation...")
#     try:
#         response = ask_llm([
#             {
#                 "role": "user",
#                 "content": "Generate ONLY a single line of JavaScript that exports an Express app. No explanation."
#             }
#         ])
#         content = response.get("content", "")
#         print(f"Response: {content}")
#         print("✅ TEST 2 PASSED")
#     except Exception as e:
#         print(f"❌ TEST 2 FAILED: {e}")

#     # Test 3: Tool calling (optional)
#     print("\n[TEST 3] Tool calling...")
#     try:
#         tools = [{
#             "type": "function",
#             "function": {
#                 "name": "get_weather",
#                 "description": "Get weather for a city",
#                 "parameters": {
#                     "type": "object",
#                     "properties": {
#                         "city": {"type": "string"}
#                     },
#                     "required": ["city"],
#                 },
#             },
#         }]
#         response = ask_llm(
#             [{"role": "user", "content": "What's the weather in Tokyo?"}],
#             tools=tools,
#         )
#         if response.get("tool_calls"):
#             print(f"✅ TEST 3 PASSED — Tool used: {response['tool_calls'][0]['function']['name']}")
#         else:
#             print(f"⚠️  TEST 3 WARNING — No tool call made. Content: {response.get('content')}")
#     except Exception as e:
#         print(f"❌ TEST 3 FAILED: {e}")

#     print("\n" + "=" * 60)
#     print("  Done.")
#     print("=" * 60)