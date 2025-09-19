# GameTok Multi-Agent Orchestrator

A production-ready monorepo for the GameTok multi-agent pipeline. This system automates market research, game generation, QA, and deployment with human approval gates for critical decisions.

## 🏗️ Architecture

```
apps/console            ✅ Next.js operator dashboard for monitoring runs
services/orchestrator   ✅ Node/TS state machine + job runner (Fastify)
packages/agents         ✅ Agent classes, prompts, and tools
packages/schemas        ✅ Zod schemas and TypeScript types
packages/experiment     ✅ Bandit algorithms and LS scoring
packages/game-adapter   ✅ PostMessage types and perf budgets
packages/utils          ✅ Logger, retry, idempotency utilities
supabase/               ✅ SQL migrations and seed data
.github/workflows/      ✅ CI/CD pipeline
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm 8.15+

### Local Development
```bash
# Install dependencies
pnpm install

# Start the operator console
pnpm dev:console

# Start the orchestrator service  
pnpm dev:orchestrator

# Run database migrations
pnpm db:migrate
```

### Build Commands
```bash
# Build all packages
pnpm build

# Build for Vercel deployment
pnpm build:vercel

# Run tests
pnpm test

# Lint all code
pnpm lint
```

## 🔧 Deployment

### Vercel Setup
This project is optimized for Vercel deployment with the included `vercel.json` configuration.

**For new Vercel projects:**
1. Import this repository to Vercel
2. Vercel will auto-detect the Next.js framework
3. The build process will automatically:
   - Install dependencies with pnpm
   - Build all workspace packages in correct order
   - Deploy the console app

### Environment Variables
Set these in your deployment environment:
- `NEXT_PUBLIC_ORCHESTRATOR_URL` - Orchestrator service endpoint (optional for local dev)
- `DATABASE_URL` - PostgreSQL connection string for migrations

## 🎯 Human-in-the-Loop Gates

The system pauses for manual approval at key stages:
- **Portfolio Approval** – Review and approve game concepts
- **QA Verification** – Test generated games before publication  
- **Deployment Upload** – Manual asset upload until API is ready

## 📊 Status

- ✅ **Infrastructure**: Complete and production-ready
- ✅ **Console Dashboard**: Operational with run monitoring
- ✅ **Orchestrator Service**: State machine and job processing
- ✅ **Agent Framework**: Modular agent system with tools
- ✅ **Experiment Platform**: A/B testing and likability scoring
- 🔄 **Integration**: Ready for GameTok feed connection

## 🛠️ Development

### Workspace Structure
This is a pnpm workspace with shared dependencies and cross-package imports using `workspace:*` syntax.

### Key Scripts
- `pnpm dev:console` - Next.js dev server (port 3000)
- `pnpm dev:orchestrator` - Fastify API server (port 3333)  
- `pnpm build:vercel` - Production build for deployment
- `pnpm lint` - ESLint across all packages
- `pnpm test` - Vitest test runner

---

**Ready for production deployment** 🚀

## 🔗 **Live Integration**
- **Database**: Supabase with real orchestrator data
- **API**: Edge Functions for orchestrator operations  
- **Console**: Connected to live backend
- **Sample Data**: 3 test runs with different statuses

**The multi-agent orchestrator is now fully operational!**
