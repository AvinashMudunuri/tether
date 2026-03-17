import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ParseResult = {
  title: string;
  dueDate: string | null;
  dueTime: string | null;
};

/**
 * Parses natural language task input into structured data.
 * Example: "Pay electricity bill tomorrow 7pm" → { title: "Pay electricity bill", dueDate: "2025-03-13", dueTime: "19:00" }
 */
export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return unauthorized();

  let body: { input?: string };
  try {
    body = await request.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const input = body.input?.trim();
  if (!input || input.length < 2) {
    return badRequest("Input is required");
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json(
      { error: "OpenAI API key not configured" },
      { status: 503 }
    );
  }

  try {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You parse natural language task input into JSON. Today's date is ${todayStr}. Extract:
- title: the task description (without date/time phrases). Required.
- dueDate: ISO date YYYY-MM-DD if a date is mentioned (today, tomorrow, Friday, next week, etc.), else null.
- dueTime: 24-hour time HH:mm if a time is mentioned (7pm→19:00, 10am→10:00), else null.

Return ONLY valid JSON, no markdown. Use 24h for dueTime. Example: {"title":"Pay electricity bill","dueDate":"2025-03-13","dueTime":"19:00"}`,
        },
        {
          role: "user",
          content: input,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) {
      return Response.json({ error: "No response from model" }, { status: 502 });
    }

    let parsed: ParseResult;
    try {
      parsed = JSON.parse(text) as ParseResult;
    } catch {
      return Response.json({ error: "Invalid model response" }, { status: 502 });
    }

    if (!parsed.title?.trim()) {
      parsed.title = input;
    }

    return Response.json({
      title: parsed.title.trim(),
      dueDate: parsed.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.dueDate) ? parsed.dueDate : null,
      dueTime: parsed.dueTime && /^\d{1,2}:\d{2}$/.test(String(parsed.dueTime)) ? String(parsed.dueTime) : null,
    });
  } catch (err) {
    console.error("parse-task error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Parse failed" },
      { status: 500 }
    );
  }
}
