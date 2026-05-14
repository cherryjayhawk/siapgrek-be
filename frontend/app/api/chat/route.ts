import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY belum di-set di .env.local");
    }

    const groq = new Groq({ apiKey });

    const body = await req.json();
    const messages = body?.messages;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "messages tidak valid" },
        { status: 400 }
      );
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
    });

    return NextResponse.json({
      reply: completion.choices[0].message,
    });
  } catch (err: any) {
    console.error("❌ GROQ CHAT ERROR:", err);
    return NextResponse.json(
      {
        error: err?.message || "Groq API error",
      },
      { status: 500 }
    );
  }
}
