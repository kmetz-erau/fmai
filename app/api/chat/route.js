import { NextResponse } from 'next/server';
import { buildSystemPrompt, labs } from '../../../lib/labs';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const body = await request.json();
    const lab = labs[body.labKey];
    const question = lab?.questions?.[Number(body.questionIndex)];
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';

    if (!lab || !prompt) {
      return NextResponse.json({ error: 'A lab and question are required.' }, { status: 400 });
    }

    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
    const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.OLLAMA_API_KEY) {
      headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: buildSystemPrompt({ ...lab, evidence: question?.evidence || lab.evidence }) },
          { role: 'user', content: prompt },
        ],
        options: { temperature: 0.2 },
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json({ error: `Ollama returned ${response.status}. ${detail.slice(0, 240)}` }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({
      answer: data.message?.content || 'Ollama returned no answer.',
      model,
    });
  } catch (error) {
    const message = error?.name === 'TimeoutError'
      ? 'Ollama took too long to respond.'
      : 'Could not reach Ollama. Check OLLAMA_BASE_URL and make sure the model is running.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
