# Autrifix Web Architecture

## Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- Existing project UI/component libraries where already adopted

## Architectural principles

### Backend is authoritative

The backend owns:

- authentication/authorization;
- domain state;
- business invariants;
- service/job lifecycle;
- persistence.

### Frontend responsibilities

The web client owns:

- presentation;
- user interaction;
- local UI state;
- client-side form validation;
- API orchestration;
- accessibility;
- responsive UX.

### Data fetching

Follow the repository's established data-fetching strategy. Do not introduce a second competing approach without a documented reason.

### Components

Prefer composable components with clear ownership.

Avoid giant page components containing unrelated business logic.

### Forms

Use the existing validation/form patterns consistently.

### Error handling

Every asynchronous workflow should have intentional loading, error, empty, and success states.
