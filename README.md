# Research Article AI Agent (OpenRouter + React)

## What this does
- Upload PDF/TXT/MD research articles
- Splits into chunks and indexes (BM25, free)
- Ask questions -> agent retrieves relevant chunks -> answers with citations

## Requirements
- Node.js 18+

## Setup

### 1) Backend
```bash
cd backend
cp .env.example .env
# Put your OPENROUTER_API_KEY in .env
npm i
npm run dev
