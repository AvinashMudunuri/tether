import { NextRequest } from "next/server";
import OpenAI from "openai";
import { getAuthUser, unauthorized, badRequest } from "@/lib/api-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type ParseResult =
  | { type: "task"; title: string; dueDate: string | null }
  | { type: "appointment"; title: string; date: string; time: string; datePhrase: string };

/**
 * Parses natural language into task or appointment.
 * Handles typos (tomorow, tommorow), natural phrases (call doctor tomorrow 5pm).
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

  const callOpenAI = async () => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

    return openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You parse natural language into either a task or appointment. Today is ${todayStr}.

Rules:
- If the user specifies BOTH a date AND time (e.g. "tomorrow 5pm", "Friday 3pm", "call doctor tomorow 5pm") → type: "appointment"
- If only a date or no date/time → type: "task"

Output JSON only, no markdown:
For appointment: {"type":"appointment","title":"...","date":"YYYY-MM-DD","time":"HH:mm","datePhrase":"..."}
For task: {"type":"task","title":"...","dueDate":"YYYY-MM-DD" or null}

- title: description without date/time. Handle typos (tomorow→tomorrow).
- date/dueDate: ISO YYYY-MM-DD. Interpret: today, tomorrow, tonight, weekdays, next week.
- time: 24h HH:mm (5pm→17:00, 10am→10:00). Default 09:00 if missing.
- datePhrase: human-readable (e.g. "tomorrow 5pm") for appointments.`,
        },
        {
          role: "user",
          content: input,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 150,
    });
  };

  try {
    let completion;
    try {
      completion = await callOpenAI();
    } catch (rateErr) {
      const msg = rateErr instanceof Error ? rateErr.message : String(rateErr);
      if (msg.includes("429") || msg.includes("rate limit")) {
        await new Promise((r) => setTimeout(r, 3000));
        completion = await callOpenAI();
      } else {
        throw rateErr;
      }
    }

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
      parsed = { ...parsed, title: input };
    }

    if (parsed.type === "appointment") {
      const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(parsed.date);
      const timeOk = /^\d{1,2}:\d{2}$/.test(parsed.time);
      if (!dateOk || !timeOk) {
        return Response.json({ error: "Invalid date/time from model" }, { status: 502 });
      }
      return Response.json({
        type: "appointment",
        title: parsed.title.trim(),
        date: parsed.date,
        time: parsed.time,
        datePhrase: parsed.datePhrase || "today",
      });
    }

    const dueDate =
      parsed.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(parsed.dueDate) ? parsed.dueDate : null;
    return Response.json({
      type: "task",
      title: parsed.title.trim(),
      dueDate,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const isQuota = msg.includes("429") || msg.includes("quota");
    if (isQuota) {
      console.warn("parse-quick-capture: OpenAI quota exceeded, client will use rule-based fallback");
    } else {
      console.error("parse-quick-capture error:", err);
    }
    return Response.json(
      { error: isQuota ? "API quota exceeded" : (err instanceof Error ? err.message : "Parse failed") },
      { status: isQuota ? 503 : 500 }
    );
  }
}
