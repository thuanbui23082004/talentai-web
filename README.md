# TalentAI Web

**A modern, intelligent, and user-friendly recruitment platform frontend.**

TalentAI Web is the frontend application of TalentAI, an AI-powered recruitment platform designed to streamline the job search and hiring process. Built with Next.js and TypeScript, it provides a responsive and intuitive interface for candidates, recruiters, and administrators.

The application focuses on CV management, AI-powered CV analysis, intelligent job matching, application tracking, and recruitment management.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [User Roles](#user-roles)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [API Integration](#api-integration)
- [Coding Conventions](#coding-conventions)
- [Testing and Quality Checks](#testing-and-quality-checks)
- [Contributing](#contributing)
- [Project Status](#project-status)
- [License](#license)

---

## Overview

Traditional recruitment processes often require candidates to search through numerous job postings and recruiters to manually review large volumes of CVs.

TalentAI aims to improve this experience by combining a user-friendly recruitment interface with AI-assisted CV analysis and candidate–job matching.

This repository contains **the web frontend only**. It is responsible for the user interface, client-side interactions, form validation, frontend state management, and communication with backend APIs.

### Project Objectives

- Provide a responsive and intuitive recruitment experience.
- Help candidates manage their CVs and explore suitable job opportunities.
- Present AI-generated CV insights and job-matching results in an understandable format.
- Help recruiters manage job postings and review potential candidates.
- Maintain a modular, maintainable frontend architecture that can evolve with the backend.

---

## Key Features

### 1. Authentication and User Access

- Login and registration interfaces.
- Form validation and user-friendly error messages.
- Role-oriented navigation for candidates, recruiters, and administrators.
- Authentication integration with the backend when available.

### 2. Job Discovery

- Browse and search job opportunities.
- View detailed job descriptions and requirements.
- Explore relevant information such as location, salary, and required skills.
- Save jobs and access application-related actions.

### 3. CV Management

- Upload and manage CVs.
- View uploaded CV information and processing status.
- Access CV analysis results.
- Display appropriate loading, success, empty, and error states.

### 4. AI-Powered CV Analysis

- Present CV analysis results returned by the AI service.
- Visualize skills, strengths, and areas for improvement.
- Display analysis scores and structured insights.
- Support asynchronous analysis states, including queued, processing, completed, and failed.

### 5. Intelligent Job Matching

- Display job-matching scores returned by the backend.
- Show matching skills and missing skills.
- Present explanations of job suitability.
- Recommend relevant job opportunities based on available CV and job data.

### 6. Application Management

- View submitted applications.
- Track application statuses.
- Access relevant job and application information.
- Display application history and status updates.

### 7. Recruiter Dashboard

- View recruitment-related statistics.
- Create and manage job postings.
- Review candidates associated with a job.
- Display candidate rankings and matching insights.
- Track recruitment progress through a pipeline interface.

### 8. Administration

- Provide interfaces for platform administration.
- Support user and platform-data management as the relevant backend capabilities become available.

> Feature availability depends on the current development stage and backend integration status.

---

## User Roles

| Role | Main Responsibilities |
|---|---|
| Candidate | Manage CVs, explore jobs, view AI analysis, track applications, and discover matching opportunities. |
| Recruiter | Manage job postings, review candidates, evaluate matching results, and track recruitment progress. |
| Administrator | Access administrative interfaces and manage platform resources according to assigned permissions. |

Frontend route protection improves navigation and user experience, but actual authentication and authorization must also be enforced by the backend.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) | React framework and application routing |
| [React](https://react.dev/) | User interface development |
| [TypeScript](https://www.typescriptlang.org/) | Static typing and maintainability |
| [Tailwind CSS](https://tailwindcss.com/) | Utility-first styling and responsive layouts |
| [TanStack Query](https://tanstack.com/query/latest) | Server-state management, caching, and asynchronous requests |
| [Zustand](https://zustand.docs.pmnd.rs/) | Shared client-side state when needed |
| [Zod](https://zod.dev/) | Runtime data validation |
| [React Hook Form](https://react-hook-form.com/) | Form state management |
| [openapi-fetch](https://openapi-ts.dev/openapi-fetch/) | Type-safe API requests using OpenAPI definitions |
| [pnpm](https://pnpm.io/) | Package management |

Additional libraries may be introduced when required by specific features, such as charts, file uploads, tables, or drag-and-drop interactions.

---

## Application Architecture

TalentAI Web follows a **feature-based frontend architecture** using the Next.js App Router.

The application separates routing, business features, reusable components, data access, and mock data.

```text
User
  |
  v
Next.js App Router
  |
  v
Feature Modules
  |
  +-- UI Components
  +-- Hooks
  +-- Services
  +-- Types and Validation
  |
  v
Data Access Layer
  |
  +-- Mock Data (during frontend development)
  |
  +-- Backend API (when available)
```

### Architectural Principles

**1. Route and feature separation**

The `app/` directory defines routes and layouts. The `features/` directory contains the functionality used to build those pages.

**2. Feature-based organization**

Each major business feature keeps its related components, hooks, services, types, and validation schemas together where appropriate.

**3. Centralized API access**

API requests should use shared configuration and feature-level services instead of being implemented independently throughout page components.

**4. Mock-first development**

The frontend can be developed independently of the backend using realistic mock data. Mock implementations should remain clearly separated from production API implementations.

**5. Contract-driven integration**

The frontend and backend should agree on endpoint definitions, request parameters, response structures, and error formats through an OpenAPI contract.

**6. Responsive and accessible UI**

Pages should work across desktop and mobile screen sizes and provide appropriate keyboard interaction, labels, and feedback.

---

## Project Structure

```text
talentai-web/
├── .agents/
│   └── rules/
│       ├── project-rules.md
│       └── frontend-rules.md
│
├── .github/
│   └── workflows/
│       └── ci.yml
│
├── contracts/
│   ├── openapi.yaml
│   └── examples/
│
├── docs/
│   ├── architecture.md
│   ├── api-integration.md
│   └── user-flows.md
│
├── public/
│   └── images/
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (candidate)/
│   │   ├── (recruiter)/
│   │   ├── (admin)/
│   │   ├── layout.tsx
│   │   └── providers.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── jobs/
│   │   ├── cv/
│   │   ├── cv-analysis/
│   │   ├── matching/
│   │   ├── applications/
│   │   ├── recruiter/
│   │   └── admin/
│   │
│   ├── components/
│   │   ├── ui/
│   │   └── shared/
│   │
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── config/
│   │   ├── validations/
│   │   └── utils.ts
│   │
│   ├── mocks/
│   │   ├── fixtures/
│   │   └── handlers.ts
│   │
│   ├── hooks/
│   └── types/
│
├── tests/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-lock.yaml
└── tsconfig.json
```

*The tree above describes the intended organization. Some directories may be added as implementation progresses.*

### Directory Responsibilities

| Directory | Responsibility |
|---|---|
| `src/app/` | Routes, layouts, and page composition |
| `src/features/` | Feature-specific UI, hooks, services, and types |
| `src/components/ui/` | Reusable low-level UI components |
| `src/components/shared/` | Shared application components |
| `src/lib/api/` | Shared API client and generated API types |
| `src/lib/validations/` | Shared validation utilities and schemas |
| `src/mocks/` | Mock fixtures and development handlers |
| `contracts/` | API contract and example payloads |
| `docs/` | Architecture decisions, API notes, and user flows |
| `tests/e2e/` | End-to-end tests |

---

## Getting Started

### Prerequisites

Install the following tools before starting development:

- Node.js version compatible with the project's Next.js version.
- pnpm.
- Git.

Check the installed versions:

```bash
node --version
pnpm --version
git --version
```

### 1. Clone the Repository

```bash
git clone https://github.com/thuanbui23082004/talentai-web.git
cd talentai-web
```

### 2. Install Dependencies

```bash
pnpm install
```

Use pnpm consistently to keep the dependency lockfile synchronized.

### 3. Configure Environment Variables

Create a local environment file from the example:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux**

```bash
cp .env.example .env.local
```

Update the variables according to your local development setup.

### 4. Start the Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Build for Production

```bash
pnpm build
pnpm start
```

The exact scripts are defined in `package.json`. Use the scripts configured in the repository if they differ from these examples.

---

## Environment Variables

Environment variables configure the frontend without hardcoding environment-specific values.

Example `.env.example`:

```dotenv
# Backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api

# Frontend data mode
NEXT_PUBLIC_DATA_MODE=mock
```

### Variable Descriptions

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL of the backend API |
| `NEXT_PUBLIC_DATA_MODE` | Selects the mock or API data source if the application implements this switch |

The values above are examples. Adjust them to match the actual API routing and configuration used by the project.

**Security considerations**

- Never commit `.env.local` or real credentials.
- Variables prefixed with `NEXT_PUBLIC_` are exposed to browser-side code and must not contain secrets.
- Private tokens, server credentials, and sensitive configuration must not be placed in public environment variables.
- Ensure `.env.example` contains placeholders only.

---

## Development Workflow

### Frontend-First Development

The frontend can be implemented before the backend is ready.

1. Define the TypeScript data model for the feature.
2. Create realistic mock fixtures.
3. Implement the service that provides the data.
4. Create hooks for data fetching and state management.
5. Build the UI components and page.
6. Validate loading, empty, success, and error states.
7. Replace the mock service with real API requests when the backend is available.

For example, the job listing feature can use mock job records while the backend team implements the corresponding endpoint.

### Asynchronous CV Analysis

CV analysis is an asynchronous workflow. The frontend should support states such as:

- `queued`: waiting to be processed.
- `processing`: analysis is in progress.
- `completed`: results are available.
- `failed`: analysis could not be completed.

The frontend should use the analysis identifier and status returned by the backend. Polling or server-sent events can be introduced depending on the agreed API design.

Mock analysis results are for development and demonstration only; production results must come from the backend or AI service.

---

## API Integration

The frontend communicates with backend services through documented APIs.

### Integration Principles

- Keep endpoint definitions and response schemas consistent with `contracts/openapi.yaml`.
- Centralize API configuration and error handling.
- Use TanStack Query for server-state fetching, caching, and mutations where appropriate.
- Use `openapi-fetch` with generated TypeScript definitions when the OpenAPI generation workflow is configured.
- Validate external data at appropriate boundaries.
- Handle network failures, unauthorized responses, and expired sessions.
- Avoid embedding backend business logic inside UI components.

### Planned API Areas

| Area | Example Operations |
|---|---|
| Authentication | Register, login, logout, retrieve current user |
| Jobs | List, search, view details, create and update job postings |
| CVs | Upload, list, view and manage CVs |
| CV Analysis | Start analysis, retrieve status and results |
| Matching | Retrieve matching jobs, scores, skill gaps, and ranked candidates |
| Applications | Submit applications and retrieve application statuses |
| Recruitment | Manage recruitment pipeline and candidate records |
| Administration | Manage platform resources according to permissions |

These are planned integration areas, not a guarantee that all endpoints are already implemented.

---

## Coding Conventions

### General

- Use TypeScript for application code.
- Prefer explicit and meaningful types.
- Avoid `any` unless there is a justified reason.
- Keep components focused on a single responsibility.
- Reuse existing components and utilities.
- Avoid duplicating business logic across pages.
- Keep naming consistent and descriptive.

### Components

- Use PascalCase for React component filenames and component names.
- Use camelCase for functions, variables, and hooks.
- Prefix custom React hooks with `use`.
- Keep page components in `src/app/` focused on composition and routing.
- Keep feature-specific components inside their corresponding feature modules.

### Data and State

- Use TanStack Query for server state.
- Use local React state for component-specific UI state.
- Use Zustand only when state genuinely needs to be shared across components.
- Use Zod and React Hook Form where appropriate for form validation.
- Keep mock data separate from production API logic.

### UI and Accessibility

- Build responsive layouts.
- Provide clear loading, error, and empty states.
- Use semantic HTML elements.
- Provide labels for form fields.
- Ensure interactive elements are keyboard accessible.
- Avoid relying on color alone to communicate status.

---

## Testing and Quality Checks

Run the checks supported by the repository before submitting changes.

Typical commands include:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

Check `package.json` for the available scripts and adapt commands to the configured tooling.

Recommended test coverage includes:

- Form validation and user interactions.
- Job search and job detail rendering.
- CV upload states and analysis status transitions.
- Matching-result rendering.
- Application status changes.
- Role-specific navigation.
- Critical candidate and recruiter workflows.

End-to-end tests can be added using a tool such as Playwright when the core user flows are stable.

---

## Contributing

Contributions from team members should follow a consistent workflow.

### 1. Create a Feature Branch

```bash
git checkout -b feature/job-listing
```

Use descriptive branch names, for example:

- `feature/auth`
- `feature/cv-management`
- `feature/cv-analysis`
- `feature/job-matching`
- `feature/recruiter-dashboard`
- `fix/api-error-handling`

### 2. Implement the Feature

- Review existing architecture and project rules.
- Keep changes focused on the assigned feature.
- Use mock data when the required API is unavailable.
- Update API contracts and types when the agreed data structure changes.

### 3. Verify the Changes

Run available lint, type-check, and build commands.

### 4. Commit and Push

```bash
git add .
git commit -m "feat: implement job listing"
git push -u origin feature/job-listing
```

### 5. Open a Pull Request

Before merging, ensure that the change is reviewed, does not introduce unrelated modifications, and remains compatible with the agreed API contract.

### Commit Message Convention

Use clear commit prefixes where practical:

- `feat:` — new feature.
- `fix:` — bug fix.
- `refactor:` — code restructuring.
- `style:` — formatting or styling changes.
- `docs:` — documentation changes.
- `test:` — test additions or updates.
- `chore:` — maintenance and configuration.

Examples:

```text
feat: add CV upload interface
feat: display job matching results
fix: handle failed CV analysis
refactor: centralize API client
docs: update project setup guide
```

---

## Project Status

**Current focus:** Frontend development and preparation for backend integration.

Planned development milestones:

- [ ] Establish the shared frontend architecture.
- [ ] Implement authentication interfaces.
- [ ] Implement job discovery and job details.
- [ ] Implement CV management.
- [ ] Implement AI analysis and matching-result interfaces.
- [ ] Implement application tracking.
- [ ] Implement recruiter dashboard and candidate pipeline.
- [ ] Integrate backend APIs.
- [ ] Validate responsive layouts and critical user flows.
- [ ] Prepare the frontend for deployment.

The checklist should be updated as work is completed. It does not imply that every feature is currently implemented.

---

## License

The licensing terms have not yet been specified. Add a `LICENSE` file and update this section once the project license has been agreed upon.

---

**TalentAI Web** — Making recruitment experiences smarter, clearer, and more accessible.