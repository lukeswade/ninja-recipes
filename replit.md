# Ninja Creami Recipe Book

## Overview

A web application for creating, managing, and sharing Ninja Creami recipes. Users can create private or public recipes with ingredients, directions, and photos. The app features recipe browsing, favoriting, and sharing functionality with a modern, chic, and classy editorial design inspired by luxury food magazines.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build**: React with TypeScript, Vite for build tooling, and SPA architecture

**UI Component System**: shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- Modern, chic, and classy editorial design system with sophisticated neutrals and metallic accents
- Color palette: Champagne gold (45 65% 70%), Merlot (350 45% 38%), warm cream backgrounds
- Responsive editorial grid layout (not masonry) with generous whitespace
- Dark mode support via ThemeProvider context with warm sophisticated dark palette
- Typography: Cormorant Garamond (serif) for elegant headlines, Work Sans (geometric sans) for body text
- Tall elegant recipe cards (portrait 3:4 aspect ratio) with refined details and subtle shadows

**State Management**:
- TanStack Query (React Query) for server state and API caching
- React Context API for authentication and theme state
- Local component state for UI interactions

**Routing**: Client-side routing (implicit from App.tsx structure with tab-based navigation)

**Key Features**:
- Recipe CRUD operations with image upload
- Recipe filtering (my recipes, public recipes, favorites, shared)
- Real-time search functionality
- Progressive Web App (PWA) with service worker and manifest

### Backend Architecture

**Runtime**: Node.js with Express.js server

**API Design**: RESTful API with the following endpoints:
- `/api/users` - User management and Firebase authentication sync
- `/api/recipes` - Recipe CRUD operations with query filtering
- `/api/favorites` - Favorite toggle functionality
- `/api/share` - Recipe sharing by email
- Health check endpoints (`/health`, `/healthz`) for deployment platforms

**Development Setup**: 
- Vite middleware integration for HMR in development
- Static file serving in production
- Request/response logging middleware

**Data Access Layer**: 
- Storage interface (`IStorage`) with in-memory implementation (`MemStorage`)
- Designed for easy migration to persistent database (Drizzle ORM schema already defined)

### Authentication & Authorization

**Authentication Provider**: Firebase Authentication
- Google OAuth sign-in with redirect flow
- Firebase client SDK for frontend authentication
- Custom middleware (`verifyFirebaseToken`) for API route protection
- Development mode bypass for testing with in-memory storage
- User sync between Firebase and backend on authentication

**Session Management**: Firebase ID tokens passed via Authorization header

### Data Storage

**Current Implementation**: In-memory storage using Map data structures

**Planned/Configured Database**: PostgreSQL with Drizzle ORM
- Schema defined in `shared/schema.ts` with Drizzle table definitions
- Neon serverless PostgreSQL connection configured
- Drizzle Kit configured for migrations

**Data Models**:
- Users (Firebase UID, email, display name, photo)
- Recipes (title, prep time, servings, directions, privacy settings, images)
- Ingredients (amounts, measurements, names, descriptions, links, ordering)
- Favorites (user-recipe relationships with counts)
- Shared Recipes (email-based sharing for private recipes)
- Recipe Photos (multiple photo support per recipe)

### External Dependencies

**Authentication & User Management**:
- Firebase Authentication (Google OAuth provider)
- Firebase SDK initialized with project configuration from environment variables

**File Storage**:
- Firebase Storage for recipe image uploads
- Image upload utilities in `useImageUpload` hook
- Upload path structure: `/recipes/{recipeId}/{filename}`

**Database**:
- Neon Serverless PostgreSQL (configured but not yet active)
- Connection via `@neondatabase/serverless` driver
- Drizzle ORM for type-safe database operations

**Frontend Libraries**:
- Radix UI components for accessible UI primitives
- TanStack Query for data fetching and caching
- React Hook Form with Zod validation
- Embla Carousel for image galleries
- date-fns for date formatting

**Development Tools**:
- Replit-specific plugins for runtime error overlay and development banner
- TypeScript with strict mode enabled
- PostCSS with Tailwind CSS and Autoprefixer

**Deployment**:
- Cloud Run compatible (health check endpoints)
- Environment variables required: `DATABASE_URL`, Firebase config variables (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`)
- PWA manifest and service worker for offline capability