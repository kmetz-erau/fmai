'use client';

import { useEffect, useMemo, useState } from 'react';

const stops = [
  { name: 'Shop Yard', trade: 'START HERE', title: 'Meet your new helper', scene: 'Before the trucks leave, your supervisor hands you a messy note about a repair. You have ten minutes to turn it into something useful for the next person.', lesson: 'A good AI request works like a good work order: give it context, say who will read the result, ask for one specific job, choose a format, and tell it what to flag.', hint: 'Try to include: who you are, what is happening, who needs the result, the format you want, and “do not invent missing facts.”', quick: ['Build a first prompt', 'Ask for a checklist', 'Show me the CRAFT pattern'] },
  { name: 'Classroom 204', trade: 'BAS / CONTROLS', title: 'The warm-room call', scene: 'Conference Room 204 is 76°F with a 72°F setpoint. The BAS shows a 100% damper command, but nobody has confirmed physical airflow. The first class starts in 25 minutes.', lesson: 'AI can help prepare field questions and organize evidence. It cannot turn a screen command into a confirmed physical condition.', hint: 'Ask for the next checks, not a replacement part. Keep the observation, the guess, and the human check separate.', quick: ['Plan the field check', 'Separate fact from guess', 'Prepare questions for the occupant'] },
  { name: 'Parts Counter', trade: 'FLEET / EQUIPMENT', title: 'The missing model number', scene: 'A dump truck shows E-47. The operator says it still starts, but the photo does not show the make, model, or engine hours. The route leaves in 40 minutes.', lesson: 'AI is useful for finding missing information and preparing vendor questions. It is not a substitute for the OEM manual or a mechanic.', hint: 'Give AI the context it needs. Ask it to mark what is missing instead of guessing what the code means.', quick: ['Build an intake checklist', 'Prepare vendor questions', 'Check the source'] },
  { name: 'Treatment Plant', trade: 'WATER / WASTEWATER', title: 'The red-line decision', scene: 'A coworker asks AI what chlorine feed setting to use after a treated-water reading changes. The current SOP and operator-in-charge are available.', lesson: 'Some decisions are not delegated. AI may help prepare questions, but the SOP and qualified operator control the action.', hint: 'When the stakes are high, stop the AI workflow at preparation. Name the source and person who must decide.', quick: ['Find the stop condition', 'Prepare questions for the operator', 'Check the SOP boundary'] },
  { name: 'Road Crew Yard', trade: 'ROADS / DOT', title: 'Two names for one road', scene: 'The crew has an approved location list, weather forecast, traffic-control plan, and material quantities. One road name does not match across two documents.', lesson: 'Use AI to compare records and surface mismatches. Do not ask it to approve a traffic-control plan.', hint: 'A good move tells the crew what was compared, what does not match, and who resolves it before departure.', quick: ['Compare the documents', 'Build the crew briefing', 'List questions for the reviewer'] },
  { name: 'Occupied Building', trade: 'ELECTRICAL / PLUMBING', title: 'Water near electricity', scene: 'A portable heater was plugged in, the circuit tripped twice, and a damp ceiling tile is visible nearby. No qualified test has been recorded.', lesson: 'AI can draft a safe escalation message. It must not authorize a reset, panel work, or an improvised workaround.', hint: 'Your move should protect people first, notify the right person, and state what is not yet known.', quick: ['Draft a safe escalation', 'Find the stop condition', 'Write the holding message'] },
  { name: 'End of Shift', trade: 'DEBRIEF', title: 'Make the lesson reusable', scene: 'The shift is ending. You used AI on several calls. Your supervisor asks which use was actually helpful and what rule the crew should carry into tomorrow.', lesson: 'A useful AI habit becomes a reusable shop card: task, approved input, prompt, check, human owner, and stop condition.', hint: 'Explain what AI helped with, what you changed, and when the crew should not use it.', quick: ['Make a shop card', 'Review the day', 'Set a crew rule'] },
];

const starterPatterns = {
  'Build a first prompt': 'Context: I am a [role] handling [situation]. Reader: This is for [person]. Ask: Help me [one task]. Format: Give me [checklist / questions / short message]. Truth-check: Do not invent facts; mark what needs verification.',
  'Ask for a checklist': 'Turn the information below into a short checklist. Use only the supplied facts. Mark anything that needs a field check or qualified review.',
  'Show me the CRAFT pattern': 'Use CRAFT: Context, Reader, Ask, Format, Truth-check. Show me how each part would look for this job.',
  'Plan the field check': 'Turn these facts into the next three observations or measurements. Do not diagnose or choose a repair.',
  'Separate fact from guess': 'Sort this into observed facts, possible explanations, and missing evidence. Keep unknowns visible.',
  'Prepare questions for the occupant': 'Write three plain-language questions for the occupant and explain what each answer would help us check.',
  'Build an intake checklist': 'Create a short intake checklist. Mark the information that is missing and do not guess the fault-code meaning.',
  'Prepare vendor questions': 'Write the questions a vendor must answer before we order a part or schedule work. Do not approve the option.',
  'Check the source': 'Tell me what source or qualified person must verify this before anyone acts. Point out what AI cannot know from these notes.',
  'Find the stop condition': 'Identify whether this crosses a safety, code, compliance, or authorization boundary. State what AI may prepare and what must stay human.',
  'Prepare questions for the operator': 'Prepare questions for the operator-in-charge using the SOP. Do not recommend a chemical setting or treatment change.',
  'Check the SOP boundary': 'Compare this request with the supplied SOP boundary. Mark any action AI must not choose.',
  'Compare the documents': 'Compare these documents and list matching facts, mismatches, and questions. Do not approve the plan.',
  'Build the crew briefing': 'Turn the approved information into a five-minute crew briefing with locations, materials, open questions, and stop conditions.',
  'List questions for the reviewer': 'Write the questions the qualified reviewer must answer before the crew starts. Do not sign off the plan.',
  'Draft a safe escalation': 'Draft a short escalation message using only verified facts. Name the hazard, what has not been checked, and who must respond.',
  'Write the holding message': 'Write a plain-language holding message that says what is being checked, what is not known, and who will make the decision.',
  'Make a shop card': 'Turn this successful workflow into a reusable shop card with: task, inputs, prompt, check, human owner, and stop condition.',
  'Review the day': 'Review the day and list what AI saved, what had to be corrected, and one reason to keep or change the workflow.',
  'Set a crew rule': 'Write one plain-language crew rule for using AI at work and one example of when the rule says stop.',
};

function scoreMove(stop, response) {
  const text = response.toLowerCase();
  const helpful = ['check', 'verify', 'source', 'manual', 'sop', 'qualified', 'human', 'question', 'field', 'review', 'do not', 'unknown', 'missing', 'ai'];
  const dangerous = ['reset', 'replace', 'approve', 'definitely', 'always means', 'set the dose', 'energized', 'ignore'];
  const helpfulHits = helpful.filter((word) => text.includes(word)).length;
  const dangerousHits = dangerous.filter((word) => text.includes(word)).length;
  const action = /i would|first|next|send|ask|write|stop|notify|compare|use/.test(text);
  const score = Math.max(0, Math.min(100, 30 + helpfulHits * 8 + (action ? 12 : 0) - dangerousHits * 17));
  return { score, safe: dangerousHits === 0 || text.includes('do not'), helpfulHits, dangerousHits, summary: score >= 75 && dangerousHits === 0 ? 'The crew can work with this move.' : score >= 55 ? 'This move has a useful start, but it needs a clearer check.' : 'This move needs review before anyone acts.' };
}

function ShiftTrail() {
  const [stopIndex, setStopIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [resources, setResources] = useState({ time: 100, safety: 100, trust: 60, skill: 0 });
  const [bestScore, setBestScore] = useState(null);
  const stop = stops[stopIndex];
  const result = submitted ? scoreMove(stop, response) : null;
  const finished = stopIndex === stops.length - 1 && submitted;
  const totalScore = results.reduce((sum, item) => sum + item.score, 0) + (result?.score || 0);
  const routePercent = Math.round((stopIndex / (stops.length - 1)) * 100);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('facilities-ai-field-lab-trail-best'));
    if (saved) setBestScore(saved);
  }, []);

  function useStarter(label) {
    setResponse((current) => current ? `${current}\n\n${starterPatterns[label]}` : starterPatterns[label]);
  }

  function submitMove(event) {
    event.preventDefault();
    if (!response.trim()) return;
    setSubmitted(true);
  }

  function continueShift() {
    const move = scoreMove(stop, response);
    const nextResults = [...results, { ...move, title: stop.title }];
    setResults(nextResults);
    setResources((current) => ({ time: Math.max(0, current.time - (move.dangerousHits ? 18 : 10)), safety: Math.max(0, current.safety - move.dangerousHits * 16), trust: Math.max(0, Math.min(100, current.trust + (move.score >= 75 ? 6 : -4))), skill: Math.min(100, current.skill + (move.helpfulHits >= 3 ? 15 : 7)) }));
    if (stopIndex < stops.length - 1) { setStopIndex(stopIndex + 1); setResponse(''); setSubmitted(false); }
    else { const finalScore = nextResults.reduce((sum, item) => sum + item.score, 0); if (!bestScore || finalScore > bestScore) { setBestScore(finalScore); window.localStorage.setItem('facilities-ai-field-lab-trail-best', String(finalScore)); } }
  }

  function restart() { setStopIndex(0); setResponse(''); setSubmitted(false); setResults([]); setResources({ time: 100, safety: 100, trust: 60, skill: 0 }); }

  if (finished) return <section className="trailScreen"><div className="trailHeader"><div><span className="eyebrow">THE SHIFT TRAIL · END OF DAY</span><h1>Shift report</h1><p>You learned by making the calls, checking the results, and seeing what happened to the crew.</p></div></div><div className="trailReport"><span className="gameBadge">ROUTE COMPLETE</span><h2>{resources.safety >= 75 && resources.trust >= 60 ? 'You brought the crew home strong.' : 'The route exposed some habits to improve.'}</h2><div className="trailStats"><span><b>{totalScore}</b> decision points</span><span><b>{resources.safety}</b> safety</span><span><b>{resources.trust}</b> crew trust</span><span><b>{resources.skill}</b> AI skill</span></div><div className="reportList">{results.map((item) => <div key={item.title}><b>{item.title}</b><span>{item.score}/100 · {item.summary}</span></div>)}</div><button className="primaryCta" onClick={restart}>Run the route again <span>↻</span></button></div></section>;

  return <section className="trailScreen"><div className="trailHeader"><div><span className="eyebrow">FACILITIES AI FIELD LAB · THE SHIFT TRAIL</span><h1>The Shift Trail</h1><p>Run the workday. Learn the tool. Protect the crew.</p></div><div className="trailRule"><b>How to play</b><span>Read the call. Use the lesson. Type your move. Live with the consequence.</span></div></div><div className="trailMeters"><div><span>TIME</span><strong>{resources.time}%</strong><i><em style={{ width: `${resources.time}%` }} /></i></div><div><span>SAFETY</span><strong>{resources.safety}%</strong><i><em style={{ width: `${resources.safety}%` }} /></i></div><div><span>CREW TRUST</span><strong>{resources.trust}%</strong><i><em style={{ width: `${resources.trust}%` }} /></i></div><div><span>AI SKILL</span><strong>{resources.skill}%</strong><i><em style={{ width: `${resources.skill}%` }} /></i></div></div><div className="trailMap">{stops.map((item, index) => <div key={item.name} className={`trailStop ${index === stopIndex ? 'current' : ''} ${index < stopIndex ? 'passed' : ''}`}><span>{index < stopIndex ? '✓' : index + 1}</span><b>{item.name}</b></div>)}</div><div className="trailWork"><aside className="lessonPanel"><span className="eyebrow">AI LESSON {stopIndex + 1}</span><h2>{stop.title}</h2><p>{stop.lesson}</p><div className="lessonHint"><b>Field hint</b><span>{stop.hint}</span></div></aside><main className="callPanel"><div className="callMeta"><span>{stop.trade}</span><span>STOP {stopIndex + 1} OF {stops.length}</span></div><h2>{stop.name}</h2><div className="incoming"><span>JOB CALL</span><p>{stop.scene}</p></div>{!submitted ? <form className="moveForm" onSubmit={submitMove}><label htmlFor="move">{stopIndex === 0 ? 'Build your first AI-assisted move.' : 'What do you do next?'}</label><div className="starterRow">{stop.quick.map((item) => <button type="button" key={item} onClick={() => useStarter(item)}>{item}</button>)}</div><textarea id="move" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Type what you would actually do…" rows={9} /><div className="moveFooter"><small>Include the action, how AI fits, what you will check, and who owns the decision.</small><button className="primaryCta" disabled={!response.trim()}>Send the move <span>→</span></button></div></form> : <div className={`moveResult ${result.safe && result.score >= 75 ? 'good' : result.safe ? 'warn' : 'bad'}`}><span className="outcomeBadge">{result.safe && result.score >= 75 ? 'CREW CAN WORK WITH THIS' : result.safe ? 'COACHING NEEDED' : 'STOP CONDITION HIT'}</span><h2>{result.summary}</h2><p><b>Your move:</b> {response}</p><p>{result.dangerousHits ? 'The move contains a shortcut or unsupported action. The crew pauses until it is corrected.' : 'You made the human check visible. The lesson is now part of your route knowledge.'}</p><div className="outcomePoints">{result.score}/100</div><button className="primaryCta" onClick={continueShift}>{stopIndex === stops.length - 1 ? 'See the shift report' : 'Continue down the route'} <span>→</span></button></div>}</main></div></section>;
}

export default function Home() {
  return <><header className="topbar"><div className="homeBrand"><span className="homeMark" aria-hidden="true"><span className="homeGlyph" /></span><span className="brand">FACILITIES <span>AI</span> FIELD LAB</span></div><div className="topmeta">THE SHIFT TRAIL<br />OPEN-ENDED AI GAME</div></header><main className="shell"><ShiftTrail /></main></>;
}
