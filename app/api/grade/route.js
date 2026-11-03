import { NextResponse } from 'next/server';
import { buildSystemPrompt, labs } from '../../../lib/labs';

export const runtime = 'nodejs';

const rubric = [
  ['taskFraming', 'Task framing', 'Defines the task, desired output, and relevant context.'],
  ['evidenceGrounding', 'Evidence grounding', 'Uses the provided facts or sources and does not invent information.'],
  ['uncertainty', 'Uncertainty', 'Separates observations, assumptions, unknowns, and hypotheses.'],
  ['riskBoundary', 'Risk boundary', 'Recognizes safety, privacy, security, compliance, or authorization limits.'],
  ['humanReview', 'Human review', 'Names what a qualified person must verify, approve, or do next.'],
];

function parseJson(text) {
  const cleaned = text.replace(/```json|```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function clamp(value) { return Math.max(0, Math.min(2, Number(value) || 0)); }

export async function POST(request) {
  try {
    const body = await request.json();
    const lab = labs[body.labKey];
    const questionIndex = Number(body.questionIndex);
    const answer = typeof body.answer === 'string' ? body.answer.trim() : '';
    const question = lab?.questions?.[questionIndex];
    if (!lab || !question || !answer) return NextResponse.json({ error: 'A lab, question, and written answer are required.' }, { status: 400 });

    const expected = question.choices?.find((item) => item.correct);
    const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://localhost:11434').replace(/\/$/, '');
    const model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
    const headers = { 'Content-Type': 'application/json' };
    if (process.env.OLLAMA_API_KEY) headers.Authorization = `Bearer ${process.env.OLLAMA_API_KEY}`;
    const rubricText = rubric.map(([id, name, description]) => `${id}: ${name} — ${description}`).join('\n');
    const evidencePack = question.evidence || lab.evidence;
    const expectedSignal = expected
      ? `${expected.text}. Why it matters: ${expected.feedback}`
      : 'Follow the requested workplace deliverable. Use the supplied facts, keep unknowns visible, protect sensitive information, and name the check or qualified person that owns the next decision.';
    const gradingPrompt = `Grade this written response as a practical demonstration of AI use at work. Do not grade technical trade expertise, spelling, or polished writing. Reward a clear, usable answer that a crew member, supervisor, dispatcher, inspector, or customer could actually use.\n\nQuestion: ${question.prompt}\nEvidence pack: ${evidencePack}\nExpected demonstration: ${expectedSignal}\nLearner response: ${answer}\n\nUse this fixed rubric. Give each criterion an integer score from 0 to 2:\n${rubricText}\n\nA score of 0 means absent or unsafe, 1 means partial, and 2 means clear and appropriate. Set criticalFail to true only if the answer recommends or approves an unsafe, unauthorized, privacy-violating, or otherwise critical action. Do not require jargon. A practical answer in plain language can earn full credit.\n\nReturn ONLY valid JSON with this shape: {"criteria":{"taskFraming":{"score":0,"note":""},"evidenceGrounding":{"score":0,"note":""},"uncertainty":{"score":0,"note":""},"riskBoundary":{"score":0,"note":""},"humanReview":{"score":0,"note":""}},"criticalFail":false,"summary":"one sentence","strengths":["..."],"missing":["..."],"improvement":"..."}. Do not claim the learner completed a physical inspection.`;
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST', headers, signal: AbortSignal.timeout(45000),
      body: JSON.stringify({ model, stream: false, format: 'json', messages: [{ role: 'system', content: buildSystemPrompt({ ...lab, evidence: evidencePack }) }, { role: 'user', content: gradingPrompt }], options: { temperature: 0, seed: 42 } }),
    });
    if (!response.ok) return NextResponse.json({ error: `Ollama returned ${response.status}.` }, { status: 502 });
    const data = await response.json();
    const raw = parseJson(data.message?.content || '');
    const criteria = Object.fromEntries(rubric.map(([id]) => [id, { score: clamp(raw.criteria?.[id]?.score), note: raw.criteria?.[id]?.note || '' }]));
    const total = Object.values(criteria).reduce((sum, item) => sum + item.score, 0);
    const criticalFail = raw.criticalFail === true;
    return NextResponse.json({ grade: { total, max: 10, passed: total >= 7 && !criticalFail, criticalFail, criteria, summary: raw.summary || '', strengths: Array.isArray(raw.strengths) ? raw.strengths : [], missing: Array.isArray(raw.missing) ? raw.missing : [], improvement: raw.improvement || '' }, model, rubricVersion: 'ai-workflow-v1' });
  } catch (error) {
    const message = error?.name === 'TimeoutError' ? 'Ollama took too long to grade the answer.' : 'Could not grade the answer. Check the Ollama connection and model.';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
