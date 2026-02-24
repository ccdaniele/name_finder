# Name Generator

AI-powered company and product name generator with trademark validation. Generates candidate names based on your business description, validates each one against web presence, .com domain availability, and USPTO trademark records, then scores them for trademarkability.

## How it works

1. **Input** -- Describe your company/product and optionally upload a document (PDF, DOCX, or TXT) for additional context. Choose how many names to generate (5-50).
2. **Summary** -- AI analyzes your input and produces a preference summary with recommended USPTO classes. You can review and edit before proceeding.
3. **Interview** -- A short AI-driven Q&A (5-8 questions) to refine naming direction, covering tone, audience, competitors, and cultural considerations.
4. **Generation & Validation** -- Names are generated and each one goes through a sequential validation pipeline:
   - **Web search** (Serper.dev) -- AI judges whether existing search results indicate a naming conflict
   - **Domain check** (RDAP + GoDaddy) -- The .com must be available; names with taken domains are discarded
   - **Trademark search** (USPTO via RapidAPI) -- Checks for conflicting registered marks in relevant classes
5. **Results** -- Validated names are scored (0-100) and graded (A-F) for trademarkability. Each card shows the rationale, domain status, trademark risk, and a detailed score breakdown. Export results as PDF or CSV.

## Prerequisites

- Node.js 18+
- npm

## Setup

```bash
git clone <repo-url>
cd Name_generator
npm install
```

### Environment variables

Copy the example file and fill in your API keys:

```bash
cp .env.example .env.local
```

| Variable | Required | Where to get it |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | [console.anthropic.com](https://console.anthropic.com/) |
| `SERPER_API_KEY` | Yes | [serper.dev](https://serper.dev/) (2,500 free queries) |
| `RAPIDAPI_KEY` | Yes | [rapidapi.com](https://rapidapi.com/) -- subscribe to the USPTO Trademark API by pentium10 |
| `GODADDY_API_KEY` | No | [developer.godaddy.com](https://developer.godaddy.com/) -- enables domain pricing info |
| `GODADDY_API_SECRET` | No | Same as above |

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm start
```

## Tech stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 4
- Vercel AI SDK + Claude (Anthropic)
- jspdf / papaparse for exports
