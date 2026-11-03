'use client';

import { useEffect, useMemo, useState } from 'react';

const stops = [
  { name: 'Shop Yard', trade: 'START HERE', title: 'Turn a real work note into a useful prompt', scene: 'The note on the dispatch board says: “RTU-3, Science 214, not cooling. Fan runs. Room was 78°F at 8:05. Class starts at 9:00. Call Jordan at extension 4421 after checking the unit.” You have ten minutes before the trucks leave. Your job is to prepare the next field step—not diagnose the equipment from the note.', lesson: 'AI works best when the request gives it a real situation, a reader, one useful task, a format, and a boundary. The note gives you enough to start, but not enough to claim a cause or choose a repair.', hint: 'Build your prompt from five pieces: Context (the work note), Reader (the technician or supervisor), Ask (prepare the next field step), Format (a short checklist), and Truth-check (use only these facts; flag what must be checked in the field).', quick: ['Build a first prompt', 'Ask for a checklist', 'Show me the CRAFT pattern'] },
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

const tradeProfiles = {
  hvac: { name: 'HVAC / BAS', short: 'Comfort calls, controls, and equipment records', icon: '❄', color: '#2d83b8', scenes: [
    'The note on the dispatch board says: “RTU-3, Science 214, not cooling. Fan runs. Room was 78°F at 8:05. Class starts at 9:00. Call Jordan at extension 4421 after checking the unit.” Use AI to prepare a short field-check checklist for the HVAC technician. Do not ask AI to diagnose the cause or select a repair.',
    'Conference Room 204 is 76°F with a 72°F setpoint. The BAS shows a 100% damper command, but nobody has confirmed physical airflow. The first class starts in 25 minutes.',
    'A rooftop unit shows a fault code in a screenshot. The photo does not show the make, model, serial number, or last service date. A vendor call is available in 40 minutes.',
    'A coworker asks AI which heating or cooling setting to change after a comfort complaint. The approved sequence and the controls lead are available.',
    'The crew has an approved filter list, access plan, weather forecast, and equipment schedule. One unit label does not match across two documents.',
    'A condensate leak is near an electrical disconnect. No qualified test or equipment shutdown authorization has been recorded.',
    'The shift is ending. Your supervisor asks which AI workflow actually helped the HVAC crew and what should become a reusable shop card.',
  ]},
  electrical: { name: 'Electrical', short: 'Service calls, documentation, and safe escalation', icon: '⚡', color: '#d28a24', scenes: [
    'The dispatch note says: “West Wing, Room 118, breaker issue. Lights out in two offices. Occupants are still inside. Panel is in electrical closet W-1. Call Maya at extension 3178 before entering.” Use AI to prepare an intake and field-check checklist. Do not guess the fault or authorize a reset.',
    'A classroom loses power twice. A panel label and a work-order note disagree about the circuit name. Use AI to organize what is known and what a qualified electrician must verify.',
    'A motor starter photo is missing the nameplate and panel schedule reference. Use AI to prepare the information and vendor questions needed before ordering anything.',
    'Someone asks AI whether to reset a breaker that has tripped repeatedly. The site procedure and qualified electrician are available.',
    'The crew has a one-line diagram, panel schedule, room list, and shutdown notice. One circuit description does not match across the records.',
    'Water is visible near an electrical room door and an occupant wants the breaker reset. No qualified assessment has been recorded.',
    'The supervisor wants a reusable AI workflow for intake, source checking, and safe escalation on future electrical calls.',
  ]},
  plumbing: { name: 'Plumbing', short: 'Leaks, fixtures, water systems, and handoffs', icon: '♒', color: '#2774b8', scenes: [
    'The dispatch note says: “Water under sink near Loading Dock 2. Started after lunch. Floor is damp; no one knows whether the sink or wall is leaking. Keep packages clear. Call Sam at extension 2284.” Use AI to prepare a short intake and field-check checklist. Do not guess the source or tell anyone which valve to close.',
    'A restroom fixture is reported as running. The work order, occupant description, and photo use different fixture names. Use AI to separate facts from assumptions before the walk-through.',
    'A pump photo is missing the model plate and service history. Use AI to identify missing information and prepare vendor questions without selecting a replacement.',
    'Someone asks AI which valve to close after a pressure complaint. The site map and plumbing lead are available; the AI must not choose the valve.',
    'The crew has a leak report, floor plan, shutoff list, and access schedule. The room number differs between two documents.',
    'Water is pooling near a receptacle and a ceiling access panel. No qualified electrical or plumbing assessment has been recorded.',
    'The supervisor wants a reusable AI workflow for plumbing intake, comparison, and escalation that the crew can use tomorrow.',
  ]},
  carpentry: { name: 'Carpentry / General Maintenance', short: 'Building repairs, access, materials, and coordination', icon: '⌂', color: '#8f5b36', scenes: [
    'The dispatch note says: “Door will not latch at Student Services, Room 104. Staff say it has been rubbing since yesterday. Door must stay usable during business hours. Photograph the hinge side and call Lee at extension 3912.” Use AI to prepare a short site-visit checklist. Do not ask AI to specify a repair before the door is observed.',
    'A classroom door is reported as sticking. The occupant, work order, and photo describe different door locations. Use AI to organize facts and missing details.',
    'A cabinet hinge or closer photo is missing the part label and dimensions. Use AI to prepare the measurements and vendor questions before buying a part.',
    'Someone asks AI whether a door can be altered immediately because it is rubbing. The building supervisor and approved access requirements control the decision.',
    'The crew has a room list, access schedule, material list, and finish standard. One room number does not match across the documents.',
    'A ceiling opening reveals a possible hazard above an occupied area. No qualified assessment or access authorization has been recorded.',
    'The supervisor wants a reusable AI workflow for clear intake, material research, and safe handoffs on building repair calls.',
  ]},
  grounds: { name: 'Grounds / Roads', short: 'Outdoor work, locations, weather, and crew briefings', icon: '✦', color: '#3d8b58', scenes: [
    'The dispatch note says: “Low branch over walkway between North Lot and Building C. Caller reports it is about head height after the storm. Exact tree number is unknown. Keep pedestrians moving safely and call Pat at extension 2650 before closing any path.” Use AI to prepare a short site-check and crew-briefing checklist. Do not ask AI to decide whether the path should close.',
    'A walkway complaint includes a photo but no campus location. The map pin, work order, and caller description do not line up.',
    'A vehicle or equipment photo is missing the unit number and service history. Use AI to prepare an intake checklist and vendor questions without guessing the repair.',
    'Someone asks AI whether the crew should close a path because of a hazard. The site procedure and supervisor control that decision.',
    'The crew has an approved location list, weather forecast, traffic-control plan, and material quantities. One road or walkway name does not match across two documents.',
    'A damaged light pole or irrigation control is near an energized or wet area. No qualified assessment has been recorded.',
    'The supervisor wants a reusable AI workflow for location clarity, crew briefings, and safe stop conditions.',
  ]},
};

function RouteGraphic({ profile }) {
  return <div className="routeGraphic" style={{ '--trade-color': profile.color }}><svg viewBox="0 0 620 220" role="img" aria-label={`${profile.name} route illustration`}><rect width="620" height="220" rx="18" fill="#082238" /><path d="M0 166 C120 112 190 190 300 135 S485 76 620 116" fill="none" stroke="#f2b134" strokeWidth="6" strokeDasharray="11 12" /><path d="M0 178 C120 124 190 202 300 147 S485 88 620 128" fill="none" stroke="#d9e8ef" strokeWidth="2" opacity=".4" /><circle cx="78" cy="137" r="15" fill="#f2b134" /><circle cx="284" cy="142" r="15" fill="#fff" /><circle cx="514" cy="103" r="15" fill="#fff" /><path d="M63 136h-27M93 136h27M78 122v-18" stroke="#f2b134" strokeWidth="4" strokeLinecap="round" /><path d="M270 142h-25M299 142h25M284 127v-22" stroke={profile.color} strokeWidth="4" strokeLinecap="round" /><path d="M500 103h-26M529 103h26M514 88V67" stroke="#3d8b58" strokeWidth="4" strokeLinecap="round" /><path d="M70 168h-7l-5 14h40l-5-14h-7M270 173h28v12h-28zM500 134l14-26 14 26z" fill="none" stroke="#d9e8ef" strokeWidth="3" /><text x="25" y="42" fill="#f2b134" fontFamily="Arial" fontSize="13" fontWeight="700" letterSpacing="2">THE SHIFT TRAIL</text><text x="25" y="66" fill="#fff" fontFamily="Arial" fontSize="25" fontWeight="700">{profile.name}</text><text x="25" y="91" fill="#bcd0dc" fontFamily="Arial" fontSize="13">Learn AI by making the calls.</text></svg><div className="routeGraphicBadge"><span>{profile.icon}</span><b>{profile.short}</b></div></div>;
}

function scoreMove(stop, response, usedAI = false) {
  const text = response.toLowerCase();
  const helpful = ['check', 'verify', 'source', 'manual', 'sop', 'qualified', 'human', 'question', 'field', 'review', 'do not', 'unknown', 'missing', 'ai'];
  const dangerous = ['reset', 'replace', 'approve', 'definitely', 'always means', 'set the dose', 'energized', 'ignore'];
  const helpfulHits = helpful.filter((word) => text.includes(word)).length;
  const dangerousHits = dangerous.filter((word) => text.includes(word)).length;
  const action = /i would|first|next|send|ask|write|stop|notify|compare|use/.test(text);
  const score = Math.max(0, Math.min(100, 30 + helpfulHits * 8 + (action ? 12 : 0) + (usedAI ? 8 : 0) - dangerousHits * 17));
  return { score, safe: dangerousHits === 0 || text.includes('do not'), helpfulHits, dangerousHits, usedAI, summary: score >= 75 && dangerousHits === 0 ? 'The crew can work with this move.' : score >= 55 ? 'This move has a useful start, but it needs a clearer check.' : 'This move needs review before anyone acts.' };
}

function TradePicker({ onChoose }) {
  return <section className="tradePicker"><div className="pickerCopy"><span className="eyebrow">THE SHIFT TRAIL · CHOOSE YOUR ROUTE</span><h1>Pick your trade.</h1><p>The work calls will change with your choice. You will practice the same AI habits—clear prompts, useful checks, safe boundaries—but on situations that feel like your day.</p></div><div className="pickerGraphic"><RouteGraphic profile={tradeProfiles.hvac} /></div><div className="tradeCards">{Object.entries(tradeProfiles).map(([key, profile]) => <button type="button" className="tradeCard" key={key} onClick={() => onChoose(key)} style={{ '--trade-color': profile.color }}><span className="tradeIcon">{profile.icon}</span><span><b>{profile.name}</b><small>{profile.short}</small></span><strong>Start route →</strong></button>)}</div></section>;
}

function ShiftTrail() {
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [stopIndex, setStopIndex] = useState(0);
  const [response, setResponse] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiUsed, setAiUsed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState([]);
  const [resources, setResources] = useState({ time: 100, safety: 100, trust: 60, skill: 0 });
  const [bestScore, setBestScore] = useState(null);
  const profile = tradeProfiles[selectedTrade || 'hvac'];
  const activeStops = stops.map((base, index) => ({ ...base, trade: profile.name, scene: profile.scenes[index] }));
  const stop = activeStops[stopIndex];
  const result = submitted ? scoreMove(stop, response, aiUsed) : null;
  const finished = stopIndex === stops.length - 1 && submitted;
  const totalScore = results.reduce((sum, item) => sum + item.score, 0) + (result?.score || 0);
  const routePercent = Math.round((stopIndex / (stops.length - 1)) * 100);

  useEffect(() => {
    const saved = Number(window.localStorage.getItem('facilities-ai-field-lab-trail-best'));
    if (saved) setBestScore(saved);
  }, []);

  function useStarter(label) {
    const firstPrompt = `Context: ${stop.scene}\nReader: The ${profile.name} technician and supervisor.\nAsk: Turn this into a short field-preparation checklist.\nFormat: Use bullets for known facts, missing information, and the next human checks.\nTruth-check: Use only the supplied note. Do not diagnose, choose a repair, or invent a fact.`;
    const starter = label === 'Build a first prompt' ? firstPrompt : starterPatterns[label];
    setAiPrompt((current) => current ? `${current}\n\n${starter}` : starter);
  }

  async function askTool(event) {
    event.preventDefault();
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true); setAiError('');
    try {
      const toolResponse = await fetch('/api/ollama', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: aiPrompt, scenario: `${stop.title}. ${stop.scene}` }) });
      const data = await toolResponse.json();
      if (!toolResponse.ok) throw new Error(data.error || 'The FM AI Tool could not respond.');
      setAiResponse(data.response || 'The FM AI Tool returned an empty response.');
      setAiUsed(true);
    } catch (error) { setAiError(error.message); }
    finally { setAiLoading(false); }
  }

  function useAIResponse() {
    if (!aiResponse) return;
    setResponse((current) => current ? `${current}\n\nFM AI Tool response:\n${aiResponse}` : `FM AI Tool response:\n${aiResponse}`);
  }

  function submitMove(event) {
    event.preventDefault();
    if (!response.trim()) return;
    setSubmitted(true);
  }

  function continueShift() {
    const move = scoreMove(stop, response, aiUsed);
    const nextResults = [...results, { ...move, title: stop.title }];
    setResults(nextResults);
    setResources((current) => ({ time: Math.max(0, current.time - (move.dangerousHits ? 18 : 10)), safety: Math.max(0, current.safety - move.dangerousHits * 16), trust: Math.max(0, Math.min(100, current.trust + (move.score >= 75 ? 6 : -4))), skill: Math.min(100, current.skill + (move.helpfulHits >= 3 ? 15 : 7)) }));
    if (stopIndex < stops.length - 1) { setStopIndex(stopIndex + 1); setResponse(''); setAiPrompt(''); setAiResponse(''); setAiError(''); setAiUsed(false); setSubmitted(false); }
    else { const finalScore = nextResults.reduce((sum, item) => sum + item.score, 0); if (!bestScore || finalScore > bestScore) { setBestScore(finalScore); window.localStorage.setItem('facilities-ai-field-lab-trail-best', String(finalScore)); } }
  }

  function restart() { setStopIndex(0); setResponse(''); setAiPrompt(''); setAiResponse(''); setAiError(''); setAiUsed(false); setSubmitted(false); setResults([]); setResources({ time: 100, safety: 100, trust: 60, skill: 0 }); }

  function chooseTrade(key) { setSelectedTrade(key); setStopIndex(0); setResponse(''); setAiPrompt(''); setAiResponse(''); setAiError(''); setAiUsed(false); setSubmitted(false); setResults([]); setResources({ time: 100, safety: 100, trust: 60, skill: 0 }); }

  if (!selectedTrade) return <TradePicker onChoose={chooseTrade} />;

  if (finished) return <section className="trailScreen"><div className="trailHeader"><div><span className="eyebrow">THE SHIFT TRAIL · END OF DAY</span><h1>Shift report</h1><p>You learned by making the calls, checking the results, and seeing what happened to the crew.</p></div></div><div className="trailReport"><span className="gameBadge">ROUTE COMPLETE</span><h2>{resources.safety >= 75 && resources.trust >= 60 ? 'You brought the crew home strong.' : 'The route exposed some habits to improve.'}</h2><div className="trailStats"><span><b>{totalScore}</b> decision points</span><span><b>{resources.safety}</b> safety</span><span><b>{resources.trust}</b> crew trust</span><span><b>{resources.skill}</b> AI skill</span></div><div className="reportList">{results.map((item) => <div key={item.title}><b>{item.title}</b><span>{item.score}/100 · {item.summary}</span></div>)}</div><button className="primaryCta" onClick={restart}>Run the route again <span>↻</span></button></div></section>;

  return <section className="trailScreen"><div className="trailHeader"><div><span className="eyebrow">FACILITIES AI FIELD LAB · THE SHIFT TRAIL · {profile.name}</span><h1>The Shift Trail</h1><p>Run the workday. Learn the tool. Protect the crew.</p></div><div className="trailRule"><b>How to play</b><span>Read the call. Ask FM AI Tool. Check the response. Type your move. Live with the consequence.</span></div></div><div className="trailMeters"><div><span>TIME</span><strong>{resources.time}%</strong><i><em style={{ width: `${resources.time}%` }} /></i></div><div><span>SAFETY</span><strong>{resources.safety}%</strong><i><em style={{ width: `${resources.safety}%` }} /></i></div><div><span>CREW TRUST</span><strong>{resources.trust}%</strong><i><em style={{ width: `${resources.trust}%` }} /></i></div><div><span>AI SKILL</span><strong>{resources.skill}%</strong><i><em style={{ width: `${resources.skill}%` }} /></i></div></div><div className="trailMap">{activeStops.map((item, index) => <div key={item.name} className={`trailStop ${index === stopIndex ? 'current' : ''} ${index < stopIndex ? 'passed' : ''}`}><span>{index < stopIndex ? '✓' : index + 1}</span><b>{item.name}</b></div>)}</div><div className="trailWork"><aside className="lessonPanel"><span className="eyebrow">AI LESSON {stopIndex + 1}</span><h2>{stop.title}</h2><p>{stop.lesson}</p><div className="lessonHint"><b>Field hint</b><span>{stop.hint}</span></div></aside><main className="callPanel"><div className="callMeta"><span>{stop.trade}</span><span>STOP {stopIndex + 1} OF {activeStops.length}</span></div><h2>{stop.name}</h2><div className="incoming"><span>JOB CALL</span><p>{stop.scene}</p></div>{!submitted ? <><section className="aiToolPanel"><div className="aiToolTop"><div><span className="aiToolKicker">FM AI TOOL</span><b>Use AI on this job</b></div><span className={aiUsed ? 'aiUsed' : 'aiNotUsed'}>{aiUsed ? 'RESPONSE RECEIVED' : 'NOT USED YET'}</span></div><p>Write a prompt, send it to the AI, then decide what is useful and what must be checked.</p><div className="starterRow">{stop.quick.map((item) => <button type="button" key={item} onClick={() => useStarter(item)}>{item}</button>)}</div><form className="aiPromptForm" onSubmit={askTool}><textarea value={aiPrompt} onChange={(event) => setAiPrompt(event.target.value)} placeholder="Ask FM AI Tool to help with one part of this job…" rows={4} /><button className="primaryCta" disabled={!aiPrompt.trim() || aiLoading}>{aiLoading ? 'FM AI Tool is thinking…' : 'Ask FM AI Tool'} <span>→</span></button></form>{aiError && <div className="aiToolError">{aiError}</div>}{aiResponse && <div className="aiResponse"><div><span>FM AI TOOL RESPONSE</span><button type="button" onClick={useAIResponse}>Use in my move</button></div><p>{aiResponse}</p></div>}</section><form className="moveForm" onSubmit={submitMove}><label htmlFor="move">{stopIndex === 0 ? 'Now make your move.' : 'What do you do next?'}</label><textarea id="move" value={response} onChange={(event) => setResponse(event.target.value)} placeholder="Type what you would actually do after checking the AI response…" rows={8} /><div className="moveFooter"><small>{aiUsed ? 'Good: you consulted the tool. Include what you accepted, changed, and will verify.' : 'Ask FM AI Tool first for the full learning experience.'}</small><button className="primaryCta" disabled={!response.trim()}>Send the move <span>→</span></button></div></form></> : <div className={`moveResult ${result.safe && result.score >= 75 ? 'good' : result.safe ? 'warn' : 'bad'}`}><span className="outcomeBadge">{result.safe && result.score >= 75 ? 'CREW CAN WORK WITH THIS' : result.safe ? 'COACHING NEEDED' : 'STOP CONDITION HIT'}</span><h2>{result.summary}</h2><p><b>Your move:</b> {response}</p><p>{result.dangerousHits ? 'The move contains a shortcut or unsupported action. The crew pauses until it is corrected.' : aiUsed ? 'You used the FM AI Tool, then made the human check visible. That is the habit this route is building.' : 'You made the human check visible. Use the FM AI Tool next round to strengthen the workflow.'}</p><div className="outcomePoints">{result.score}/100</div><button className="primaryCta" onClick={continueShift}>{stopIndex === activeStops.length - 1 ? 'See the shift report' : 'Continue down the route'} <span>→</span></button></div>}</main></div></section>;
}

export default function Home() {
  return <><header className="topbar"><div className="homeBrand"><span className="homeMark" aria-hidden="true"><span className="homeGlyph" /></span><span className="brand">FACILITIES <span>AI</span> FIELD LAB</span></div><div className="topmeta">THE SHIFT TRAIL<br />OPEN-ENDED AI GAME</div></header><main className="shell"><ShiftTrail /></main></>;
}
