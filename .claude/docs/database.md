# Database

Schema managed via Prisma at `packages/database/prisma/schema.prisma`

## Database Schema

```
Profile (profiles)
├── id, clerkUserId, email, firstName, lastName
├── plan, subscriptionStatus, subscriptionExpiresAt
└── Relations: channels[], videos[], transcripts[], transcriptChunks[], payments[]

Payment (payments)
├── profileId → Profile
├── amount, currency, provider (paypal/sepay), status
├── providerTransactionId, providerOrderId
└── @@unique([provider, providerTransactionId])

Channel (channels)
├── profileId → Profile
├── channelId (YouTube), channelName, description
└── Relations: videos[]

Video (videos)
├── profileId → Profile, channelId → Channel
├── videoId (YouTube), title, duration, tags[]
└── Relations: transcript, transcriptChunks[]

Transcript (transcripts)
├── profileId → Profile, videoId → Video
├── fullText, wordCount, language, source
└── Relations: chunks[]

TranscriptChunk (transcript_chunks)
├── profileId → Profile, transcriptId → Transcript, videoId → Video
├── content, chunkIndex, tokenCount, startTime, endTime
└── embedding: vector(1536)
```

## Database Commands

```bash
# Generate Prisma client (after schema changes)
npm run build --filter database

# Push schema changes to database
cd packages/database && npx prisma db push

# View database in Prisma Studio
cd packages/database && npx prisma studio
```

## Usage in Code

```typescript
import { database } from "@repo/database";

// Create profile (via Clerk webhook)
await database.profile.upsert({
  where: { clerkUserId: data.id },
  create: { clerkUserId: data.id, email, firstName },
  update: { email, firstName },
});

// Get user's videos
const videos = await database.video.findMany({
  where: { profileId: profile.id },
  include: { channel: true },
});
```

## RLS & Security

- **RLS enabled** on all tables (Supabase)
- **Prisma** for application queries (bypasses RLS via service role)
- **Frontend** should use Supabase client with user JWT for RLS enforcement

## Key SQL Functions (RAG)

```sql
-- Semantic search - auto-filters by current user
SELECT * FROM match_transcript_chunks(embedding, 0.7, 10);

-- Full-text search
SELECT * FROM search_transcripts_fulltext('keyword', 20);

-- Hybrid search (semantic + fulltext)
SELECT * FROM hybrid_search('query', embedding, 0.7, 0.3, 10);
```

## Important Notes

- **User ownership**: All data linked to `profiles.id` via `profileId` field
- **Clerk sync**: Webhook at `/api/webhooks/auth` syncs Clerk users to profiles
- **Payments sync**: Webhook at `/api/webhooks/payments` updates subscription status
- **Chunk size**: ~500-1000 tokens for optimal RAG
- **Embedding dimension**: 1536 (Gemini, set output_dimensionality=1536)
