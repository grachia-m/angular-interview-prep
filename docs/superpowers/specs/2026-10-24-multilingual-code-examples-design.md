# Multilingual Study Content and Code Examples — Design

## Intent

Extend Angular Interview Prep so an experienced Angular developer can study the same adaptive material in English, Russian, or Spanish for Spain and inspect realistic implementation examples when code materially improves the explanation.

Language changes must not fragment progress, bookmarks, mistakes, workout position, or spaced-repetition history.

## Goals

- Translate the complete product experience into English, Russian, and Spanish: navigation, controls, status text, workout copy, questions, hints, key points, answers, lookup content, mock interview copy, review summaries, and progress views.
- Add an accessible language selector in the global header and persist the selected locale locally.
- Let the user switch language without restarting the current workout or losing revealed sections.
- Add practical code examples to relevant questions using TypeScript, HTML, and SCSS tabs.
- Show only the file tabs that are useful for a given example.
- Preserve the existing adaptive engine and stable question IDs across all locales.
- Publish the verified update to the existing `grachia-m/angular-interview-prep` repository and GitHub Pages site.

## Non-goals

- Translating Angular API names, operators, identifiers, or code syntax.
- Generating translations at runtime or calling a translation service.
- Adding user accounts, cloud synchronization, or server-side storage.
- Forcing a code sample onto conceptual questions where prose is clearer.
- Building an in-browser code editor or executable playground.

## Anti-goals

- Three independent question catalogs that can drift in IDs, difficulty, version coverage, or adaptive behavior.
- Resetting progress when the locale changes.
- Showing empty TypeScript, HTML, or SCSS tabs.
- Translating code identifiers into Russian or Spanish.
- Treating code as decoration rather than demonstrating the question’s practical application.

## Selected approach

Use one stable content model with localized text variants and locale-independent metadata.

Each question keeps one `id`, section, difficulty, Angular version list, and topic key. Localized fields contain the prompt, hint, key points, answer, display topic, and display type. Optional examples use a structured object with one or more of `ts`, `html`, and `scss` plus localized context explaining what the example demonstrates.

This was chosen over separate per-language catalogs because adaptive state is already keyed by question ID. A shared model keeps progress portable between languages and makes missing translations testable.

Runtime machine translation was rejected because interview terminology needs deliberate wording, the site is static and local-first, and offline behavior must remain intact.

## Locale behavior

- Supported content locales are `en`, `ru`, and `es`; Spanish copy follows Spain (`es-ES`) vocabulary and conventions.
- English remains the safe fallback for any missing message.
- On first visit, map browser languages beginning with `ru` to Russian, languages beginning with `es` to Spanish for Spain, and languages beginning with `en` to English; otherwise use English.
- Persist the chosen locale in the existing application state.
- Changing locale updates the current screen immediately without changing question IDs, workout order, mock answers, progress, bookmarks, or reveal state.
- Set the document `lang` attribute to `en`, `ru`, or `es-ES` whenever the locale changes.
- The selector uses compact visible labels `EN`, `RU`, and `ES` with localized accessible names.

## Translation structure

Create a focused locale module for interface messages and localized content access. Rendering functions receive or resolve the active locale rather than embedding English copy directly.

Question and lookup metadata remain stable. Human-readable fields are selected through locale helpers with English fallback. Topic names used by readiness calculations remain stable keys; translated topic labels are presentation-only.

Translation coverage tests must fail when a supported locale is missing a required interface key or required question/lookup field.

Translations are authored as part of this implementation in a natural professional register for experienced frontend developers. Russian should sound native rather than translated literally; Spanish should use common Spain terminology. Angular APIs, RxJS operators, NgRx names, and English code identifiers remain unchanged.

The localization boundary includes every visible in-app string, the browser title, the document language, and the page description. Repository documentation and internal developer comments are outside this release. Code comments remain English; localized context around the sample explains them when needed.

## Code example experience

Relevant question cards expose a localized “Practical example” reveal control. After revealing:

- show a short localized context line explaining the application area;
- show tabs only for files provided by the question (`TypeScript`, `HTML`, `SCSS`);
- default to TypeScript when present, otherwise the first available file;
- keep the selected tab for the current question while it is visible;
- use escaped, selectable code with horizontal scrolling and readable line spacing;
- provide an accessible tablist with keyboard-compatible native buttons and selected-state attributes.

Examples stay in English code syntax and identifiers. Only the surrounding explanation and UI labels are translated. A question may contain one, two, or all three file types.

Initial coverage includes these question IDs:

- existing snippet-based questions: `signal-input-contract`, `control-flow-track`, `share-replay-cache`, and `effect-derived-state`;
- additional application examples: `linked-signal-selection`, `zoneless-notifications`, `resource-read-boundary`, `flattening-operator-decision`, and `take-until-context`.

At least one of these examples must use all three TypeScript, HTML, and SCSS tabs; at least one must be TypeScript-only. Conceptual architecture questions remain prose-only unless code clarifies a specific boundary.

## State and compatibility

Keep the existing local-storage key and normalize older state safely. Add `locale` with browser-aware initialization and `en` fallback. Existing users retain progress and receive a locale without migration prompts.

The current single `code` string is migrated to the new example shape without changing question IDs. Rendering remains tolerant of legacy content during the transition, but the shipped catalog should use the structured examples.

## Visual and responsive design

Preserve the warm notebook-like visual system. Place the language selector near the Angular version controls without crowding mobile navigation.

Code examples use a slightly darker paper/ink surface, restrained syntax colors, file-tab labels, and the same rounded geometry as existing answer panels. On narrow screens, file tabs may scroll horizontally and code must never widen the page.

Russian and Spanish text expansion must not overlap buttons, navigation, cards, or progress labels at phone widths.

## Accessibility

- Update `document.documentElement.lang`.
- Give the language selector an explicit localized label.
- Mark code file controls with tab semantics and `aria-selected`.
- Keep focus visible and ensure locale changes do not unexpectedly move focus.
- Preserve existing skip navigation, heading order, and button semantics.

## Verification

- Automated tests cover locale fallback, browser-locale normalization, persistence compatibility, complete translation coverage, stable question IDs, localized rendering, and code-tab rendering.
- Existing adaptive selection, spaced repetition, bookmark, mock interview, and readiness tests continue to pass.
- Browser QA covers EN, RU, and ES on desktop and mobile; switching mid-workout; a TypeScript-only example; a multi-file TypeScript/HTML/SCSS example; long translated labels; and no console errors.
- Final verification confirms the deployed commit matches `origin/main`, the GitHub Pages workflow succeeds, and the public URL serves the new language selector and code examples.

## Publishing

Commit the implementation in focused changes, push to `grachia-m/angular-interview-prep`, allow the existing GitHub Pages workflow to deploy `dist`, and verify the live site after deployment.
