# AI-Native Mini CRM — Xeno

An AI-powered Marketing CRM for D2C/retail brands. Build personalized campaigns using **natural language** — the AI parses your intent, creates customer segments, drafts messages, and dispatches across simulated channels (WhatsApp, SMS, Email, RCS).

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                        Monorepo                              │
│                                                              │
│  ┌─────────────────────────┐    ┌──────────────────────┐     │
│  │   CRM (Next.js 14)      │    │  Channel Service     │     │
│  │   Port 3000              │    │  (Express)           │     │
│  │                          │    │  Port 3001           │     │
│  │  • Dashboard UI          │    │                      │     │
│  │  • AI Campaign Builder   │───▶│  POST /send          │     │
│  │  • API Routes            │    │  • Simulate delivery │     │
│  │  • Dispatch Worker       │◀───│  • POST callbacks    │     │
│  │                          │    │    to /api/receipts   │     │
│  └──────────┬───────────────┘    └──────────────────────┘     │
│             │                                                 │
│             ▼                                                 │
│  ┌─────────────────────────┐    ┌──────────────────────┐     │
│  │  PostgreSQL (Prisma)    │    │  Google Gemini API   │     │
│  │  • Customers, Orders    │    │  (gemini-2.0-flash)  │     │
│  │  • Segments, Campaigns  │    │  • Parse NL intent   │     │
│  │  • Communication Logs   │    │  • Draft messages    │     │
│  └─────────────────────────┘    └──────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

## Features

- **Chat-First AI Campaign Builder** — Type "Customers in Bangalore who spent over ₹10K and haven't ordered in 60 days, send a 15% off coupon via WhatsApp" → AI parses → segment preview → message draft → launch
- **Conversational Refinement** — Follow up with "make it 90 days instead" → AI updates the segment
- **Segment Engine** — JSON rule schema with Zod validation, Prisma query conversion, plain-English explanation
- **Multi-Channel Dispatch** — Simulated WhatsApp, SMS, Email, RCS delivery with realistic status progression
- **Insights Dashboard** — Funnel charts, delivery stats, live-updating campaign detail pages
- **DB-Backed Queue** — CommunicationLog rows as the dispatch queue, processed in batches

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend + CRM Backend | Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Channel Service | Express.js, TypeScript |
| Database | PostgreSQL, Prisma ORM |
| AI | Google Gemini API (gemini-2.0-flash) with structured JSON output |
| Validation | Zod |
| Charts | Recharts |

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (local, [Neon](https://neon.tech), or [Supabase](https://supabase.com))
- [Google Gemini API Key](https://aistudio.google.com/apikey)

### 1. Clone & Install
```bash
git clone <repo-url>
cd Xeno

# Install root dependencies (concurrently)
npm install

# Install all service dependencies
npm run install:all
```

### 2. Configure Environment
```bash
# Copy the template
cp .env.example crm/.env

# Edit crm/.env with your values:
# DATABASE_URL="postgresql://user:password@host:5432/minicrm"
# GEMINI_API_KEY="your-key-here"
# CHANNEL_SERVICE_URL="http://localhost:3001"
# CRM_CALLBACK_URL="http://localhost:3000"
```

### 3. Set Up Database
```bash
# Push schema to database
npm run db:push

# Seed with demo data (~150 customers, ~450 orders)
npm run db:seed
```

### 4. Run Both Services
```bash
npm run dev
# CRM → http://localhost:3000
# Channel Service → http://localhost:3001
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | — (required) |
| `GEMINI_API_KEY` | Google Gemini API key | — (required for AI features) |
| `CHANNEL_SERVICE_URL` | Where CRM sends dispatch requests | `http://localhost:3001` |
| `CRM_CALLBACK_URL` | Where Channel Service posts delivery receipts | `http://localhost:3000` |

## API Endpoints

### CRM (Next.js API Routes)
| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/customers` | List/create customers |
| GET/POST | `/api/orders` | List/create orders |
| GET/POST | `/api/segments` | List/create segments |
| POST | `/api/segments/preview` | Preview segment matches |
| GET/POST | `/api/campaigns` | List/create campaigns |
| POST | `/api/campaigns/:id/dispatch` | Trigger campaign dispatch |
| GET | `/api/campaigns/:id/stats` | Campaign funnel stats |
| POST | `/api/ai/parse-intent` | NL → segment + message intent |
| POST | `/api/ai/refine-segment` | Refine segment with follow-up |
| POST | `/api/ai/draft-message` | Generate message template |
| POST | `/api/ai/explain-segment` | Rule JSON → plain English |
| POST | `/api/receipts` | Receive delivery callbacks |

### Channel Service (Express)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/send` | Accept communication, simulate delivery |
| GET | `/health` | Health check |

## Tradeoffs & Design Decisions

### Intentional Simplifications
- **DB-backed queue instead of SQS/BullMQ+Redis** — `CommunicationLog` rows with status `QUEUED` serve as the dispatch queue. At scale, this would be replaced with a dedicated message queue for durability, horizontal scaling, and backpressure.
- **No authentication/multi-tenancy** — Single hardcoded demo organization. Production would add NextAuth/Clerk with org-scoped data isolation.
- **Synchronous AI calls in chat flow** — LLM calls happen inline during the chat. At scale, would add response caching for repeated patterns, use a faster model for refinements, or implement streaming.
- **In-memory delivery simulation** — Channel Service uses `setTimeout` for simulating delivery. Production would use a proper job queue and real provider SDKs (Twilio, MessageBird, etc.).
- **Post-filter for orderCount** — Prisma doesn't support relation count in `where` clauses, so orderCount conditions are applied as a post-query filter. At scale, would use raw SQL with `HAVING` clauses.

### Why Two Services?
The Channel Service is intentionally separate to mirror a real architecture where channel providers (Twilio, Gupshup, etc.) are external services. This demonstrates:
- Service-to-service HTTP communication
- Asynchronous callback patterns
- Decoupled deployment (CRM on Vercel, Channel Service on Render)

## Deployment

### CRM → Vercel
```bash
cd crm
vercel deploy
# Set env vars in Vercel dashboard
```

### Channel Service → Render/Railway
Deploy the `/channel-service` directory as a Node.js web service.
Set `CRM_CALLBACK_URL` to your deployed CRM URL.

### Database → Neon/Supabase
Use the connection string from your provider as `DATABASE_URL`.

## Project Structure
```
Xeno/
├── README.md
├── .env.example
├── package.json              # Root scripts (concurrently)
├── crm/                      # Next.js CRM Application
│   ├── prisma/
│   │   ├── schema.prisma     # Data model
│   │   └── seed.ts           # Demo data generator
│   └── src/
│       ├── app/
│       │   ├── (dashboard)/  # All dashboard pages
│       │   └── api/          # API routes
│       ├── components/       # UI components (shadcn/ui)
│       └── lib/
│           ├── ai/           # Gemini integration
│           ├── segments/     # Rule engine
│           └── dispatch/     # Worker & template renderer
└── channel-service/          # Express Channel Service
    └── src/
        ├── index.ts          # Express app
        └── routes/
            └── send.ts       # Delivery simulation
```
