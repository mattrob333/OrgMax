# OrgChart AI 🟣

An AI-powered organizational chart application that allows employees to chat with AI assistants representing their colleagues, check availability, and schedule meetings through Google Calendar integration.

## Features

- **Interactive Org Chart**: Beautiful, navigable organizational chart built with React Flow
- **AI Chat Assistants**: Each employee has a personalized AI assistant powered by OpenAI
- **Calendar Integration**: Check availability and book meetings directly through Google Calendar
- **Admin Management**: CSV upload for bulk employee data management
- **Personalization**: Custom AI assistant instructions for each employee
- **Dark Mode Design**: Stunning dark theme with purple accent colors

## Tech Stack

- **Framework**: Next.js 15 with TypeScript
- **Authentication**: Clerk with Google OAuth
- **Database**: PostgreSQL with Prisma ORM
- **AI**: OpenAI GPT-4o-mini with Vercel AI SDK
- **UI**: Tailwind CSS with Framer Motion
- **Charts**: React Flow for organizational visualization
- **State**: Zustand for global state management

## Getting Started

1. **Clone the repository**
2. **Install dependencies**: `npm install`
3. **Set up environment variables** (instructions to follow)
4. **Generate Prisma client**: `npm run db:generate`
5. **Push database schema**: `npm run db:push`
6. **Start development server**: `npm run dev`

## Environment Setup

Instructions to follow for detailed setup instructions for:
- Clerk authentication
- Google OAuth with calendar scopes
- OpenAI API
- PostgreSQL database

## Usage

1. **Admin Setup**: Upload employee CSV data through the admin panel
2. **Sign In**: Users sign in with Google OAuth
3. **Browse Org Chart**: Navigate the interactive organizational chart
4. **Chat with Colleagues**: Click on any employee to start an AI conversation
5. **Schedule Meetings**: Use the AI to check availability and book meetings
6. **Customize Assistant**: Update your AI assistant's behavior in settings