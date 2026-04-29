# AI Presentation Creator V1

A Mantine + React wizard that orchestrates the **AppDirect Presentation Designer** agent (via [Devs.ai](https://devs.ai)) to generate brand-compliant Google Slides decks through the agent's Drive MCP.

The wizard captures a structured presentation brief, applies a wizard-owned brand / layout / framework specification on top of the agent through an explicit OVERRIDE NOTICE, and streams MCP tool execution back to the user in real time.

## Architecture

```
User → Mantine Wizard (8 steps)
         │
         ▼
    /api/ai/chat (Vite plugin proxy, server-side)
         │
         │  Bearer ${AI_API_KEY}
         │  model = ${AI_AGENT_ID} (AppDirect Presentation Designer)
         ▼
    https://devs.ai/api/v1/chats/completions
         │
         ▼
    Devs.ai agent → Google Drive MCP (createPresentation, updatePresentation/batchUpdate, getPresentation, …)
                  → Image Generation (Gemini 3 Pro Image, 4:3, 3 samples)
```

The frontend never talks to Google or Devs.ai directly. All upstream calls flow through the same-origin `/api/ai/chat` endpoint, where the API key stays on the server.

## Why an OVERRIDE NOTICE

The Devs.ai agent has its own ~700 lines of baked-in instructions (brand palette interpretation, 22 consulting skills, Knowledge Retrieval over the AppDirect Slides Template PDF). Per the [MCP Servers](https://docs.devs.ai/docs/mcp-servers/) and [Threadless Completions](https://docs.devs.ai/docs/threadless-completions) docs, MCP servers are agent-bound — they can't be attached per-call to a base model — so we must reuse the Designer agent ID to access its Drive MCP. To prevent the agent's stored interpretations from drifting from this repo's version-controlled spec, every chat completion starts with an OVERRIDE NOTICE telling the agent to ignore its baked instructions and follow the spec the wizard provides.

The wizard owns:

- **9-color brand palette** (`src/data/brand.ts`)
- **14 visual layouts** (`src/data/layouts.ts`)
- **21 consulting frameworks** — 8 narrative + 13 analytical (`src/data/frameworks.ts`)
- **Construction kit** of reusable Slides API `batchUpdate` recipes — text, shape, composite (`src/data/constructionKit.ts`)
- **Geometry primer** (EMU math, page size, transforms)
- **Validation rules and output discipline**
- **Strict `AgentResult` JSON contract** (Zod-validated server- and client-side)

The agent's role is reduced to: receive the spec, plan, then call its Drive MCP + Image Generation tools to execute and return the final URL.

## Tech stack

- React 19 + Vite + TypeScript (strict)
- Mantine 7 (`@mantine/core`, `@mantine/hooks`, `@mantine/dates`, `@mantine/notifications`, `@mantine/form`)
- Tabler Icons (`@tabler/icons-react`)
- Zod for all schemas (wizard payload, agent result, brand tokens, layouts, frameworks, capabilities)
- ReactMarkdown for rendering streamed agent output
- Server-side Vite plugin (`vite.config.ts`) implements the `/api/ai/chat` SSE proxy

## Setup

This repository is a Devs.ai App Builder export. The Vite proxy plugin reads two env vars:

```bash
# .env (NOT committed — see .gitignore)
AI_API_KEY=sk-...                      # Devs.ai API key, never reaches the browser
AI_AGENT_ID=c7b960d8-...               # AppDirect Presentation Creator and Designer
VITE_AI_AGENT_ID=c7b960d8-...          # Same value, exposed to client (agent IDs are not secrets)
```

```bash
npm install
npm run dev   # binds 0.0.0.0:5173
```

## License

Built inside the Devs.ai App Builder. No license declared by the author.
