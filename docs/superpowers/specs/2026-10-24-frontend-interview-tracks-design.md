# Frontend Interview Tracks — Design

## Intent

Expand Angular Interview Prep into a focused middle/senior frontend interview workspace without turning it into an encyclopedic course. Keep the existing adaptive workout, confidence ratings, spaced repetition, bookmarks, mistakes, mock interviews, progress, multilingual content, and practical code tabs.

The new material covers JavaScript, HTML, and CSS. JavaScript is the primary addition, with explicit emphasis on Promises, `async`/`await`, the event loop, microtasks, error propagation, cancellation, concurrency, and production-grade asynchronous control flow.

## Goals

- Add selectable tracks: `Angular`, `JavaScript`, `HTML`, `CSS`, and `Interview Mix`.
- Preserve Angular as the default for existing and new state so the current product does not silently change behavior.
- Give each track a recognizable workout structure while reusing the same adaptive and spaced-repetition engine.
- Make `Interview Mix` resemble a frontend interview: about 55% JavaScript, 20% Angular, 15% HTML, and 10% CSS, with at least two asynchronous JavaScript questions whenever the catalog can supply them.
- Add only high-signal middle/senior questions, not beginner syntax drills or exhaustive reference material.
- Provide complete English, natural Russian, and Spain-Spanish content.
- Add practical examples only where code clarifies behavior, using JavaScript, TypeScript, HTML, and SCSS tabs as applicable.
- Preserve all existing IDs and browser-local progress.

## Non-goals

- A beginner HTML/CSS/JavaScript course.
- Frameworks other than Angular, backend Node.js specialization, algorithms/LeetCode, or system design outside frontend concerns.
- An executable code playground.
- Runtime translation or server-side accounts.
- Replacing the existing Angular version selector; it continues to affect Angular questions inside Angular and Interview Mix workouts.

## Selected approach

Add a top-level track selector and one shared catalog. Every question has a stable `track` (`angular`, `javascript`, `html`, or `css`), stable `topicKey`, stable adaptive metadata, localized content, and optional structured examples. The existing Angular catalog is tagged rather than forked.

Each track owns a workout blueprint:

- Angular: Warm-up → Modern Angular → Code Challenge → RxJS / NgRx → Senior Scenario.
- JavaScript: Runtime & Language → Objects & Functions → Async JavaScript → Code Challenge → Senior Scenario.
- HTML: Semantics → Forms & Accessibility → Browser Behavior → Markup Review → Senior Scenario.
- CSS: Cascade → Layout → Responsive UI → Debug / Refactor → Senior Scenario.
- Interview Mix: Warm-up → JavaScript Core → Async JavaScript → HTML & CSS → Angular → Senior Scenario.

A session stores the selected item order and its blueprint, so switching locale does not restart it. Readiness, mock selection, decks, and focused practice respect the active track; `Interview Mix` includes all tracks with JavaScript weighting.

This is preferable to putting all new questions into the existing Angular sections: that would make section labels misleading and reduce the usefulness of focused practice. Separate pages would duplicate the engine and fragment progress.

## Content scope

### JavaScript — 16 questions

Prioritize interview decisions and code reasoning:

- lexical scope, closures, and retained memory;
- `this` binding and arrow functions;
- prototypes, classes, property lookup, and composition;
- coercion, equality, and nullish/defaulting semantics;
- mutation, shallow copies, immutable updates, and `structuredClone` boundaries;
- modules and live bindings;
- event delegation and listener cleanup;
- event loop ordering: call stack, tasks, and microtasks;
- Promise construction, chaining, flattening, and error propagation;
- `async`/`await` sequencing versus parallel start;
- `Promise.all`, `allSettled`, `any`, and `race` tradeoffs;
- `fetch` failure semantics and explicit HTTP checks;
- cancellation with `AbortController`;
- timeouts and retry/backoff boundaries;
- bounded concurrency rather than uncontrolled fan-out;
- long tasks, rendering responsiveness, and worker boundaries.

At least eight JavaScript questions must concern asynchronous behavior directly or as part of a senior production scenario.

### HTML — 6 questions

- semantic structure and landmarks;
- accessible forms, labels, validation, and server-validation boundaries;
- buttons/links, keyboard behavior, focus, `dialog`, and `inert`;
- responsive images and loading priorities;
- script loading (`defer`, `async`, modules) and parsing order;
- review of an inaccessible interactive component.

### CSS — 6 questions

- cascade order, specificity, layers, and `!important`;
- Flexbox versus Grid decisions;
- containing blocks, positioning, and stacking contexts;
- sizing, overflow, intrinsic layout, and text expansion;
- media versus container queries and component reuse;
- rendering cost, animation choices, and reduced motion.

## Examples

Examples use a generalized file map supporting `js`, `ts`, `html`, and `scss`. Only supplied tabs appear. JavaScript examples default to `JavaScript`; Angular examples continue to default to `TypeScript`; otherwise the first file is selected.

Required multi-file examples include an accessible HTML interaction and a responsive CSS component. Required asynchronous examples include event-loop ordering, sequential-versus-parallel `await`, Promise combinators, cancellation, HTTP error handling, and bounded concurrency.

## State and compatibility

- Add normalized `trackMode` with supported values `angular`, `javascript`, `html`, `css`, and `mixed`.
- Missing or invalid `trackMode` becomes `angular`.
- Keep the existing storage key and all progress records unchanged.
- Existing Angular IDs, bookmarks, ratings, and review dates remain valid.
- Changing track starts no session by itself. Changing track during an active workout updates controls for the next session but does not reorder or replace the current session.
- Locale switching retains track, session blueprint, question order, reveals, selected example file, bookmarks, and mock notes.

## Adaptive behavior

- Focused tracks select only their own questions.
- Interview Mix applies track quotas before adaptive ranking and guarantees async JavaScript coverage when possible.
- Within each quota, overdue questions, mistakes, low mastery, and higher difficulty retain their current influence.
- Modern Focus and Angular version weights apply only to Angular questions.
- Mock interviews use the active track; Interview Mix contains at least half JavaScript questions and at least one HTML/CSS decision.
- Readiness shows the active track label and groups by stable topic keys.

## Localization and accessibility

- Every new interface string, question, hint, key point, answer, example context, lookup card, track label, and workout stage is available in `en`, `ru`, and Spain Spanish `es`.
- Code identifiers and platform API names remain unchanged.
- The track selector has a localized accessible label.
- Code tabs keep native buttons, tab roles, `aria-selected`, visible focus, and an associated tab panel.
- Long Russian and Spanish labels must not produce page-level horizontal scrolling at 390 px.

## Visual design

Preserve the warm notebook visual system. Place the track selector beside the Angular controls, with a compact mobile treatment. Track identity appears in Today, workouts, progress, decks, and mock setup without introducing a separate navigation hierarchy.

## Verification and publishing

- Automated tests cover state migration, exact question counts, content completeness, async coverage, mixed weighting, track-specific workout structure, mock/deck/readiness filtering, generalized example tabs, locale continuity, and existing Angular regressions.
- Browser QA covers every track, all three locales, one mixed workout, an async code example, HTML/SCSS examples, mock mode, saved/mistake decks, progress, and 390 px responsive behavior.
- Publish focused commits to `grachia-m/angular-interview-prep` and verify the matching GitHub Pages deployment and live production behavior.
