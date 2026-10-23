# Angular Interview Prep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and privately publish a working adaptive Angular interview-prep website covering Angular 16–22, RxJS, NgRx, mock interviews, lookup, repetition, and readiness.

**Architecture:** A buildless static single-page app keeps content and adaptive logic in small ES modules, renders views into one application shell, and persists user state in `localStorage`. Pure selection and scoring functions are tested with Node's built-in test runner; browser QA covers layout, keyboard behavior, and end-to-end flows.

**Tech Stack:** HTML, CSS, vanilla JavaScript ES modules, Node built-in tests, OpenAI Sites static hosting

**Spec:** `docs/superpowers/specs/2026-10-23-angular-interview-prep-design.md`

## Global Constraints

- Content level is mid-level to senior and assumes about five years of Angular experience.
- Angular 18–22 receives more weight than Angular 16–17 in Mixed and Modern Focus modes.
- The workout sequence is Warm-up, Modern Angular, Code Challenge, RxJS/NgRx, Senior Scenario, Review.
- Avoid pure white/black, heavy gamification, fabricated precision, and beginner-course framing.
- Preferences and study state persist only in the browser.

## Review Focus

- Empty or corrupt saved state falls back safely to defaults.
- Version filters never produce an empty workout; Mixed and Modern Focus keep modern weighting.
- Keyboard-only users can open/close lookup, navigate controls, reveal answers, and rate confidence.
- Small screens preserve readable code, tap targets, and navigation.
- Rating, bookmarking, and mistakes update future selection and every related view consistently.

---

### Task 1: Adaptive content engine

**Files:** Create `dist/assets/data.js`, `dist/assets/engine.js`, `tests/engine.test.mjs`

**Interfaces:** Produces `selectWorkout(content, state, mode)`, `applyRating(state, item, rating)`, `calculateReadiness(content, state)`, and seeded interview/lookup content.

- [ ] Write failing tests for modern weighting, version fallback, rating effects, corrupt-state normalization, and readiness bounds.
- [ ] Implement the question/reference library and pure adaptive-selection/state functions.
- [ ] Run `node --test tests/engine.test.mjs`; expect all tests to pass.

### Task 2: Warm application shell and dashboard

**Files:** Create `dist/index.html`, `dist/assets/styles.css`, `dist/assets/app.js`

**Interfaces:** Consumes Task 1 exports; produces responsive navigation, version controls, Today dashboard, and reusable card/progress components.

- [ ] Add a semantic shell with sidebar, mobile navigation, header controls, and accessible live regions.
- [ ] Build the warm notebook visual system and responsive layouts.
- [ ] Render the Today dashboard, readiness summary, due-review count, continuing topic, and workout outline.
- [ ] Run the engine tests and a static markup sanity check.

### Task 3: Workout, repetition, and personal decks

**Files:** Modify `dist/assets/app.js`, `dist/assets/styles.css`; extend `tests/engine.test.mjs`

**Interfaces:** Uses Task 1 state functions; produces daily workout flow, progressive reveals, confidence controls, bookmarks, mistakes, weak-area and cram sessions.

- [ ] Add tests proving selection reacts to ratings, overdue topics, bookmarks, and mistakes.
- [ ] Implement section progress, answer/hint/key-point/code reveals, ratings, save/remove, and review summary.
- [ ] Implement Saved, Mistakes, Modern Angular, Hard Questions, Review Today, and Interview Tomorrow views.
- [ ] Run all tests; expect a clean pass.

### Task 4: Lookup, mock interview, and progress

**Files:** Modify `dist/assets/app.js`, `dist/assets/styles.css`; extend `tests/engine.test.mjs`

**Interfaces:** Produces searchable lookup dialog, middle/senior mock interview flow and report, and topic readiness view.

- [ ] Test lookup filtering and mock-report/readiness calculations.
- [ ] Implement Ctrl/⌘+K lookup with accessible dialog behavior and concise reference cards.
- [ ] Implement mock setup, one-question-at-a-time interview, deferred answers, and summary report.
- [ ] Implement readiness bars, biggest-gap explanation, review-due information, and reset-safe empty states.
- [ ] Run all tests and static checks.

### Task 5: Browser verification and private publication

**Files:** Create `.openai/hosting.json`; modify app files only for verified defects.

**Interfaces:** Produces the packaged static Site and private production URL.

- [ ] Register the Site once and persist its exact project ID.
- [ ] Preview locally and verify desktop/mobile dashboard, workout rating, lookup shortcut, bookmark/mistake views, mock interview, persistence, and accessibility basics.
- [ ] Package the verified `dist/` output, push the exact source commit, and deploy privately.
- [ ] Confirm terminal deployment success and report the production URL.
