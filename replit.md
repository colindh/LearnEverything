# Learning Platform

A full-stack educational platform with three learning modes: Skill Development, Academic Learning, and Task-Based Training.

## Overview

This platform provides a comprehensive learning management system where administrators can create and manage educational content organized into topics with lessons and assessments. Learners can browse topics filtered by learning mode, view detailed course content, and access learning materials.

## Architecture

### Frontend (client/)
- **Framework**: React with TypeScript
- **Routing**: Wouter
- **State Management**: TanStack Query v5
- **UI Components**: Shadcn/UI with Tailwind CSS
- **Theme**: Dark/light mode support via ThemeProvider

### Backend (server/)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)
- **Session Storage**: PostgreSQL-backed sessions

### Shared (shared/)
- **Schema**: Drizzle schema definitions with Zod validation
- **Types**: Shared TypeScript types for frontend/backend

## Key Files

### Data Models (`shared/schema.ts`)
- `users`: User accounts with role (learner/admin)
- `topics`: Learning content with mode, difficulty, duration
- `lessons`: Ordered content within topics
- `assessments`: Quizzes, projects, exercises
- `prerequisites`: Topic dependency relationships
- `sessions`: Auth session storage

### API Routes (`server/routes.ts`)

**Public Routes:**
- `GET /api/topics` - List published topics (filter by mode, search)
- `GET /api/topics/:id` - Get topic with lessons, assessments, prerequisites

**Auth Routes:**
- `GET /api/auth/user` - Get current user
- `GET /api/login` - Start login flow
- `GET /api/logout` - Logout

**Admin Routes (require admin role):**
- `GET /api/admin/topics` - List all topics (including unpublished)
- `GET /api/admin/topics/:id` - Get any topic
- `POST /api/admin/topics` - Create topic with lessons/assessments
- `PUT /api/admin/topics/:id` - Update topic (replaces all relations)
- `PATCH /api/admin/topics/:id` - Partial topic update
- `DELETE /api/admin/topics/:id` - Delete topic
- `GET /api/admin/stats` - Dashboard statistics

### Frontend Pages (`client/src/pages/`)
- `landing.tsx` - Landing page for logged-out users
- `home.tsx` - Topic browser with mode tabs and search
- `topic-detail.tsx` - Full topic view with lessons/assessments
- `admin.tsx` - Admin dashboard with topic management
- `topic-editor.tsx` - Topic creation/editing form

### Key Components (`client/src/components/`)
- `header.tsx` - Navigation with user menu
- `mode-tabs.tsx` - Learning mode selector (Skill/School/Task)
- `topic-card.tsx` - Topic preview cards with skeleton loading
- `theme-provider.tsx` - Dark/light theme context
- `theme-toggle.tsx` - Theme switcher button

## Learning Modes

1. **Skill Development** - Practical skills, hands-on projects
2. **Academic Learning** - Traditional educational content
3. **Task-Based Training** - Goal-oriented learning paths

## User Roles

- **Learner** (default): Browse and view published topics
- **Admin**: Full CRUD access to topics, lessons, assessments

## Database Commands

```bash
npm run db:push    # Push schema changes to database
```

## Development

The application runs on port 5000 with hot reload:
- Frontend: Vite dev server
- Backend: Express with tsx

## Design System

Colors follow an educational theme:
- Primary: Education green (#BFE6DD)
- Secondary: Learning blue (#4A90E2)
- Supports both light and dark modes

See `design_guidelines.md` for detailed styling guidelines.
