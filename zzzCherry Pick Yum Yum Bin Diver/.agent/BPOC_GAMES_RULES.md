# 🎮 BPOC.GAMES - Agent Rules & Memory

**READ THIS FIRST** - This file contains all critical context for building BPOC.GAMES

---

## 🎯 PROJECT MISSION

Build a **separate games platform** (games.bpoc.io) that:
1. Hooks Filipino talent with FUN games
2. Identifies top 1% through gameplay data
3. Feeds talent pipeline to main BPOC recruitment platform

**Key Principle:** These are REAL games that happen to reveal talent through data, not obvious "career tests"

---

## 🏆 TECH STACK (LOCKED IN)

```yaml
Frontend:
  framework: Next.js 15 (App Router)
  game_engine: Phaser.js 4 (TypeScript-first)
  language: TypeScript
  styling: Tailwind CSS
  state: Zustand

Backend:
  api: Next.js API Routes + Node.js microservices
  language: TypeScript + Python (ML)
  auth: Supabase Auth
  realtime: Supabase Realtime

Database:
  primary: PostgreSQL (Supabase)
  timeseries: TimescaleDB extension (game events)
  cache: Upstash Redis (serverless)

Infrastructure:
  frontend: Vercel (Edge CDN)
  backend: Railway (microservices)
  database: Supabase
  cdn: Cloudflare
  monitoring: Vercel Analytics + Sentry

DevOps:
  monorepo: Turborepo
  package_manager: pnpm
  ci_cd: GitHub Actions
```

**Why This Stack:**
- Web-native (Phaser > Unity for web games)
- Fast loads (<1s even on slow connections)
- Mobile-first (80% of Philippines on mobile)
- Scalable from day 1 (microservices-ready)
- Cost-efficient ($5/mo → scales to millions)

---

## 🏗️ ARCHITECTURE PRINCIPLES

### 1. Scalable from Day 1

**Pattern:** Modular Monolith → Microservices

```
MVP (Phase 1):
├── One Next.js app (easy development)
├── Clear module boundaries (games are separate)
└── Shared services (auth, scoring, analytics)

Scale (Phase 2):
├── Extract games to microservices
├── Independent scaling per game
└── When 10k+ concurrent users
```

**Rule:** Build monolith, DESIGN for microservices (clean boundaries)

### 2. Security First

```yaml
Authentication:
  ✅ Supabase Auth (JWT tokens)
  ✅ Row-level security (RLS) in Postgres
  ✅ Session management in Redis

API Security:
  ✅ Rate limiting (Redis-based, per IP/user)
  ✅ Input validation (Zod schemas ALWAYS)
  ✅ SQL injection prevention (parameterized queries)
  ✅ CORS (strict origins only)

Game Security:
  ✅ Server-side validation (NEVER trust client scores)
  ✅ Anti-cheat detection (flag impossible scores)
  ✅ Session tracking (prevent replay attacks)
  ✅ Encrypted game state

Privacy:
  ✅ GDPR compliant (separate consents)
  ✅ Data encryption at rest
  ✅ Audit logs (who accessed what)
```

### 3. Performance Targets

```yaml
Lighthouse Score (Mobile):
  performance: 95+
  accessibility: 100
  best_practices: 95+
  seo: 100
  pwa: enabled

Real-World Metrics:
  first_contentful_paint: <1.0s
  largest_contentful_paint: <2.0s
  time_to_interactive: <2.5s
  game_load_time: <1.5s
  bundle_size: <5MB

Connection:
  target: 3G (Philippines network conditions)
```

**How to Achieve:**
- Code splitting (lazy load games)
- Image optimization (Next.js Image)
- Asset compression (Brotli + Gzip)
- CDN caching (Cloudflare edge)
- Phaser optimization (WebGL, texture atlases)

### 4. Data is Everything

**Track EVERY game action:**

```typescript
interface GameEvent {
  event_id: uuid
  player_id: uuid
  session_id: uuid
  game_type: string
  event_type: 'start' | 'click' | 'decision' | 'pause' | 'complete' | 'error'
  timestamp: timestamptz
  response_time_ms: number
  event_data: jsonb
  metadata: jsonb
}
```

**Why:**
- Identify patterns (creativity, strategic thinking, learning speed)
- Anti-cheat (detect impossible scores)
- A/B testing (which mechanics work)
- ML training (predict job success from gameplay)

**Storage Strategy:**
- Hot (0-7 days): Postgres main tables (fast queries)
- Warm (8-90 days): TimescaleDB compressed (70% less storage)
- Cold (90+ days): Archive to S3/R2 (cheap long-term)

---

## 📁 MONOREPO STRUCTURE

```
bpoc-games/
├── .agent/                    # AI agent memory
│   ├── rules.md              # THIS FILE (read first!)
│   ├── architecture.md       # Architecture decisions
│   └── prompts/              # Reusable prompts
│
├── apps/
│   ├── web/                  # Main Next.js app (games.bpoc.io)
│   │   ├── app/
│   │   │   ├── (auth)/       # Auth routes
│   │   │   ├── (games)/      # Game routes (pattern-master, resource-rush, etc.)
│   │   │   ├── leaderboard/
│   │   │   ├── dashboard/
│   │   │   └── api/          # Next.js API routes
│   │   ├── components/
│   │   │   ├── games/        # Game-specific components
│   │   │   ├── ui/           # shadcn/ui
│   │   │   └── layout/       # Header, Footer, Nav
│   │   └── lib/              # Utilities (Supabase, Phaser, analytics)
│   │
│   ├── analytics-api/        # Node.js microservice (Railway)
│   │   └── src/
│   │       ├── routes/       # API routes
│   │       ├── services/     # Business logic
│   │       └── ml/           # Python ML models
│   │
│   └── admin-dashboard/      # Admin panel (Next.js)
│
├── packages/                 # Shared code
│   ├── ui/                   # Shared UI components
│   ├── game-engine/          # Phaser wrapper
│   ├── analytics-sdk/        # Event tracking
│   ├── types/                # TypeScript types
│   └── utils/                # Utilities
│
├── tooling/                  # Dev configs
│   ├── eslint-config/
│   ├── typescript-config/
│   └── tailwind-config/
│
└── turbo.json               # Turborepo config
```

---

## 🎮 GAME ARCHITECTURE (Pattern Master Example)

### File Structure for ONE Game

```
apps/web/components/games/pattern-master/
├── PatternMasterGame.tsx       # React wrapper (entry point)
├── game-config.ts              # Phaser configuration
└── scenes/                     # Phaser scenes
    ├── PreloadScene.ts         # Load assets
    ├── MenuScene.ts            # Main menu
    ├── GameScene.ts            # Core gameplay ⭐
    └── ResultsScene.ts         # End screen
```

### How Phaser + React Work Together

```typescript
// React Component (PatternMasterGame.tsx)
// - Renders Phaser game in <div>
// - Listens to Phaser events via EventBridge
// - Sends events to backend (analytics, scoring)

// Phaser Scene (GameScene.ts)
// - Game logic (spawning, collision, scoring)
// - Emits events to React via EventBridge
// - Receives data from React (user info, settings)

// EventBridge (packages/game-engine/EventBridge.ts)
// - Two-way communication between React and Phaser
// - Event emitter pattern
```

### Event Flow

```
Player clicks → Phaser detects → GameScene.handleClick()
                                      ↓
                            EventBridge.emit('game:decision')
                                      ↓
                      React component receives event
                                      ↓
                        Send to API (/api/games/events)
                                      ↓
                     Store in Postgres (TimescaleDB)
```

---

## 🗄️ DATABASE SCHEMA

### Core Tables

```sql
-- Game sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY,
  player_id UUID REFERENCES auth.users(id),
  game_type TEXT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  final_score INTEGER,
  metadata JSONB
);

-- Game events (TimescaleDB hypertable)
CREATE TABLE game_events (
  event_id UUID PRIMARY KEY,
  session_id UUID REFERENCES game_sessions(id),
  player_id UUID REFERENCES auth.users(id),
  game_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  response_time_ms INTEGER,
  event_data JSONB,
  metadata JSONB
);

-- Convert to TimescaleDB (auto-partitioning by time)
SELECT create_hypertable('game_events', 'timestamp');

-- Leaderboards (Redis + Postgres)
CREATE TABLE leaderboards (
  id UUID PRIMARY KEY,
  game_type TEXT NOT NULL,
  player_id UUID REFERENCES auth.users(id),
  score INTEGER NOT NULL,
  level INTEGER NOT NULL,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(game_type, player_id)
);

CREATE INDEX idx_leaderboards_score ON leaderboards(game_type, score DESC);
```

### TimescaleDB Benefits

- **Automatic partitioning** (by time, e.g., daily chunks)
- **Compression** (70-95% storage savings after 7 days)
- **Fast aggregations** (SUM, AVG, COUNT over time windows)
- **Retention policies** (auto-delete old data)

---

## 🔒 SECURITY RULES (CRITICAL)

### Never Trust the Client

```typescript
// ❌ BAD: Client sends final score
POST /api/games/complete
{ score: 99999 } // Cheater!

// ✅ GOOD: Server calculates score from events
POST /api/games/complete
{ session_id: 'xxx' }

// Server:
const events = await getGameEvents(session_id)
const score = calculateScore(events) // Validate each event
```

### Row-Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_events ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY user_select_own_sessions ON game_sessions
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY user_insert_own_events ON game_events
  FOR INSERT WITH CHECK (auth.uid() = player_id);
```

### Rate Limiting

```typescript
// Use Redis for distributed rate limiting
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10s'), // 10 requests per 10 seconds
})

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await ratelimit.limit(ip)

  if (!success) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  // Process request...
}
```

### Anti-Cheat Detection

```typescript
// Flag suspicious scores
function detectCheat(events: GameEvent[]): boolean {
  // Check for impossible response times
  const avgResponseTime = events.reduce((sum, e) => sum + e.response_time_ms, 0) / events.length
  if (avgResponseTime < 100) return true // Too fast (bot)

  // Check for impossible accuracy
  const accuracy = events.filter(e => e.event_data.correct).length / events.length
  if (accuracy > 0.98 && events.length > 50) return true // Suspiciously perfect

  // Check for patterns (repeated identical timings)
  const timings = events.map(e => e.response_time_ms)
  const uniqueTimings = new Set(timings)
  if (uniqueTimings.size < timings.length * 0.5) return true // Too repetitive

  return false
}
```

---

## 📊 ANALYTICS & SCORING

### What to Track

```yaml
Cognitive Metrics:
  - Pattern recognition speed
  - Learning curve (improvement over time)
  - Working memory capacity
  - Sustained attention duration

Behavioral Metrics:
  - Risk tolerance (bold vs cautious decisions)
  - Strategic thinking (planning depth)
  - Adaptability (response to difficulty changes)
  - Persistence (attempts before giving up)

Creative Metrics:
  - Solution diversity (unique approaches)
  - Innovation (unusual but effective)
  - Flexibility (trying different strategies)
```

### Scoring Algorithm (Example)

```typescript
interface PlayerScore {
  cognitive: number    // 0-100
  behavioral: number   // 0-100
  creative: number     // 0-100
  overall: number      // 0-100
}

function calculatePlayerScore(events: GameEvent[]): PlayerScore {
  // Cognitive: Speed + accuracy + learning curve
  const cognitive = (
    calculateSpeed(events) * 0.4 +
    calculateAccuracy(events) * 0.3 +
    calculateLearning(events) * 0.3
  )

  // Behavioral: Risk + strategy + adaptability
  const behavioral = (
    calculateRisk(events) * 0.3 +
    calculateStrategy(events) * 0.4 +
    calculateAdaptability(events) * 0.3
  )

  // Creative: Diversity + innovation + flexibility
  const creative = (
    calculateDiversity(events) * 0.4 +
    calculateInnovation(events) * 0.3 +
    calculateFlexibility(events) * 0.3
  )

  const overall = (cognitive + behavioral + creative) / 3

  return { cognitive, behavioral, creative, overall }
}
```

---

## 🚀 DEVELOPMENT WORKFLOW

### First-Time Setup

```bash
# Clone repo
git clone https://github.com/bpoc/games.git
cd bpoc-games

# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with credentials

# Run migrations
pnpm db:migrate

# Start dev servers
pnpm dev
# ✓ web: http://localhost:3000
# ✓ analytics-api: http://localhost:3001
# ✓ admin: http://localhost:3002
```

### Adding a New Game

```bash
# Use generator
pnpm generate:game --name="resource-rush"

# Creates:
# - Game route: apps/web/app/(games)/resource-rush/
# - Components: apps/web/components/games/resource-rush/
# - API routes: apps/web/app/api/games/resource-rush/
# - Database migration
# - Tests
```

### Testing

```bash
# Unit tests
pnpm test

# E2E tests (Playwright)
pnpm test:e2e

# Test specific game
pnpm test --filter=web -- pattern-master

# Coverage
pnpm test:coverage
```

### Deployment

```bash
# Frontend (Vercel)
vercel --prod

# Backend (Railway)
railway up

# Database migrations (Supabase)
pnpm db:migrate:prod
```

---

## 🎯 3 GAMES TO BUILD

### Game 1: Pattern Master ⭐ START HERE

**What it tests:** Pattern recognition, learning speed, cognitive ability

**Mechanics:**
- Show sequence of shapes/colors
- Player identifies pattern and continues it
- Adaptive difficulty (gets harder as they succeed)
- Time pressure increases

**Why first:** Simple to build, high signal for analytical thinking

**Dev time:** 2-3 weeks

---

### Game 2: Resource Rush

**What it tests:** Decision-making, strategic thinking, prioritization

**Mechanics:**
- Manage resources (time, money, people)
- Complete projects with deadlines
- Random events force trade-offs
- Balance short-term vs long-term

**Why second:** Simulates real work scenarios, measures multiple traits

**Dev time:** 4-5 weeks

---

### Game 3: Innovation Lab

**What it tests:** Creativity, problem-solving, innovation

**Mechanics:**
- Physics-based puzzle game
- Build contraptions to solve challenges
- Multiple valid solutions (rewards creativity)
- Tracks solution diversity

**Why third:** Hardest to build, but identifies creative thinkers (top 1%)

**Dev time:** 5-6 weeks

---

## ⚠️ CRITICAL RULES FOR AI AGENTS

### DO

✅ **Always validate input** (Zod schemas on every API)
✅ **Server-side calculations** (scores, rewards, progression)
✅ **Track everything** (every click, every decision)
✅ **Test on mobile** (80% of traffic from Philippines)
✅ **Optimize for slow connections** (3G target)
✅ **Use TypeScript** (no `any` types)
✅ **Write tests** (before deploying)
✅ **Check .agent/rules.md** (before making decisions)

### DON'T

❌ **Trust client scores** (always recalculate server-side)
❌ **Skip RLS policies** (security nightmare)
❌ **Use Unity WebGL** (too heavy for web)
❌ **Forget rate limiting** (prevent abuse)
❌ **Deploy without testing** (mobile + 3G)
❌ **Use `any` in TypeScript** (defeats the purpose)
❌ **Skip event tracking** (data is everything)
❌ **Ignore .agent/rules.md** (outdated decisions)

### Code Quality Standards

```typescript
// ✅ GOOD: Typed, validated, secure
import { z } from 'zod'

const GameEventSchema = z.object({
  session_id: z.string().uuid(),
  event_type: z.enum(['click', 'decision']),
  response_time_ms: z.number().min(0),
})

export async function POST(req: Request) {
  const body = await req.json()
  const data = GameEventSchema.parse(body) // Throws if invalid

  const user = await getAuthUser() // Server-side auth
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Store event...
}

// ❌ BAD: No validation, no auth, no types
export async function POST(req: Request) {
  const body = await req.json()
  // What if body is malformed? What if user is not logged in?
  // await db.insert(body) // SQL injection risk!
}
```

---

## 💰 COST ESTIMATES

### Monthly Costs by Scale

| Users | Vercel | Railway | Supabase | Redis | Total |
|-------|--------|---------|----------|-------|-------|
| 0-1k  | $0     | $5      | $0       | $0    | $5    |
| 1k-10k | $20   | $20     | $25      | $10   | $75   |
| 10k-100k | $20 | $50     | $100     | $50   | $220  |
| 100k-1M | $100 | $200    | $1000    | $200  | $1500 |

**Note:** These are estimates. Optimize for efficiency (caching, compression, lazy loading).

---

## 📚 RESOURCES

- **Phaser.js Docs**: https://phaser.io/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **TimescaleDB Docs**: https://docs.timescale.com
- **Turborepo Docs**: https://turbo.build/repo/docs
- **Upstash Redis**: https://upstash.com/docs/redis

---

## 🎯 MVP SUCCESS CRITERIA (Week 20)

- [ ] Pattern Master deployed and playable
- [ ] Resource Rush deployed and playable
- [ ] Innovation Lab deployed and playable
- [ ] Full authentication (Supabase Auth)
- [ ] Real-time leaderboards (Redis)
- [ ] Player dashboard with stats
- [ ] Admin analytics panel
- [ ] Mobile PWA working
- [ ] 95+ Lighthouse score (mobile)
- [ ] <2s load time on 3G
- [ ] Anti-cheat system active
- [ ] Integration API for main BPOC platform

---

## 🚨 EMERGENCY CONTACTS

- **Supabase Issues**: https://supabase.com/docs/support
- **Vercel Issues**: https://vercel.com/support
- **Railway Issues**: https://railway.app/help
- **Phaser Community**: https://discord.gg/phaser

---

**Last Updated:** 2026-01-23
**Status:** Ready to build
**Next Step:** Start with Game 1 (Pattern Master)

---

## 🔄 VERSION HISTORY

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-23 | Initial rules created |

---

**YOU HAVE ALL THE CONTEXT. START BUILDING PATTERN MASTER!** 🚀
