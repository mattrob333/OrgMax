# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OrgChart AI is a Next.js 15 application that creates an interactive organizational chart with AI-powered chat assistants representing each employee. Users can chat with AI versions of their colleagues, check calendar availability, and schedule meetings via Google Calendar integration.

**Tech Stack:**
- Next.js 15.3.4 (App Router) with TypeScript and Turbopack
- PostgreSQL with Prisma ORM 6.13.0
- Clerk 6.23.0 for authentication with Google OAuth
- OpenAI API (GPT-4o-mini) with Vercel AI SDK 4.3.16
- React Flow 11.11.4 for org chart visualization
- Zustand 5.0.5 for state management
- Tailwind CSS 4.1.10 with custom purple theme

## Development Commands

### Database Operations
```bash
npm run db:generate   # Generate Prisma client after schema changes
npm run db:push       # Push schema to database (no migrations)
npm run db:studio     # Open Prisma Studio GUI at localhost:5555
```

### Development
```bash
npm run dev           # Start dev server with Turbopack
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint
```

### Environment Setup
See `.env.example` for required variables and `LOCAL_SETUP.md` for complete local development setup guide.

## Architecture Overview

### Database Schema

**User Model** - Core employee/user entity:
- Standard fields: `clerkId`, `email`, `firstName`, `lastName`, `imageUrl`, `role`
- AI customization: `personalityType`, `customPrompt`, `systemMessage`
- Org chart hierarchy: `employeeId`, `title`, `department`, `managerId`, `isExplicitRoot`
- Relationships: `manager`, `directReports`, `chats`, `messages`, `documents`

**Chat Model** - Sessions between users and employee AI assistants:
- `userId` (initiator) + `employeeId` (target) with unique constraint
- `isActive`, `lastActivityAt`, `endedAt` for session management

**Document Model** - RAG documents for employee context:
- Supports `.txt` and `.md` files
- Stored as text in database, indexed by `userId`

**Key Enums:**
- `PersonalityType`: professional, friendly, technical, creative, analytical, supportive, direct, mentor
- `Role`: ADMIN, USER
- `MessageRole`: user, assistant, system
- `NotificationType`: CHAT_STARTED, CHAT_ENDED, MEETING_BOOKED, CALENDAR_UPDATED

### Server/Client Component Pattern

**Server Components** (data fetching, authentication):
- `app/page.tsx` - Main dashboard
- `app/admin/page.tsx` - Admin panel
- API routes under `app/api/*/route.ts`

**Client Components** (interactive UI, state):
- `app/DashboardClient.tsx` - Client-side orchestration
- `components/OrgChart.tsx` - React Flow visualization
- `components/ChatPanel.tsx` - AI chat interface

### Route Protection (Clerk Middleware)

Protected routes: `/`, `/admin`, `/settings`
Public routes: `/sign-in`, `/sign-up`

Middleware at `src/middleware.ts` uses `createRouteMatcher` for pattern matching.

## Critical Workflows

### CSV Upload & Employee Import

**Location:** `app/api/admin/upload-csv/route.ts`

**Three-Step Transaction Process:**
1. **Clear existing employee data** - Sets `employeeId`, `title`, `department`, `managerId` to null for all users
2. **Upsert employees** - Creates new users with temp Clerk IDs: `temp_${randomBytes(16).toString('hex')}`
3. **Link manager relationships** - Handles special `managerId='0'` for root nodes

**Important Notes:**
- Each CSV upload **completely replaces** the org chart data (auto-clears before import)
- `managerId='0'` → Sets `isExplicitRoot=true, managerId=null` (explicit root node)
- Empty `managerId` → Sets `isExplicitRoot=false, managerId=null` (unknown status)
- Fake emails (`@test.com`, `@demo.com`, etc.) skip Clerk invitations
- Validates with Zod schema before processing

**CSV Format:**
```csv
employeeId,firstName,lastName,email,title,department,managerId,personalityType,systemMessage
1,John,Doe,john@company.com,CEO,Executive,0,professional,
2,Jane,Smith,jane@company.com,CTO,Engineering,1,technical,"Expert in React"
```

### Authentication & User Lifecycle

**Initial User Creation (CSV Upload):**
1. Admin uploads CSV with employee data
2. System creates User with temp Clerk ID
3. Clerk invitation sent (unless fake email)

**User Sign-Up:**
1. Employee receives Clerk invitation
2. Signs up via Clerk (Google OAuth)
3. Webhook (`app/api/webhooks/clerk/route.ts`) fires
4. System matches by email and updates temp Clerk ID with real one

**First User Rule:**
- First user to sign in automatically gets `role=ADMIN` (see `lib/auth.ts:60-70`)

**Webhook Events Handled:**
- `user.created`, `user.updated` → Upsert user by email
- `user.deleted` → Delete user from database
- Uses Svix signature verification for security

### AI Chat System

**Location:** `app/api/chat/route.ts`

**Chat Initialization:**
1. Get current user and target employee (includes documents via `include: { documents: true }`)
2. Find or create Chat record with unique `[userId, employeeId]` constraint
3. Create `CHAT_STARTED` notification if new chat (unless self-chat)

**System Prompt Construction:**
```javascript
// Built from multiple sources:
1. Personality template from lib/personality-templates.ts
2. RAG documents (if any): "REFERENCE DOCUMENTATION: {content}"
3. Employee's custom systemMessage
4. Employee's customPrompt
5. Current date/time context
```

**AI Tools (Function Calling):**

**checkAvailability:**
- Fetches Google Calendar OAuth token from Clerk
- Calls Google Calendar Free/Busy API
- Returns busy time blocks or "completely available"

**bookMeeting:**
- Creates Google Calendar event on target's calendar
- Adds both users as attendees
- Auto-generates Google Meet link
- Creates `MEETING_BOOKED` notification

**Streaming:**
- Uses `streamText()` from Vercel AI SDK
- Returns `toDataStreamResponse()` for client streaming
- Saves messages to DB in `onFinish` callback

### Org Chart Layout Algorithm

**Location:** `lib/orgchart.ts`

**Two-Pass Hierarchical Algorithm:**

**Pass 1 (Post-order)** - Calculate subtree widths:
```
For each node (bottom-up):
  If leaf: width = nodeWidth
  Else: width = max(nodeWidth, sum(child widths) + gaps)
```

**Pass 2 (Pre-order)** - Assign absolute positions:
```
For each node (top-down):
  Place node at calculated center X
  Distribute children horizontally
  Create edges from parent to children
```

**Special Cases:**
- Multiple root nodes: Laid out side-by-side with spacing
- Floating admin node: Positioned next to CEO if not in org chart
- Uses React Flow with custom `EmployeeNode` component
- Purple theme (`#8b5cf6`) with smooth step edges

## Important Code Patterns

### API Route Structure

**Always include:**
```typescript
// Authentication check
const { userId } = await auth()
if (!userId) return new NextResponse('Unauthorized', { status: 401 })

// Get current user
const user = await db.user.findUnique({ where: { clerkId: userId } })

// Authorization check (for admin routes)
if (user.role !== 'ADMIN') return new NextResponse('Forbidden', { status: 403 })

// Validate request body with Zod
const schema = z.object({ /* ... */ })
const validated = schema.parse(body)
```

### Zustand State Management

**Global Store** (`lib/store.ts`):
- Chat state: `activeChatUserId`, `isChatPanelOpen`
- Org chart: `employees` array
- Notifications: `notifications`, `unreadCount`, `isNotificationPanelOpen`
- Chat history: `chatHistoryId`, `isChatHistoryModalOpen`

**Usage:**
```typescript
// Read state
const activeChatUserId = useAppStore(state => state.activeChatUserId)

// Update state
const setActiveChatUserId = useAppStore(state => state.setActiveChatUserId)
```

### Database Transactions

**Pattern for multi-step operations:**
```typescript
await db.$transaction(async (tx) => {
  // Step 1: Clear data
  await tx.user.updateMany({ /* ... */ })

  // Step 2: Create/update records
  const result = await tx.user.upsert({ /* ... */ })

  // Step 3: Update relationships
  await tx.user.update({ /* ... */ })

  return result
})
```

## Key Files Reference

### Core Application
- `src/app/page.tsx` - Main dashboard (server component)
- `src/app/DashboardClient.tsx` - Client-side orchestration
- `src/middleware.ts` - Clerk route protection

### Critical APIs
- `src/app/api/chat/route.ts` - AI chat streaming endpoint
- `src/app/api/admin/upload-csv/route.ts` - Employee CSV import (auto-clears existing data)
- `src/app/api/webhooks/clerk/route.ts` - User sync from Clerk
- `src/app/api/calendar/events/route.ts` - Google Calendar integration

### Main Components
- `src/components/OrgChart.tsx` - React Flow org chart visualization
- `src/components/ChatPanel.tsx` - AI chat interface with markdown
- `src/components/EmployeeNode.tsx` - Individual org chart nodes
- `src/components/CalendarView.tsx` - Google Calendar display

### Utilities & Libraries
- `src/lib/orgchart.ts` - Two-pass hierarchical layout algorithm
- `src/lib/personality-templates.ts` - AI personality system prompts
- `src/lib/auth.ts` - Clerk auth helpers (getCurrentUser, requireAuth, requireAdmin)
- `src/lib/store.ts` - Zustand global state
- `src/lib/notifications.ts` - Notification creation helpers

### Configuration
- `prisma/schema.prisma` - Database schema
- `.env.example` - Environment variables template
- `LOCAL_SETUP.md` - Local development setup guide
- `personality-types.md` - AI personality documentation

## Special Implementation Notes

### CSV Upload Behavior
- **Auto-clears all existing employee data** before import (complete replacement pattern)
- This allows re-uploading CSVs to fix mistakes without manual cleanup
- User accounts persist, only org chart fields are cleared

### Temporary Clerk IDs
- New employees get `clerkId = temp_${randomBytes(16).toString('hex')}`
- Random hex ensures uniqueness across multiple CSV uploads
- Replaced with real Clerk ID when user signs up

### Google Calendar OAuth
- Tokens stored in Clerk (not in database)
- Required scopes: `calendar.readonly`, `calendar.events`
- Hook `lib/use-require-scope.ts` prompts re-auth if scopes missing

### Notification System
- Created automatically for chat starts and meeting bookings
- Self-chats don't create notifications
- Notifications link to chat history via `chatId`

### AI Personality System
- 8 personality types with distinct system prompts
- Templates in `lib/personality-templates.ts`
- Can be customized per-employee via `customPrompt` and `systemMessage`

### Manager Relationships
- `managerId='0'` in CSV = explicit root (CEO/founder)
- Empty `managerId` = floating/unconnected node
- Frontend highlights nodes without managers (unless explicit roots)

## Common Operations

### Adding a New AI Personality Type
1. Add to `PersonalityType` enum in `prisma/schema.prisma`
2. Run `npm run db:generate && npm run db:push`
3. Add prompt template to `lib/personality-templates.ts`
4. Update `personality-types.md` documentation
5. Update Zod schema in `app/api/admin/upload-csv/route.ts`

### Modifying Database Schema
1. Edit `prisma/schema.prisma`
2. Run `npm run db:generate` to update Prisma client
3. Run `npm run db:push` to apply changes (or create migration)
4. Update TypeScript types in `src/types/index.ts` if needed
5. Update affected API routes and components

### Debugging Database Issues
- Use `npm run db:studio` to open Prisma Studio GUI
- Inspect User records for temp vs real Clerk IDs
- Check manager relationships and employeeId assignments
- View chat and notification records

### Testing CSV Uploads Locally
- Use fake email addresses (`@test.com`, `@demo.com`) to avoid sending invitations
- Sample file: `demo_staff.csv` in project root
- Each upload completely replaces existing org chart data
- Check upload results in Prisma Studio or via `/admin` page
