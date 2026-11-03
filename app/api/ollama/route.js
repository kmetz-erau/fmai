import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = String(body?.prompt || '').trim();
    const scenario = String(body?.scenario || '').trim();
    if (!prompt || !scenario) {
      return NextResponse.json({ error: 'A prompt and current job situation are required.' }, { status: 400 });
    }

    const baseUrl = (process.env.OLLAMA_BASE_URL || '').replace(/\/$/, '');
    const model = process.env.OLLAMA_MODEL || 'gemma4:31b';
    if (!baseUrl) return NextResponse.json({ error: 'OLLAMA_BASE_URL is not configured.' }, { status: 500 });

    const response = await fetch(`${baseUrl}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(process.env.OLLAMA_API_KEY ? { Authorization: `Bearer ${process.env.OLLAMA_API_KEY}` } : {}),
      },
      body: JSON.stringify({
        model,
        stream: false,
        prompt: `You are FM AI Tool, a coaching assistant inside a facilities workforce game.\n\nJOB SITUATION:\n${scenario}\n\nPLAYER PROMPT:\n${prompt}\n\nRespond in plain text only. Do not use Markdown symbols, tables, headings with #, or asterisks. Keep it practical and under 180 words. Help the player prepare, organize, compare, or draft. Do not make a safety-critical, code, chemical, electrical, traffic-control, or repair decision. Clearly label what is known, what is missing, what to verify, and who owns the final decision. If the prompt asks you to choose the final action, explain that a qualified human or approved procedure must decide.`,
        options: { temperature: 0.2, num_predict: 260 },
      }),
      signal: AbortSignal.timeout(45000),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) return NextResponse.json({ error: data?.error || `Ollama returned ${response.status}.` }, { status: 502 });
    return NextResponse.json({ response: String(data?.response || '').trim(), model });
  } catch (error) {
    const message = error?.name === 'TimeoutError' ? 'FM AI Tool timed out. Check that Ollama is running and reachable.' : 'Could not reach FM AI Tool. Check OLLAMA_BASE_URL and the model.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
