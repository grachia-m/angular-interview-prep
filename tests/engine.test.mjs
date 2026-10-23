import assert from 'node:assert/strict';

import {
  applyRating,
  buildMockReport,
  calculateReadiness,
  filterLookup,
  getDeck,
  normalizeState,
  selectCramSession,
  selectMockQuestions,
  selectWorkout,
  toggleBookmark,
} from '../dist/assets/engine.js';
import { questions, lookupEntries } from '../dist/assets/data.js';
import {
  renderDeckView,
  renderMockQuestion,
  renderMockReport,
  renderMockSetup,
  renderProgressView,
  renderReviewView,
  renderTodayView,
  renderWorkoutView,
} from '../dist/assets/app.js';

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

const contentFixture = [
  { id: 'legacy-a', section: 'warmup', topic: 'DI', versions: [16], difficulty: 2 },
  { id: 'legacy-b', section: 'warmup', topic: 'RxJS', versions: [17], difficulty: 3 },
  { id: 'modern-a', section: 'modern', topic: 'Signals', versions: [18, 19], difficulty: 3 },
  { id: 'modern-b', section: 'modern', topic: 'Zoneless', versions: [20, 21], difficulty: 4 },
  { id: 'modern-c', section: 'modern', topic: 'Resources', versions: [22], difficulty: 4 },
];

test('Modern Focus ranks Angular 18–22 content ahead of legacy content', () => {
  const state = normalizeState({});
  const selected = selectWorkout(contentFixture, state, 'modern', { total: 5, now: '2026-10-23T09:00:00.000Z' });
  assert.ok(selected.slice(0, 3).every((item) => item.versions.some((version) => version >= 18)));
  assert.ok(selected.slice(3).every((item) => item.versions.every((version) => version < 18)));
});

test('a version with no exact matches falls back to relevant mixed content', () => {
  const selected = selectWorkout(contentFixture, normalizeState({}), '19', { total: 4 });
  assert.equal(selected.length, 4);
  assert.ok(selected.some((item) => item.versions.includes(19)));
});

test('Missed lowers mastery and schedules a near review while Easy raises mastery', () => {
  const item = contentFixture[2];
  const base = normalizeState({});
  const missed = applyRating(base, item, 'missed', new Date('2026-10-23T09:00:00.000Z'));
  assert.equal(missed.progress[item.id].mastery, 34);
  assert.equal(missed.progress[item.id].mistakes, 1);
  assert.equal(missed.progress[item.id].dueAt, '2026-10-24T09:00:00.000Z');

  const easy = applyRating(base, item, 'easy', new Date('2026-10-23T09:00:00.000Z'));
  assert.equal(easy.progress[item.id].mastery, 64);
  assert.equal(easy.progress[item.id].mistakes, 0);
  assert.equal(easy.progress[item.id].dueAt, '2026-11-06T09:00:00.000Z');
});

test('normalizeState safely repairs corrupt shapes and preserves valid preferences', () => {
  const normalized = normalizeState({
    versionMode: '22',
    modernFocus: true,
    bookmarks: 'not-an-array',
    progress: null,
  });
  assert.equal(normalized.versionMode, '22');
  assert.equal(normalized.modernFocus, true);
  assert.deepEqual(normalized.bookmarks, []);
  assert.deepEqual(normalized.progress, {});
});

test('readiness stays between 0 and 100 and reports the weakest topic', () => {
  const state = normalizeState({
    progress: {
      'modern-a': { mastery: 92 },
      'modern-b': { mastery: -30 },
      'modern-c': { mastery: 130 },
    },
  });
  const result = calculateReadiness(contentFixture, state);
  assert.ok(result.overall >= 0 && result.overall <= 100);
  assert.equal(result.weakest.topic, 'Zoneless');
  assert.equal(result.weakest.score, 0);
});

test('the seeded library covers every workout section and modern Angular versions', () => {
  const sections = new Set(questions.map((item) => item.section));
  assert.deepEqual([...sections].sort(), ['code', 'modern', 'rxjs', 'scenario', 'warmup']);
  for (const version of [18, 19, 20, 21, 22]) {
    assert.ok(questions.some((item) => item.versions.includes(version)), `missing Angular ${version}`);
  }
});

test('lookup filtering matches title, aliases, and content without case sensitivity', () => {
  assert.ok(filterLookup(lookupEntries, 'SIGNAL INPUT').some((entry) => entry.id === 'signal-inputs'));
  assert.ok(filterLookup(lookupEntries, 'unsubscribe').some((entry) => entry.id === 'take-until-destroyed'));
});

test('today view presents the workout structure and actionable readiness context', () => {
  const state = normalizeState({});
  const html = renderTodayView({ state, questions, now: new Date('2026-10-23T09:00:00.000Z') });
  assert.match(html, /Ready for today’s workout\?/);
  assert.match(html, /Warm-up/);
  assert.match(html, /Modern Angular/);
  assert.match(html, /Code Challenge/);
  assert.match(html, /RxJS \/ NgRx/);
  assert.match(html, /Senior Scenario/);
  assert.match(html, /data-action="start-workout"/);
  assert.match(html, /biggest interview gap/i);
});

test('an overdue missed question outranks an untouched peer in adaptive selection', () => {
  const state = normalizeState({
    progress: {
      'modern-a': { mastery: 80 },
      'modern-b': { mastery: 72, mistakes: 2, dueAt: '2026-10-20T09:00:00.000Z' },
    },
  });
  const selected = selectWorkout(contentFixture, state, 'modern', { total: 2, now: '2026-10-23T09:00:00.000Z' });
  assert.equal(selected[0].id, 'modern-b');
});

test('bookmark toggling is idempotent and the saved deck follows it', () => {
  const saved = toggleBookmark(normalizeState({}), 'modern-a');
  assert.deepEqual(saved.bookmarks, ['modern-a']);
  assert.deepEqual(getDeck(contentFixture, saved, 'saved').map((item) => item.id), ['modern-a']);
  const removed = toggleBookmark(saved, 'modern-a');
  assert.deepEqual(removed.bookmarks, []);
});

test('mistakes, modern, hard, and due decks filter by their actual study signal', () => {
  const state = normalizeState({
    progress: {
      'legacy-a': { mistakes: 1, dueAt: '2026-10-22T09:00:00.000Z' },
      'modern-b': { mistakes: 2, dueAt: '2026-11-01T09:00:00.000Z' },
    },
  });
  assert.deepEqual(getDeck(contentFixture, state, 'mistakes').map((item) => item.id), ['modern-b', 'legacy-a']);
  assert.ok(getDeck(contentFixture, state, 'modern').every((item) => item.versions.some((version) => version >= 18)));
  assert.ok(getDeck(contentFixture, state, 'hard').every((item) => item.difficulty >= 4));
  assert.deepEqual(getDeck(contentFixture, state, 'due', new Date('2026-10-23T09:00:00.000Z')).map((item) => item.id), ['legacy-a']);
});

test('cram session prioritizes recent mistakes while retaining varied interview coverage', () => {
  const state = normalizeState({ progress: { 'share-replay-cache': { mastery: 25, mistakes: 3 } } });
  const cram = selectCramSession(questions, state, { total: 8, now: '2026-10-23T09:00:00.000Z' });
  assert.equal(cram.length, 8);
  assert.equal(cram[0].id, 'share-replay-cache');
  assert.ok(cram.some((item) => item.section === 'modern'));
  assert.ok(cram.some((item) => item.section === 'rxjs'));
  assert.ok(cram.some((item) => item.section === 'scenario'));
});

test('workout view exposes progressive reveals, save control, and all confidence ratings', () => {
  const item = questions.find((question) => question.code);
  const html = renderWorkoutView({
    items: [item],
    index: 0,
    state: normalizeState({}),
    reveal: { hint: true, points: false, answer: false, code: false },
    sessionKind: 'daily',
  });
  assert.match(html, new RegExp(item.hint.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /Show key points/);
  assert.match(html, /Show full answer/);
  for (const label of ['Easy', 'Knew it', 'Unsure', 'Missed']) assert.match(html, new RegExp(label));
  assert.match(html, /data-action="toggle-save"/);
});

test('review view separates confident work from repetition needs', () => {
  const items = [questions[0], questions[3]];
  const state = normalizeState({
    progress: {
      [items[0].id]: { confidence: 'easy', mastery: 70 },
      [items[1].id]: { confidence: 'missed', mastery: 34, mistakes: 1 },
    },
  });
  const html = renderReviewView({ items, state });
  assert.match(html, /Strong today/);
  assert.match(html, /Needs repetition/);
  assert.match(html, /Practice my weak areas/);
});

test('deck view renders empty guidance and saved question cards', () => {
  assert.match(renderDeckView({ deck: 'saved', items: [], state: normalizeState({}) }), /Nothing saved yet/);
  const html = renderDeckView({ deck: 'saved', items: [questions[0]], state: normalizeState({ bookmarks: [questions[0].id] }) });
  assert.match(html, new RegExp(questions[0].prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(html, /Remove/);
});

test('mock question selection is varied and senior mode is not easier than middle mode', () => {
  const middle = selectMockQuestions(questions, 'middle', 6);
  const senior = selectMockQuestions(questions, 'senior', 6);
  assert.equal(middle.length, 6);
  assert.equal(senior.length, 6);
  assert.ok(new Set(senior.map((item) => item.section)).size >= 3);
  const average = (items) => items.reduce((sum, item) => sum + item.difficulty, 0) / items.length;
  assert.ok(average(senior) >= average(middle));
});

test('mock report groups strong and weak answers and names the clearest interview risk', () => {
  const items = [questions[0], questions[3], questions[5]];
  const report = buildMockReport(items, { [items[0].id]: 'strong', [items[1].id]: 'partial', [items[2].id]: 'pass' }, normalizeState({}));
  assert.deepEqual(report.strong.map((entry) => entry.id), [items[0].id]);
  assert.deepEqual(report.needsWork.map((entry) => entry.id), [items[1].id, items[2].id]);
  assert.match(report.risk, new RegExp(items[2].topic, 'i'));
  assert.ok(report.score >= 0 && report.score <= 100);
});

test('mock interview views defer answers and produce an interview-style report', () => {
  const item = questions[5];
  assert.match(renderMockSetup(), /30 min mock interview/);
  const questionHtml = renderMockQuestion({ items: [item], index: 0, level: 'senior', answers: {} });
  assert.match(questionHtml, /textarea/);
  assert.doesNotMatch(questionHtml, new RegExp(item.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  const report = buildMockReport([item], { [item.id]: 'partial' }, normalizeState({}));
  assert.match(renderMockReport(report), /Interview risk/);
});

test('progress view names the biggest gap and remains useful with default state', () => {
  const html = renderProgressView({ state: normalizeState({}), questions, now: new Date('2026-10-23T09:00:00.000Z') });
  assert.match(html, /Biggest interview gap/);
  assert.match(html, /Modern Angular readiness/);
  assert.match(html, /review today/i);
  assert.match(html, /Dependency injection/);
});

let failures = 0;
for (const testCase of cases) {
  try {
    await testCase.fn();
    console.log(`✓ ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${testCase.name}`);
    console.error(error);
  }
}

if (failures) {
  process.exitCode = 1;
} else {
  console.log(`\n${cases.length} tests passed`);
}
