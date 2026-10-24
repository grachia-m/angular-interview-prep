# Frontend Interview Tracks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add adaptive JavaScript, HTML, CSS, and weighted mixed frontend interview tracks while preserving the existing multilingual Angular experience.

**Architecture:** Extend the shared locale-neutral catalog with a `track` boundary and track-specific workout blueprints. Keep one progress store keyed by stable IDs, then filter and quota-rank the same catalog for workouts, decks, mocks, lookup, and readiness.

**Tech Stack:** Buildless HTML, CSS, ES modules, Node test runner, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-24-frontend-interview-tracks-design.md`

## Global Constraints

- Preserve every existing Angular question ID and the storage key `angle-interview-state-v1`.
- Supported tracks are exactly `angular`, `javascript`, `html`, `css`, and `mixed`; missing or invalid state normalizes to `angular`.
- New visible copy and content must be complete in English, natural Russian, and Spain Spanish.
- JavaScript has 16 questions, HTML 6, and CSS 6; at least eight JavaScript questions cover asynchronous behavior.
- Interview Mix is JavaScript-heavy and guarantees two async questions when available.
- Examples expose only real `js`, `ts`, `html`, and `scss` files and escape all source markup.
- No file or directory may be deleted, moved, or renamed.

## Review Focus

- Old saved state without `trackMode` must open the unchanged Angular experience.
- Interview Mix must not lose async JavaScript coverage after adaptive re-ranking or sparse progress data.
- Angular version and Modern Focus weights must never distort JavaScript/HTML/CSS ranking.
- Switching locale or changing the track control during an active workout/mock must preserve session and note state.
- Long Russian/Spanish track and stage labels plus JS/HTML/SCSS code must not widen a 390 px page.

---

### Task 1: Add the track state and catalog boundary

**Files:**
- Create: `dist/assets/frontend-data.js`
- Modify: `dist/assets/data.js`
- Modify: `dist/assets/engine.js`
- Test: `tests/engine.test.mjs`

**Interfaces:**
- Produces `SUPPORTED_TRACKS`, `normalizeTrack(value)`, `filterByTrack(content, trackMode)`, and normalized `state.trackMode`.
- Every exported question has `track`; existing records receive `track: 'angular'`.

- [ ] Add failing tests `normalizeState migrates trackMode without changing progress`, `every question has a supported stable track`, and `track filtering keeps Angular and mixed compatibility`.
- [ ] Run `npm test`; confirm the missing exports and fields fail.
- [ ] Implement the track normalization boundary and empty frontend catalog exports without altering existing IDs or selection behavior.
- [ ] Run `npm test`; confirm all old and new tests pass.
- [ ] Commit with `git add dist/assets/frontend-data.js dist/assets/data.js dist/assets/engine.js tests/engine.test.mjs && git commit -m "feat: add frontend track boundary"`.

### Task 2: Add high-signal multilingual JavaScript, HTML, and CSS content

**Files:**
- Modify: `dist/assets/frontend-data.js`
- Modify: `dist/assets/data.js`
- Modify: `dist/assets/i18n.js`
- Test: `tests/engine.test.mjs`

**Interfaces:**
- `frontendQuestions` contains exactly 28 stable localized records: 16 JavaScript, 6 HTML, 6 CSS.
- `frontendLookupEntries` contains localized high-signal reference cards.
- Examples use `files: { js?, ts?, html?, scss? }` and localized context.

- [ ] Record the primary documentation used for Promise/event-loop, HTML semantics/forms, and CSS cascade/layout/container behavior in the execution ledger.
- [ ] Add failing tests `frontend catalog has the exact approved track counts`, `at least eight JavaScript questions cover async behavior`, `frontend content is complete in all locales`, and `frontend examples use only supported nonempty files`.
- [ ] Run `npm test`; confirm catalog coverage fails.
- [ ] Author the 28 questions, localized lookup cards, track/stage labels, and required practical examples from the spec.
- [ ] Generalize example-file selection and labels to support JavaScript while preserving TypeScript-first Angular behavior.
- [ ] Run `npm test`; confirm complete localized content, example, and Angular regression coverage passes.
- [ ] Commit with `git add dist/assets/frontend-data.js dist/assets/data.js dist/assets/i18n.js dist/assets/views.js tests/engine.test.mjs && git commit -m "feat: add multilingual frontend interview catalog"`.

### Task 3: Implement track blueprints and weighted adaptive selection

**Files:**
- Modify: `dist/assets/engine.js`
- Modify: `dist/assets/data.js`
- Test: `tests/engine.test.mjs`

**Interfaces:**
- Produces `getWorkoutBlueprint(trackMode)` and `selectTrackWorkout(content, state, options)` returning `{ items, blueprint }`.
- `selectMockQuestions` and `getDeck` accept an optional track mode without breaking old calls.
- Interview Mix quotas preserve JavaScript majority and async minimum.

- [ ] Add failing tests `each track workout follows its visible blueprint`, `Interview Mix is JavaScript heavy and includes two async questions`, `non Angular ranking ignores Angular version controls`, `decks and readiness can filter by track`, and `track-aware mock selection keeps senior variety`.
- [ ] Run `npm test`; confirm track-aware selection fails.
- [ ] Implement quota selection on top of the existing score rules, then add optional track filtering to decks, mocks, and readiness.
- [ ] Run `npm test`; confirm track behavior and every previous adaptive/spaced-repetition test pass.
- [ ] Commit with `git add dist/assets/engine.js dist/assets/data.js tests/engine.test.mjs && git commit -m "feat: add adaptive frontend track workouts"`.

### Task 4: Add track controls and localized track-aware views

**Files:**
- Modify: `dist/index.html`
- Modify: `dist/assets/app.js`
- Modify: `dist/assets/views.js`
- Modify: `dist/assets/i18n.js`
- Modify: `dist/assets/styles.css`
- Test: `tests/engine.test.mjs`

**Interfaces:**
- Adds `#track-mode` with localized options and accessible label.
- Workout renderer receives `blueprint`; progress, lookup, decks, and mock setup receive `trackMode`.
- Active session stores its blueprint and is unaffected by later control/locale changes.

- [ ] Add failing tests `index exposes the localized track selector`, `Today and progress name the active track in every locale`, `workout renders JavaScript and mixed blueprints`, `track control state is independent from active session state`, and `JavaScript example tabs use accessible JS labels`.
- [ ] Run `npm test`; confirm renderer and static hooks fail.
- [ ] Wire track selection, session blueprints, track-aware decks/mock/readiness/lookup, localized chrome, and responsive styles.
- [ ] Ensure Angular version controls remain usable for Angular and Interview Mix and are visually de-emphasized for other focused tracks.
- [ ] Run `npm test`; confirm all track, localization, code-tab, and prior UI tests pass.
- [ ] Commit with `git add dist/index.html dist/assets/app.js dist/assets/views.js dist/assets/i18n.js dist/assets/styles.css tests/engine.test.mjs && git commit -m "feat: add frontend track experience"`.

### Task 5: Verify, document, review, and publish

**Files:**
- Modify: `README.md`
- Verify: `dist/**`, `.github/workflows/**`

- [ ] Update README with the five tracks, JavaScript emphasis, Promise/async coverage, and unchanged local-first persistence.
- [ ] Run `npm test`, `git diff --check`, and inspect `git status --short`; confirm no deleted, moved, or unintended files.
- [ ] Follow the Sites local-preview instructions and run browser QA for all tracks and locales, including a mixed workout, async JS example, HTML/SCSS examples, saved/mistake decks, mock report, progress, console, focus, and 390 px overflow.
- [ ] Perform one fresh whole-branch review against the spec and Review Focus. Fix Critical/Important findings with RED→GREEN tests; ledger Minor findings.
- [ ] Commit final QA corrections and documentation, rerun the full suite, and push reviewed `main` to `origin/main` as already authorized by the publication request.
- [ ] Watch GitHub Pages to success, verify `origin/main` equals the deployed commit, and confirm the production selector, Russian/Spanish copy, async question, and code tabs without console errors.
