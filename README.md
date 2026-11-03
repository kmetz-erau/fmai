# Facilities AI Field Lab: The Shift

An open-ended browser game for practicing AI judgment in facilities and public-works situations.

## How to play

You receive a job call, read the situation, and type the move you would actually make. The game scores your response for practical action, verification, human ownership, and safety boundaries. There are no multiple-choice answers.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Deploy with GitHub + Vercel

Import the repository as a Next.js project. The repository includes `vercel.json` with the Next.js build command and `.next` output directory.

Use these Vercel settings:

- Framework Preset: Next.js
- Build Command: `npm run build`
- Output Directory: `.next`
- Root Directory: the folder containing `package.json`

The game runs without an AI connection. Ollama can be added later for optional free-form coaching after a move.
