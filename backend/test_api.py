import asyncio
import os
import httpx
from langchain_openai import ChatOpenAI

async def test():
    # Try direct httpx with mock user-agent
    url = "https://agentrouter.org/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {os.environ.get('LLM_API_KEY', 'sk-OT3XJzZhBNCf1D2r9wG447WmlWchoOBjKAfcUkbW1rhZD6lW')}",
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "HTTP-Referer": "https://localhost:3000",
        "X-Title": "Roo Code"
    }
    data = {
        "model": "gpt-5.6-sol",
        "messages": [{"role": "user", "content": "hi"}]
    }
    async with httpx.AsyncClient() as client:
        r = await client.post(url, headers=headers, json=data)
        print("Direct HTTPX Status:", r.status_code)
        print("Direct HTTPX Response:", r.text)

if __name__ == "__main__":
    asyncio.run(test())
