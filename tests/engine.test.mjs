import assert from 'node:assert/strict';

import {
  applyRating,
  calculateReadiness,
  filterLookup,
  normalizeState,
  selectWorkout,
} from '../dist/assets/engine.js';
import { questions, lookupEntries } from '../dist/assets/data.js';
import { renderTodayView } from '../dist/assets/app.js';

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
