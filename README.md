# Angular Interview Prep

A focused daily practice workspace for experienced Angular developers preparing for technical interviews.

The site combines a familiar workout structure with adaptive question selection, heavier weighting for Angular 18–22, confidence-based spaced repetition, bookmarks and mistake review, mock interviews, quick lookup, and readiness tracking.

## Live site

[Open Angular Interview Prep](https://grachia-m.github.io/angular-interview-prep/)

## What is included

- Angular 16–22 version filters, Mixed mode, and Modern Focus
- Daily sections for Warm-up, Modern Angular, Code Challenge, RxJS/NgRx, Senior Scenario, and Review
- Confidence controls that schedule future review
- Saved questions and mistake-focused practice decks
- Middle and senior mock interview modes
- Progress and interview-readiness views
- Local-only progress storage in the browser

## Run locally

The site is a buildless static app. Serve the repository directory with any static web server, then open `dist/index.html` through that server.

Run the content-engine tests with:

```bash
npm test
```

## Deployment

Every push to `main` deploys the `dist` directory to GitHub Pages through the included workflow.
