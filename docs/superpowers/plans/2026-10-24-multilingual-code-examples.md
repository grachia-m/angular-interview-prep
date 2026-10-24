# Multilingual Study Content and Code Examples Implementation Plan

> For agentic workers: REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task by task and `superpowers:test-driven-development` for every behavior change.

**Goal:** Add complete English, Russian, and Spain-Spanish localization plus practical TypeScript/HTML/SCSS examples without breaking adaptive progress, then publish the verified update to the existing GitHub Pages site.

**Architecture:** Keep one locale-independent question catalog keyed by stable IDs and topic keys. Store translated display copy beside each record, select copy through a small `i18n.js` boundary with English fallback, and keep all adaptive calculations language-neutral. Add structured examples to selected records and render them through a pure, accessible tabbed-example renderer; browser event handlers only coordinate state, focus, and persistence.

**Tech Stack:** Static HTML/CSS, native browser ES modules, Node.js built-in test runner style used by `tests/engine.test.mjs`, localStorage, GitHub Actions and GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-10-24-multilingual-code-examples-design.md`

**Global Constraints:** Do not delete, move, or rename any file or directory. Keep the existing `angle-interview-state-v1` storage key and every existing question ID. Use only official Angular, RxJS, and NgRx documentation when validating technical examples. Do not translate API names, operators, identifiers, or code comments. Preserve the current buildless `dist/` deployment model and warm notebook visual language.

**Review Focus:** Translation completeness and natural terminology; state continuity when changing locale mid-session; English fallback behavior; locale-independent readiness and mock logic; escaped code output; accessible file tabs; Russian and Spanish layout at narrow widths; existing adaptive/spaced-repetition regressions.

## File map

- Create `dist/assets/i18n.js`: supported locales, UI message dictionaries, browser-locale resolution, message interpolation, document metadata, and localized-record accessors.
- Modify `dist/assets/data.js`: stable metadata, localized question/lookup/section copy, and structured code examples.
- Modify `dist/assets/engine.js`: persist normalized locale, use stable topic keys, localize lookup matching without putting display copy into adaptive calculations, and return structured mock risk data.
- Modify `dist/assets/app.js`: localized pure renderers, localized global chrome, language switching, example reveal/tab state, and locale-safe topic actions.
- Modify `dist/index.html`: locale selector plus localization markers for static navigation, controls, dialog, metadata, and accessibility labels.
- Modify `dist/assets/styles.css`: compact locale control and responsive accessible code-example panel.
- Modify `tests/engine.test.mjs`: locale, catalog-coverage, renderer, state-continuity, and code-tab tests while preserving all current engine regression tests.
- Modify `README.md`: advertise the three languages and practical code examples.

## Task 1: Establish the locale and persistence boundary

**Files:**

- Create: `dist/assets/i18n.js`
- Modify: `dist/assets/engine.js:1-22`
- Test: `tests/engine.test.mjs`

**Interfaces:**

```js
export const SUPPORTED_LOCALES = ['en', 'ru', 'es'];
export function normalizeLocale(value) // => 'en' | 'ru' | 'es'
export function resolveInitialLocale(savedLocale, browserLanguages = [])
export function documentLanguage(locale) // => 'en' | 'ru' | 'es-ES'
export function t(locale, key, variables = {})
export function getDocumentMetadata(locale) // => { title, description }
export function getLocalizedContent(record, locale)
```

- `normalizeState(input)` gains a normalized `locale` field and otherwise keeps its current return contract.
- `resolveInitialLocale` prefers a valid saved locale; otherwise it checks browser languages in order (`ru*`, `es*`, `en*`) and falls back to `en`.
- `t` uses English for an unknown locale or a missing localized key, interpolates only named `{variable}` tokens, and never evaluates HTML.

### Steps

- [ ] Add failing tests named `normalizeState persists only supported locales`, `resolveInitialLocale maps browser languages and falls back to English`, `documentLanguage expands Spanish to es-ES`, `translator interpolates variables and falls back to English`, and `all supported locales contain every interface message key`.
- [ ] Run `npm test` and confirm the new imports/expectations fail because `i18n.js` and `state.locale` do not exist.
- [ ] Implement the smallest locale helpers and initial complete UI-message dictionaries required by the tests. Include keys for global navigation, version controls, every view, pluralized/conditional text variants, lookup, toasts, mock interview, ratings, code examples, page title, and meta description.
- [ ] Extend `normalizeState` to keep `en`, `ru`, or `es` and default invalid/missing values to `en`. Do not change the storage key or discard older progress fields.
- [ ] Run `npm test`; confirm the new locale tests and all existing state/engine tests pass.
- [ ] Commit with `git add dist/assets/i18n.js dist/assets/engine.js tests/engine.test.mjs && git commit -m "feat: add locale and translation foundation"`.

## Task 2: Convert the catalog to stable localized records and add code examples

**Files:**

- Modify: `dist/assets/data.js`
- Modify: `dist/assets/engine.js:23-240`
- Modify: `dist/assets/i18n.js`
- Test: `tests/engine.test.mjs`

**Interfaces and data contract:**

```js
{
  id,
  section,
  topicKey,
  versions,
  difficulty,
  content: {
    en: { type, topic, prompt, hint, keyPoints, answer },
    ru: { type, topic, prompt, hint, keyPoints, answer },
    es: { type, topic, prompt, hint, keyPoints, answer },
  },
  example: {
    context: { en, ru, es },
    files: { ts?, html?, scss? },
  }?,
}
```

- Lookup entries use stable `id` and `aliases`, with `content[locale] = { title, useWhen, typical, trap }`.
- `sectionMeta[section].content[locale] = { label, description }`.
- `getLocalizedContent(record, locale)` returns the selected localized object merged with stable metadata and English field-level fallback.
- `calculateReadiness` groups by `topicKey` and returns `{ topicKey, score }` entries; display labels are resolved only in the renderer.
- `filterLookup(entries, query, locale = 'en')` searches the active localized fields plus stable aliases and returns the original records.
- `buildMockReport` returns `risk: { topicKey, itemId } | null` instead of a prewritten English sentence.

### Steps

- [ ] Before authoring snippets, verify the exact APIs and version-safe usage against current primary sources: Angular official guides/API for signal inputs, control flow, `linkedSignal`, zoneless change detection, `resource`, and `takeUntilDestroyed`; official RxJS docs for `shareReplay` and flattening operators; official NgRx docs only if an NgRx example is changed. Record source URLs in implementation notes or the commit body, not in user-facing question text.
- [ ] Add failing catalog tests named `question ids remain stable across the catalog migration`, `every question lookup and section has complete en ru es content`, `adaptive calculations use topicKey instead of translated labels`, `lookup searches the active locale and stable aliases`, `mock report exposes a locale-neutral risk`, and `required questions expose valid structured examples`.
- [ ] In the stable-ID test, assert the exact 17-ID set from the current catalog so localization cannot fork or silently replace progress records.
- [ ] In the example test, require examples on exactly the initial coverage IDs from the spec: `signal-input-contract`, `control-flow-track`, `share-replay-cache`, `effect-derived-state`, `linked-signal-selection`, `zoneless-notifications`, `resource-read-boundary`, `flattening-operator-decision`, and `take-until-context`. Assert every example has localized context and non-empty known file keys, at least one has all `ts/html/scss`, and at least one is TypeScript-only.
- [ ] Run `npm test` and confirm the catalog-shape, `topicKey`, lookup-locale, risk-shape, and example tests fail.
- [ ] Convert all 17 questions, 8 lookup cards, and 5 section records to the shared localized structure. Write natural professional Russian and Spain-Spanish copy; preserve Angular/RxJS/NgRx API names and English identifiers. Migrate the four legacy `code` fields into `example.files` and add the five new examples.
- [ ] Make `signal-input-contract` the initial all-three-file example unless official API validation indicates another existing question is clearer. Make `share-replay-cache` or `flattening-operator-decision` TypeScript-only. Supply only files that demonstrate a real application boundary.
- [ ] Update engine logic to use `topicKey`, localized lookup data, and structured risk output. Add English field-level fallback in the content helper so one absent translated field cannot crash a view.
- [ ] Run `npm test`; confirm catalog coverage and all pre-existing selection, spacing, bookmark, readiness, and mock tests pass.
- [ ] Commit with `git add dist/assets/data.js dist/assets/engine.js dist/assets/i18n.js tests/engine.test.mjs && git commit -m "feat: localize study catalog and add code examples"`.

## Task 3: Localize every renderer and the persistent page chrome

**Files:**

- Modify: `dist/assets/app.js:1-352`
- Modify: `dist/index.html`
- Modify: `dist/assets/i18n.js`
- Test: `tests/engine.test.mjs`

**Interfaces:**

```js
export function renderTodayView({ state, questions, now, locale })
export function renderWorkoutView({ items, index, state, reveal, sessionKind, locale, activeExampleFile })
export function renderReviewView({ items, state, locale })
export function renderDeckView({ deck, items, state, locale })
export function renderMockSetup({ locale } = {})
export function renderMockQuestion({ items, index, level, answers, locale })
export function renderMockReport(report, locale)
export function renderProgressView({ state, questions, now, locale })
export function renderLookupResults(query, locale)
export function applyLocaleToDocument(locale, root = document)
```

- Omitted `locale` defaults through the normalized state or to `en`, preserving test and caller compatibility.
- `applyLocaleToDocument` updates `html[lang]`, title, description, all `[data-i18n]` text nodes, and all `[data-i18n-aria]` labels without replacing focused controls.
- Static HTML carries semantic structure and localization markers; visible fallback text remains English for no-script/loading safety.

### Steps

- [ ] Add failing tests named `today and workout views render Russian content`, `mock progress lookup and decks render Spain Spanish content`, `localized renderers fall back to English`, `rendered topic labels do not expose topic keys`, and `index exposes localization hooks for every static visible string`.
- [ ] Add a static-source assertion that `dist/index.html` contains `#locale-select`, `data-i18n`/`data-i18n-aria` hooks for navigation and controls, and no unmarked visible English control label inside the app shell.
- [ ] Run `npm test`; confirm the renderer assertions fail while the engine suite remains green.
- [ ] Refactor renderers to resolve records through `getLocalizedContent` and all interface text through `t`. Replace deck-name and page-title constants with message keys. Localize plural/empty states explicitly rather than concatenating English fragments.
- [ ] Resolve readiness topic labels by finding catalog records with the matching `topicKey`; never place translated labels in `data-topic`. Change focused-practice actions to carry `data-topic-key` so locale switches cannot alter behavior.
- [ ] Add the locale selector (`EN`, `RU`, `ES`) near version controls. Add localization markers for sidebar/topbar navigation, the version selector options including Mixed, Modern Focus, quick lookup dialog, skip link, search labels/placeholders, and toast live region.
- [ ] Implement `applyLocaleToDocument`, including `lang`, localized `<title>`, and localized meta description. Ensure all exported pure renderers remain usable in Node tests without a DOM.
- [ ] Run `npm test`; confirm all localized-view and existing behavioral tests pass.
- [ ] Commit with `git add dist/assets/app.js dist/assets/i18n.js dist/index.html tests/engine.test.mjs && git commit -m "feat: localize the complete interview experience"`.

## Task 4: Add accessible example tabs and live locale switching

**Files:**

- Modify: `dist/assets/app.js:125-185,353-535`
- Modify: `dist/assets/styles.css:280-330,640-760`
- Modify: `dist/index.html`
- Test: `tests/engine.test.mjs`

**Interfaces and interaction state:**

```js
export function renderCodeExample({ item, locale, activeFile })
export function chooseExampleFile(files, requestedFile) // TS when present, otherwise first available
```

- A workout session stores `reveal.example` and `exampleFiles[item.id]`; these are view state only and are not added to long-term progress.
- `data-action="reveal-example"` reveals the current item’s example.
- `data-action="select-example-file" data-file="ts|html|scss"` changes only that question’s selected file.
- Changing `#locale-select` updates `state.locale`, saves it, reapplies page chrome, and rerenders the current view without recreating `session` or `mock`.

### Steps

- [ ] Add failing tests named `code example defaults to TypeScript and shows only supplied files`, `code example uses first available file when TypeScript is absent`, `code tabs expose tab semantics and selected state`, `code rendering escapes source markup`, `locale change preserves normalized progress identity`, and `workout reveal state is keyed independently from locale`.
- [ ] In the renderer tests, use one real all-three-file catalog item and one real TypeScript-only item. Assert no empty HTML/SCSS tabs appear, the selected panel is labelled by its tab, and literal `<` from source is emitted as escaped text.
- [ ] Run `npm test` and confirm the example renderer and interaction-contract tests fail.
- [ ] Implement `chooseExampleFile` and `renderCodeExample`. Use native `<button role="tab">`, a named `<div role="tablist">`, `aria-selected`, stable tab/panel IDs derived from the question ID, and one `<pre><code>` panel. Keep the localized context outside the code block.
- [ ] Replace the legacy reveal-code path with the localized practical-example control and per-question tab selection. Preserve hint/points/answer reveal state when switching files or locales.
- [ ] Wire locale changes to persistence and immediate rerendering. On first load, inspect the raw saved object: preserve a valid saved locale; only when no valid saved locale exists call `resolveInitialLocale(undefined, navigator.languages || [navigator.language])`. Do not restart workout/mock objects and do not move focus.
- [ ] Add styles for `.locale-control`, `.code-example`, `.code-tabs`, selected/focus tab states, localized context, and a dark scrollable `.code-block`. At phone widths, allow tab-row horizontal scrolling and force code/panels to `max-width: 100%; min-width: 0` so Russian/Spanish labels never widen the page.
- [ ] Run `npm test`; confirm all code-tab, locale-state, accessibility-markup, and regression tests pass.
- [ ] Commit with `git add dist/assets/app.js dist/assets/styles.css dist/index.html tests/engine.test.mjs && git commit -m "feat: add practical code tabs and live language switching"`.

## Task 5: Document, verify in browsers, publish, and verify production

**Files:**

- Modify: `README.md`
- Verify: `dist/index.html`, `dist/assets/*.js`, `dist/assets/styles.css`, `.github/workflows/*`

### Steps

- [ ] Update `README.md` with EN/RU/ES (Spain) support, persistent mid-session switching, and practical TS/HTML/SCSS examples. Keep run/deployment instructions accurate for the buildless app.
- [ ] Run `npm test` from the repository root and capture the passing test count/output.
- [ ] Run `git diff --check` and inspect `git status --short`; confirm there are no unintended files and no deletes, moves, or renames.
- [ ] Before browser work, read the Sites local-preview instructions required by the active Sites skill. Start a local static server using the documented preview path and open the site through HTTP, not as a `file:` URL.
- [ ] Desktop QA in EN, RU, and ES: global chrome/title/metadata, Today, Daily Workout, all reveals, one TS-only example, one TS/HTML/SCSS example, Quick Lookup, Saved/Mistakes, Mock setup/session/report, and Progress. Confirm no English UI leakage except API/code names and no console errors.
- [ ] State-continuity QA: begin a workout, reveal hint/answer/example, select a non-default code file, bookmark/rate as appropriate, switch EN → RU → ES, and confirm the same question/order, reveal state, selected file, bookmark/progress, and mock answer remain intact.
- [ ] Mobile QA at a narrow phone viewport in RU and ES: header controls, navigation, long prompts, code tabs, horizontally scrolling code, dialog, progress labels, and focus visibility. Confirm the page itself never scrolls horizontally.
- [ ] Commit documentation or any test-driven QA corrections in focused commits; rerun `npm test` and `git diff --check` after the final correction. Use `git add README.md ... && git commit -m "docs: describe multilingual code practice"` for documentation-only changes.
- [ ] Perform a final fresh review against the design spec and the Review Focus above. Resolve every High/Medium finding with a new failing test before implementation, then rerun the complete suite.
- [ ] Verify `git status --short` is clean and the intended branch is `main`, then push the reviewed commits to `origin/main` for `grachia-m/angular-interview-prep`.
- [ ] Watch the existing GitHub Pages workflow to completion. Verify the deployed commit matches `origin/main`, then load `https://grachia-m.github.io/angular-interview-prep/` and confirm the locale selector, Russian and Spain-Spanish copy, and code examples are served from production without console errors.

## Plan acceptance checklist

- [ ] Every requirement and non-goal in the approved design maps to a task above.
- [ ] Tests are written before behavior changes and each red/green cycle names the expected failure.
- [ ] Stable IDs, storage compatibility, locale-neutral calculations, and fallback behavior are explicit.
- [ ] Renderer signatures and catalog structures are consistent across tasks.
- [ ] The verification phase covers automated, desktop, mobile, state-continuity, accessibility, deployment, and production checks.
- [ ] No step deletes, moves, or renames files.
