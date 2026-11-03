# Facilities AI Field Lab: The Shift Trail

An open-ended Oregon-Trail-style browser game that teaches practical AI habits for facilities and public-works crews.

## How to play

You travel through a workday route. At each stop, you use the in-game FM AI Tool to write a prompt, receive an Ollama response, inspect it, and decide what to use. Each stop teaches one usable AI move—writing a clear prompt, finding missing information, comparing documents, preparing field questions, and setting a safe stop condition. You then type the move you would actually make and see the consequence for time, safety, crew trust, and AI skill. Starter buttons provide coaching prompts; they are not answer choices.

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

The game runs without an AI connection so it can be deployed reliably as a static-style Next.js game. The scoring is local and intentionally checks for practical habits rather than trade-specific technical knowledge.

## Ollama configuration

The browser calls the included `/api/ollama` server route. Add these environment variables in Vercel under Project Settings → Environment Variables:

- `OLLAMA_BASE_URL`: the HTTPS URL of a remotely reachable Ollama-compatible endpoint; do not use `localhost` on Vercel.
- `OLLAMA_MODEL`: the installed model name, such as `llama3.1:8b`.
- `OLLAMA_API_KEY`: optional bearer token if the endpoint requires one.
