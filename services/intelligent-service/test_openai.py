import asyncio
from openai import AsyncOpenAI
import os
from dotenv import load_dotenv

load_dotenv("../../.env")

async def main():
    api_key = os.getenv("OPENAI_API_KEY")
    client = AsyncOpenAI(api_key=api_key)
    
    messages = [
        {"role": "user", "content": "hello"}
    ]
    
    print("Calling OpenAI...")
    resp = await client.chat.completions.create(
        model="gpt-5-nano-2025-08-07",
        messages=messages,
        max_completion_tokens=2000
    )
    
    print("Response:", resp.choices[0].message)

if __name__ == "__main__":
    asyncio.run(main())
