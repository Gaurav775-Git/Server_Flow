import os
from dotenv import load_dotenv
import requests
import json

load_dotenv()

API_KEY = os.getenv("LLM_API_KEY")
MODEL = "cohere/north-mini-code:free"

def ask_llm(messages, tools=None):
    payload = {"model": MODEL, "messages": messages}
    if tools:
        payload["tools"] = tools

    response = requests.post(
        url="https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json=payload,
    )

    if response.status_code != 200:
        print("LLM ERROR:", response.status_code, response.text)
        raise Exception(f"LLM request failed: {response.status_code}")

    return response.json()["choices"][0]["message"]


# This below code is for testing the LLM okay boys ;) Harsh dekh lena test karnai kai liyai comment out karkai chala lena .

# if __name__ == "__main__":

#     while "true":
#         user_input = input("you : ")
#         if user_input.lower() == "quit":
#             break

#         msg = [{"role" : "user" , "content": user_input}]
#         res = ask_llm(msg)

#         print("LLM : " , res["content"]) 
