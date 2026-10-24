# Frontend Interview Prep

A focused daily practice workspace for experienced frontend developers preparing for middle and senior technical interviews.

The site combines a familiar workout structure with adaptive question selection across Angular, JavaScript, HTML, and CSS. JavaScript receives the strongest non-Angular coverage, including Promises, async/await, the event loop, cancellation, retries, concurrency, and performance.

The complete interface and study catalog are available in English, Russian, and Spanish for Spain. Language can be changed during a workout without losing the current question, revealed material, bookmarks, or progress.

## Live site

[Open Frontend Interview Prep](https://grachia-m.github.io/angular-interview-prep/)

## What is included

- Interview tracks for Angular, JavaScript, HTML, CSS, and a JavaScript-heavy Interview Mix
- Angular 16–22 version filters, Mixed mode, and Modern Focus
- Daily sections for Warm-up, Modern Angular, Code Challenge, RxJS/NgRx, Senior Scenario, and Review
- Track-specific visible workout structures for JavaScript, HTML, and CSS
- Middle/senior JavaScript practice with dedicated Promise and asynchronous-code coverage
- Confidence controls that schedule future review
- Saved questions and mistake-focused practice decks
- Middle and senior mock interview modes
- Progress and interview-readiness views
- English, Russian, and Spain-Spanish content with local language persistence
- Practical examples with JavaScript, TypeScript, HTML, and SCSS tabs when code clarifies the topic
- Local-only progress storage in the browser

## Run locally

The site is a buildless static app. Serve the repository directory with any static web server, then open `dist/index.html` through that server.

Run the content-engine tests with:

```bash
npm test
```

## Deployment

Every push to `main` deploys the `dist` directory to GitHub Pages through the included workflow.
