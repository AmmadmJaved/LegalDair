# Overview

LegalDiary is a professional case management and collaboration tool designed specifically for lawyers. It provides a mobile-first Progressive Web Application (PWA) that allows legal professionals to manage their cases, track hearings, maintain diary entries, collaborate with chamber colleagues, and organize legal documents. The application features offline functionality, real-time collaboration through WebSockets, and a comprehensive case management system with priority tracking and hearing scheduling.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

The application uses a **React-based Single Page Application (SPA)** with TypeScript for type safety and maintainability. The frontend follows a modern component-based architecture:

- **Component Library**: Utilizes shadcn/ui components built on top of Radix UI primitives for accessible and customizable UI components
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **PWA Features**: Service worker implementation for offline functionality and caching strategies

The mobile-first design approach ensures optimal user experience across all devices, with specific components like StatusBar and BottomNavigation optimized for mobile interfaces.

## Backend Architecture

The server follows a **RESTful API architecture** built with Express.js:

- **Authentication**: Replit's OIDC authentication system with session management
- **API Layer**: Express.js with structured route handling and middleware
- **File Upload**: Multer middleware for handling document uploads with type validation
- **Real-time Features**: WebSocket server for live collaboration and updates
- **Error Handling**: Centralized error handling with proper HTTP status codes

The backend implements a layered architecture with separate concerns for routing, authentication, storage, and business logic.

## Data Storage

The application uses **PostgreSQL** as the primary database with Drizzle ORM for type-safe database operations:

- **Database Schema**: Comprehensive schema covering users, cases, diary entries, documents, comments, reminders, chambers, and chamber memberships
- **Session Storage**: PostgreSQL-based session storage for authentication persistence
- **File Storage**: Local file system storage for document uploads with future cloud storage extensibility
- **Data Validation**: Drizzle-Zod integration for runtime schema validation

The database design supports multi-tenancy through chamber memberships and includes proper indexing for performance optimization.

## Authentication and Authorization

The system implements **Replit's OIDC authentication** with the following features:

- **OpenID Connect**: Integration with Replit's identity provider
- **Session Management**: PostgreSQL-backed session storage with configurable TTL
- **User Management**: Automatic user creation and profile management
- **Security**: HTTP-only cookies, CSRF protection, and secure session handling

Authorization is handled through middleware that validates user sessions and enforces access controls based on chamber memberships and case ownership.

# External Dependencies

## Third-party Services

- **Neon Database**: Serverless PostgreSQL database hosting for scalable data storage
- **Replit Authentication**: OIDC-based authentication service for user management
- **Font Services**: Google Fonts for typography (Inter font family)
- **CDN Services**: Cloudflare CDN for external assets and libraries

## Key Libraries and Frameworks

- **Frontend**: React 18, TypeScript, Vite for build tooling
- **UI Components**: Radix UI primitives, shadcn/ui component library
- **Styling**: Tailwind CSS with PostCSS processing
- **Database**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Passport.js with OpenID Client strategy
- **File Handling**: Multer for multipart form data processing
- **WebSockets**: ws library for real-time communication
- **Validation**: Zod for schema validation and type inference
- **Date Handling**: date-fns for date manipulation and formatting

## Development Tools

- **Build System**: Vite with React plugin and runtime error overlay
- **Type Checking**: TypeScript with strict mode enabled
- **Code Quality**: ESBuild for production bundling
- **Development Server**: Vite dev server with HMR support
- **Database Migrations**: Drizzle Kit for schema management

The application is designed to be easily deployable on Replit's infrastructure while maintaining the flexibility to migrate to other cloud providers if needed.