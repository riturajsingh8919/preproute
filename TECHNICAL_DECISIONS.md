# Technical Decisions & Architecture Documentation

## Overview

**PrepRoute Test Management System** is a full-stack integrated, production-ready frontend web application built for creating, managing, editing, and tracking test series and question banks.

---

## 1. Core Technology Stack Selection

| Domain               | Technology / Library                                  | Rationale                                                                                                                    |
| :------------------- | :---------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------- |
| **Framework**        | **Next.js 16 (App Router)** & **React 19**            | File-system routing, Server Components capabilities, optimized client-side hydration, and seamless navigation.               |
| **Language**         | **TypeScript 5**                                      | Strict type safety across components, Zustand state definitions, and API payload schemas.                                    |
| **Styling**          | **Tailwind CSS v4** & **Vanilla CSS (`globals.css`)** | Rapid UI utility styling with zero runtime overhead, combined with global interactive cursor rules and unified typography.   |
| **State Management** | **Zustand 5**                                         | Lightweight, zero-boilerplate global store (`useTestCreationStore`) to manage multi-step wizard state without prop-drilling. |
| **Form Handling**    | **React Hook Form** & **Zod**                         | Declarative form management with schema-driven validation (`createTestSchema`) for instant validation feedback.              |
| **HTTP Client**      | **Axios**                                             | Centralized API client configured with request/response interceptors for JWT auth headers and error handling.                |
| **Icons & Media**    | **Lucide React**                                      | Clean, accessible SVG iconography for action triggers, status indicators, and tracking metrics.                              |

---

## 2. Key Technical & Architectural Decisions

### A. Multi-Step Test Creation Wizard & Store Synchronization

- **Challenge**: Seamlessly transferring test configuration metadata (subject, topics, difficulty, time, total marks) to the questions creation step without losing state across page transitions.
- **Decision**: Implemented `useTestCreationStore` using Zustand. When a test is created via `POST /tests`, its details are stored globally. When the router navigates to `/tests/[testId]/questions`, the questions builder automatically reads `testDetails` to prepopulate the exact number of empty questions defined in `total_questions`, alongside the default subject ID.

### B. Payload Sanitization & Backend Schema Resilience

- **Challenge**: The REST backend enforces strict UUID format checks and returns `400 Bad Request` if optional string fields (such as `topic` or `sub_topic`) are submitted as empty strings (`""`). Additionally, questions require an explicit parent `subject` ID.
- **Decision**:
  1. Sanitized all payload mappings before dispatching `POST /questions/bulk` by stripping empty optional properties (`delete newQ.topic`, `delete newQ.sub_topic`).
  2. Auto-injected parent `subject` ID from `testDetails` into every item in the questions array.
  3. Mapped Subject, Topic, and Sub-topic names back to their corresponding UUIDs during test editing (`EditTestPage`).

### C. Prevention of Stale Editor State & DOM Overlap

- **Challenge**: Switching between question indices in the sidebar reused the same DOM text editor instance, causing question text to overlap or display stale content from previous indices.
- **Decision**: Added unique React `key` props (`key={`q-${currentQuestion.tempId || currentQuestionIndex}`}`) to the rich text editor component. This guarantees that React cleanly unmounts and remounts the editor when switching active question tabs.

### D. Comprehensive Test Tracking & Real-Time Operations (`/tests/tracking`)

- **Decision**: Designed and engineered a dedicated tracking dashboard featuring:
  - **Analytics Cards**: Real-time summary metrics for Total Tests, Live/Published Tests, Draft Tests, and Total Questions.
  - **Multi-Param Filtering**: Search query matching (by name or subject), Status filters (`All`, `Live`, `Draft`), and Type filters (`Chapterwise`, `PYQ`, `Mock Test`).
  - **Instant Status Toggle**: 1-click `Publish` / `Unpublish` API trigger using `PUT /tests/:id` with optimistic UI updates.

### E. Defensive Prefilling & Numeric Nullish Handling

- **Challenge**: Fields like `wrong_marks` (e.g. `0` or `-1`) were failing to prefill in the Edit view due to standard JavaScript logical OR coercions (`0 || '-1'` evaluating to `'-1'`).
- **Decision**: Replaced all logical OR coercions with explicit nullish coalescing checks (`??`), ensuring `0` and negative values parse and prefill with 100% accuracy.

---

## 3. Application Flow & Deliverables Summary

1. **Authentication (`/login`)**: JWT token authentication with local storage persistence and Axios authorization interceptor.
2. **Dashboard (`/`)**: Overview of all tests with search, edit, delete, and creation triggers.
3. **Test Creation (`/tests/create`)**: Schema-validated form for test parameters and multi-select topic chips.
4. **Questions Builder (`/tests/[testId]/questions`)**: Interactive question editor with options, correct answer selection, and solution explanation.
5. **Test Editing (`/tests/[testId]/edit`)**: Pre-populated edit suite with cascading subject/topic/subtopic ID resolvers.
6. **Test Tracking (`/tests/tracking`)**: Analytics cards, filterable test table, and instant publish/unpublish workflow.

---

## 4. Setup & Running Instructions

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Lint codebase
npm run lint

# Build for production
npm run build
```
