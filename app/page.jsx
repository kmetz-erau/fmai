'use client';

import { useEffect, useMemo, useState } from 'react';

const calls = [
  { trade: 'BAS / Controls', title: 'Warm classroom before first bell', scene: 'Conference Room 204 is 76°F with a 72°F setpoint. The BAS shows a 100% damper command, but nobody has confirmed physical airflow. The first class starts in 25 minutes.', goal: 'Write what you would do next. Include how AI could help, what you would check in the field, and what you would not assume.', good: ['field', 'airflow', 'check', 'verify', 'occupant'], danger: ['replace', 'failed actuator', 'definitely', 'reset'], time: 25 },
  { trade: 'Fleet / Equipment', title: 'Fault code before the morning route', scene: 'A dump truck shows E-47. The operator says it still starts, but the photo does not show the make, model, or engine hours. The route leaves in 40 minutes.', goal: 'Write your next move as the fleet mechanic or lead. Show how you would use AI without letting it guess the repair.', good: ['make', 'model', 'manual', 'oem', 'verify', 'mechanic'], danger: ['order', 'replace', 'always means', 'generic'], time: 40 },
  { trade: 'Water / Wastewater', title: 'Changed treated-water reading', scene: 'A coworker asks AI what chlorine feed setting to use after a treated-water reading changes. The current SOP and operator-in-charge are available.', goal: 'Write the safe response and the questions you would prepare. Do not choose a dosing value.', good: ['sop', 'operator', 'stop', 'verify', 'qualified', 'question'], danger: ['setting', 'dose', 'dosing value', 'increase', 'decrease'], time: 15 },
  { trade: 'Roads / DOT', title: 'Road crew briefing before departure', scene: 'The crew has an approved location list, weather forecast, traffic-control plan, and material quantities. One road name does not match across two documents.', goal: 'Write the five-minute action plan before trucks leave the yard. Explain where AI fits and what still needs a qualified review.', good: ['compare', 'approved', 'traffic', 'review', 'question', 'crew'], danger: ['create a new plan', 'approve', 'ignore', 'same as'], time: 30 },
  { trade: 'Electrical', title: 'Water near a receptacle circuit', scene: 'A portable heater was plugged in, the circuit tripped twice, and a damp ceiling tile is visible nearby. No qualified test has been recorded.', goal: 'Write the message and escalation steps you would use. Do not give reset or panel instructions.', good: ['stop', 'notify', 'qualified', 'escalate', 'water', 'do not'], danger: ['reset', 'try another outlet', 'open the panel', 'energized'], time: 10 },
  { trade: 'Plumbing', title: 'Occupant update after a ceiling leak', scene: 'The area was dried and protected. A repair is scheduled, but the source is not confirmed and the occupant wants to know whether the issue is fixed.', goal: 'Write the update you would send using only verified facts. Keep the message useful without promising the source is fixed.', good: ['verified', 'scheduled', 'not confirmed', 'update', 'contact', 'today'], danger: ['fixed', 'guarantee', 'never happen', 'definitely'], time: 20 },
];

function evaluate(call, response) {
  const text = response.toLowerCase();
  const goodHits = call.good.filter((word) => text.includes(word)).length;
  const dangerHits = call.danger.filter((word) => text.includes(word)).length;
  const hasAction = /first|next|ask|check|send|notify|review|stop|write|compare|use ai|use the ai/.test(text);
  const score = Math.max(0, Math.min(100, 35 + goodHits * 10 + (hasAction ? 10 : 0) - dangerHits * 18));
  const safe = dangerHits === 0 || (text.includes('do not') && dangerHits <= 1);
  return { score, safe, goodHits, dangerHits, summary: score >= 75 && safe ? 'Strong field judgment.' : score >= 55 && safe ? 'Usable plan, but one part needs a clearer check.' : 'This move needs a review before it reaches the crew.' };
}

function ShiftGame() {
  const [callIndex, setCallIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [results, setResults] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [bestScore, setBestScore] = useState(null);
  const call = calls[callIndex];
  const totalScore = results.reduce((sum, item) => sum + item.score, 0);
  const currentResult = submitted ? evaluate(call, response) : null;
  const finished = results.length === calls.length;

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('facilities-ai-field-lab-open-shift-best'));
    if (saved) setBestScore(saved);
  }, []);

  function submitMove(event) {
    event.preventDefault();
    if (!response.trim()) return;
    setSubmitted(true);
  }

  function nextCall() {
    const result = evaluate(call, response);
    const nextResults = [...results, { ...result, title: call.title, response }];
    setResults(nextResults);
    setSubmitted(false);
    setResponse('');
    if (callIndex < calls.length - 1) setCallIndex(callIndex + 1);
    const nextScore = nextResults.reduce((sum, item) => sum + item.score, 0);
    if (nextResults.length === calls.length && (!bestScore || nextScore > bestScore)) { setBestScore(nextScore); window.localStorage.setItem('facilities-ai-field-lab-open-shift-best', String(nextScore)); }
  }

  function restart() { setCallIndex(0); setResponse(''); setResults([]); setSubmitted(false); }

  if (finished) return <section className="gameScreen"><div className="gameTop"><div><span className="eyebrow">FACILITIES AI FIELD LAB · OPEN SHIFT</span><h1>Shift report</h1><p>You made the calls. The score reflects the quality of your plan, your verification habits, and your safety boundaries.</p></div></div><div className="shiftComplete"><span className="gameBadge">SHIFT COMPLETE</span><h2>{totalScore >= 420 ? 'You protected the work.' : totalScore >= 300 ? 'Good shift. Tighten the checks.' : 'The crew needs a review.'}</h2><div className="scoreBreakdown"><span><b>{totalScore}</b> total points</span><span><b>{results.filter((item) => item.safe).length}</b> safe decisions</span><span><b>{bestScore ?? totalScore}</b> best score</span></div><div className="reportList">{results.map((item) => <div key={item.title}><b>{item.title}</b><span>{item.score}/100 · {item.summary}</span></div>)}</div><button className="primaryCta" onClick={restart}>Start another shift <span>↻</span></button></div></section>;

  return <section className="gameScreen"><div className="gameTop"><div><span className="eyebrow">FACILITIES AI FIELD LAB · OPEN SHIFT</span><h1>The Shift</h1><p>You are running the desk today. Read the call, write your move, and live with the result.</p></div><div className="gameRule"><b>No answer choices.</b><span>Type the action you would actually take.</span></div></div><div className="gameHud"><div><span>SHIFT SCORE</span><strong>{totalScore}</strong></div><div><span>CALL</span><strong>{callIndex + 1}/{calls.length}</strong></div><div><span>BEST SCORE</span><strong>{bestScore ?? '—'}</strong></div></div><div className="openGameBoard"><aside className="callQueue"><div className="boardHeading"><span className="eyebrow">CALL QUEUE</span><small>Open calls</small></div>{calls.map((item, index) => <div key={item.title} className={`openCall ${index === callIndex ? 'active' : ''} ${index < callIndex ? 'done' : ''}`}><span>{index < callIndex ? '✓' : `0${index + 1}`}</span><div><b>{item.title}</b><small>{item.trade}</small></div></div>)}</aside><div className="openJob"><div className="jobDetailHead"><span className="jobNumber">0{callIndex + 1}</span><div><span className="eyebrow">{call.trade} · {call.time} MINUTES</span><h2>{call.title}</h2></div></div><div className="situationBox"><span>INCOMING CALL</span><p>{call.scene}</p></div>{!submitted ? <form className="moveForm" onSubmit={submitMove}><label htmlFor="move">{call.goal}</label><textarea id="move" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Type what you would do next…" rows={9} /><div className="moveFooter"><small>Include the action, how AI fits, what you will verify, and who owns the decision.</small><button className="primaryCta" disabled={!response.trim()}>Submit move <span>→</span></button></div></form> : <div className={`moveResult ${currentResult.safe && currentResult.score >= 75 ? 'good' : currentResult.safe ? 'warn' : 'bad'}`}><span className="outcomeBadge">{currentResult.safe && currentResult.score >= 75 ? 'GOOD MOVE' : currentResult.safe ? 'NEEDS A CHECK' : 'RISK DETECTED'}</span><h2>{currentResult.summary}</h2><p><b>Your move:</b> {response}</p><p>{currentResult.dangerHits ? 'The move contains a risky or unsupported action. Rewrite it before the crew acts.' : 'You identified a workable next step. Keep the human check visible.'}</p><div className="outcomePoints">{currentResult.score}/100</div><button className="primaryCta" onClick={nextCall}>{callIndex === calls.length - 1 ? 'See shift report' : 'Take next call'} <span>→</span></button></div>}</div></div></section>;
}

export default function Home() {
  return <><header className="topbar"><div className="homeBrand"><span className="homeMark" aria-hidden="true"><span className="homeGlyph" /></span><span className="brand">FACILITIES <span>AI</span> FIELD LAB</span></div><div className="topmeta">THE SHIFT<br />OPEN-ENDED DECISION GAME</div></header><main className="shell"><ShiftGame /></main></>;
}
