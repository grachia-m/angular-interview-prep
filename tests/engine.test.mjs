import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  SUPPORTED_TRACKS,
  applyRating,
  buildMockReport,
  calculateReadiness,
  filterByTrack,
  filterLookup,
  getDeck,
  normalizeTrack,
  normalizeState,
  selectCramSession,
  selectMockQuestions,
  selectWorkout,
  toggleBookmark,
} from '../dist/assets/engine.js';
import { questions, lookupEntries, sectionMeta } from '../dist/assets/data.js';
import {
  SUPPORTED_LOCALES,
  UI_MESSAGES,
  documentLanguage,
  getDocumentMetadata,
  getLocalizedContent,
  normalizeLocale,
  resolveInitialLocale,
  t,
} from '../dist/assets/i18n.js';
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
import * as appViews from '../dist/assets/app.js';

const cases = [];
const test = (name, fn) => cases.push({ name, fn });

const contentFixture = [
  { id: 'legacy-a', section: 'warmup', topic: 'DI', versions: [16], difficulty: 2 },
  { id: 'legacy-b', section: 'warmup', topic: 'RxJS', versions: [17], difficulty: 3 },
  { id: 'modern-a', section: 'modern', topic: 'Signals', versions: [18, 19], difficulty: 3 },
  { id: 'modern-b', section: 'modern', topic: 'Zoneless', versions: [20, 21], difficulty: 4 },
  { id: 'modern-c', section: 'modern', topic: 'Resources', versions: [22], difficulty: 4 },
];

test('normalizeState persists only supported locales', () => {
  assert.equal(normalizeState({ locale: 'ru' }).locale, 'ru');
  assert.equal(normalizeState({ locale: 'es' }).locale, 'es');
  assert.equal(normalizeState({ locale: 'fr' }).locale, 'en');
  assert.equal(normalizeState(null).locale, 'en');
  assert.equal(normalizeLocale('ES-es'), 'es');
});

test('normalizeState migrates trackMode without changing progress', () => {
  const progress = { 'signal-input-contract': { mastery: 72, attempts: 3 } };
  const migrated = normalizeState({ locale: 'ru', progress });
  assert.equal(migrated.trackMode, 'angular');
  assert.deepEqual(migrated.progress, progress);
  assert.equal(normalizeState({ trackMode: 'javascript', progress }).trackMode, 'javascript');
  assert.equal(normalizeState({ trackMode: 'unknown', progress }).trackMode, 'angular');
});

test('every question has a supported stable track', () => {
  assert.deepEqual(SUPPORTED_TRACKS, ['angular', 'javascript', 'html', 'css', 'mixed']);
  assert.ok(questions.every(({ track }) => SUPPORTED_TRACKS.includes(track)));
  assert.ok(questions.every(({ track }) => track !== 'mixed'));
});

test('track filtering keeps Angular and mixed compatibility', () => {
  assert.equal(normalizeTrack('JAVASCRIPT'), 'javascript');
  assert.equal(normalizeTrack('other'), 'angular');
  assert.deepEqual(filterByTrack(questions, 'angular').map(({ id }) => id), questions.map(({ id }) => id));
  assert.deepEqual(filterByTrack(questions, 'mixed').map(({ id }) => id), questions.map(({ id }) => id));
  assert.deepEqual(filterByTrack(questions, 'javascript'), []);
});

test('resolveInitialLocale maps browser languages and falls back to English', () => {
  assert.equal(resolveInitialLocale('ru', ['es-ES']), 'ru');
  assert.equal(resolveInitialLocale(undefined, ['fr-FR', 'es-ES']), 'es');
  assert.equal(resolveInitialLocale(undefined, ['ru-RU']), 'ru');
  assert.equal(resolveInitialLocale(undefined, ['en-GB']), 'en');
  assert.equal(resolveInitialLocale(undefined, ['fr-FR']), 'en');
});

test('documentLanguage expands Spanish to es-ES', () => {
  assert.equal(documentLanguage('es'), 'es-ES');
  assert.equal(documentLanguage('ru'), 'ru');
  assert.equal(documentLanguage('unknown'), 'en');
});

test('translator interpolates variables and falls back to English', () => {
  assert.equal(t('ru', 'workout.questionOf', { current: 2, total: 11 }), 'вопрос 2 из 11');
  assert.equal(t('fr', 'nav.today'), 'Today');
  assert.equal(t('ru', 'test.englishFallback'), 'English fallback');
  assert.deepEqual(getDocumentMetadata('es'), {
    title: 'Preparación para entrevistas de Angular',
    description: 'Entrenamiento adaptativo para entrevistas de Angular 16–22.',
  });
});

test('all supported locales contain every interface message key', () => {
  const englishKeys = Object.keys(UI_MESSAGES.en).sort();
  assert.deepEqual(SUPPORTED_LOCALES, ['en', 'ru', 'es']);
  assert.ok(englishKeys.length > 80, 'the interface dictionary should cover every view, not only the selector');
  for (const locale of SUPPORTED_LOCALES) {
    assert.deepEqual(Object.keys(UI_MESSAGES[locale]).sort(), englishKeys, `incomplete ${locale} interface dictionary`);
    assert.ok(englishKeys.every((key) => String(UI_MESSAGES[locale][key]).trim()), `empty ${locale} message`);
  }
});

test('question ids remain stable across the catalog migration', () => {
  assert.deepEqual(questions.map(({ id }) => id).sort(), [
    'control-flow-track', 'destroy-ref-lifecycle', 'effect-derived-state', 'flattening-operator-decision',
    'hydration-rollout', 'incremental-hydration-boundary', 'linked-signal-selection', 'ngrx-store-or-not',
    'onpush-real-boundary', 'provider-scope-route-tree', 'resource-read-boundary', 'share-replay-cache',
    'signal-input-contract', 'signal-observable-boundary', 'signals-migration-150-screens',
    'take-until-context', 'zoneless-notifications',
  ]);
});

test('every question lookup and section has complete en ru es content', () => {
  const questionFields = ['type', 'topic', 'prompt', 'hint', 'keyPoints', 'answer'];
  for (const question of questions) {
    assert.ok(question.topicKey, `${question.id} needs a stable topicKey`);
    for (const locale of SUPPORTED_LOCALES) {
      const content = question.content?.[locale];
      assert.ok(content, `${question.id} missing ${locale}`);
      for (const field of questionFields) assert.ok(content[field]?.length, `${question.id}.${locale}.${field} is empty`);
    }
  }
  for (const entry of lookupEntries) {
    for (const locale of SUPPORTED_LOCALES) {
      for (const field of ['title', 'useWhen', 'typical', 'trap']) {
        assert.ok(entry.content?.[locale]?.[field]?.length, `${entry.id}.${locale}.${field} is empty`);
      }
    }
  }
  for (const [section, meta] of Object.entries(sectionMeta)) {
    for (const locale of SUPPORTED_LOCALES) {
      assert.ok(meta.content?.[locale]?.label, `${section}.${locale}.label is empty`);
      assert.ok(meta.content?.[locale]?.description, `${section}.${locale}.description is empty`);
    }
  }
});

test('adaptive calculations use topicKey instead of translated labels', () => {
  const localizedFixture = [
    { id: 'a', topicKey: 'signals', topic: 'Signals', versions: [22], content: { ru: { topic: 'Сигналы' } } },
    { id: 'b', topicKey: 'signals', topic: 'Other label', versions: [22], content: { es: { topic: 'Señales' } } },
  ];
  const result = calculateReadiness(localizedFixture, normalizeState({ progress: { a: { mastery: 20 }, b: { mastery: 80 } } }));
  assert.deepEqual(result.topics, [{ topicKey: 'signals', score: 50 }]);
});

test('lookup searches the active locale and stable aliases', () => {
  assert.ok(filterLookup(lookupEntries, 'entrada de señal', 'es').some(({ id }) => id === 'signal-inputs'));
  assert.ok(filterLookup(lookupEntries, 'отписка', 'ru').some(({ id }) => id === 'take-until-destroyed'));
  assert.ok(filterLookup(lookupEntries, 'DestroyRef', 'es').some(({ id }) => id === 'take-until-destroyed'));
});

test('mock report exposes a locale-neutral risk', () => {
  const items = [questions[0], questions[5]];
  const report = buildMockReport(items, { [items[0].id]: 'strong', [items[1].id]: 'pass' }, normalizeState({}));
  assert.deepEqual(report.risk, { topicKey: items[1].topicKey, itemId: items[1].id });
});

test('required questions expose valid structured examples', () => {
  const expected = [
    'signal-input-contract', 'control-flow-track', 'share-replay-cache', 'effect-derived-state',
    'linked-signal-selection', 'zoneless-notifications', 'resource-read-boundary',
    'flattening-operator-decision', 'take-until-context',
  ].sort();
  const withExamples = questions.filter(({ example }) => example).map(({ id }) => id).sort();
  assert.deepEqual(withExamples, expected);
  for (const question of questions.filter(({ example }) => example)) {
    assert.ok(SUPPORTED_LOCALES.every((locale) => question.example.context[locale]?.trim()), `${question.id} needs localized context`);
    const files = Object.entries(question.example.files);
    assert.ok(files.length > 0);
    assert.ok(files.every(([type, source]) => ['ts', 'html', 'scss'].includes(type) && source.trim()));
  }
  assert.ok(questions.some(({ example }) => ['ts', 'html', 'scss'].every((file) => example?.files[file])));
  assert.ok(questions.some(({ example }) => Object.keys(example?.files || {}).join(',') === 'ts'));
  assert.equal(getLocalizedContent(questions[0], 'xx').prompt, questions[0].content.en.prompt);
});

test('today and workout views render Russian content', () => {
  const state = normalizeState({ locale: 'ru' });
  const today = renderTodayView({ state, questions, locale: 'ru', now: new Date('2026-10-23T09:00:00.000Z') });
  assert.match(today, /Готовы к сегодняшней тренировке/);
  assert.match(today, /Современный Angular/);
  const item = questions.find(({ id }) => id === 'signal-input-contract');
  const workout = renderWorkoutView({ items: [item], index: 0, state, locale: 'ru', reveal: { hint: true } });
  assert.match(workout, /Вы заменяете @Input/);
  assert.match(workout, /Полезная подсказка/);
  assert.match(workout, /Не уверен/);
});

test('mock progress lookup and decks render Spain Spanish content', () => {
  const state = normalizeState({ locale: 'es', bookmarks: [questions[0].id] });
  assert.match(renderMockSetup({ locale: 'es' }), /Entrevista simulada/);
  assert.match(renderProgressView({ state, questions, locale: 'es' }), /Mayor carencia para la entrevista/);
  assert.match(renderDeckView({ deck: 'saved', items: [questions[0]], state, locale: 'es' }), /Guardadas/);
  assert.equal(typeof appViews.renderLookupResults, 'function');
  assert.match(appViews.renderLookupResults('entrada de señal', 'es'), /Úsalo cuando/);
});

test('localized renderers fall back to English', () => {
  const html = renderTodayView({ state: normalizeState({ locale: 'en' }), questions, locale: 'fr' });
  assert.match(html, /Ready for today’s workout/);
  assert.doesNotMatch(html, /Готовы|¿Listo/);
});

test('rendered topic labels do not expose topic keys', () => {
  const state = normalizeState({ locale: 'ru' });
  const html = renderProgressView({ state, questions, locale: 'ru' });
  assert.match(html, /Внедрение зависимостей/);
  assert.doesNotMatch(html, />dependency-injection</);
  assert.match(html, /data-topic-key="[a-z-]+"/);
});

test('index exposes localization hooks for every static visible control', () => {
  const markup = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(markup, /id="locale-select"/);
  assert.match(markup, /data-i18n="nav\.today"/);
  assert.match(markup, /data-i18n="controls\.mixed"/);
  assert.match(markup, /data-i18n="controls\.modernFocus"/);
  assert.match(markup, /data-i18n-aria="controls\.locale"/);
  assert.match(markup, /data-i18n-placeholder="lookup\.placeholder"/);
});

test('code example defaults to TypeScript and shows only supplied files', () => {
  const multi = questions.find(({ id }) => id === 'signal-input-contract');
  const multiHtml = appViews.renderCodeExample({ item: multi, locale: 'en' });
  assert.match(multiHtml, /data-file="ts"[^>]*aria-selected="true"/);
  assert.match(multiHtml, /data-file="html"/);
  assert.match(multiHtml, /data-file="scss"/);
  const onlyTs = questions.find(({ id }) => id === 'share-replay-cache');
  const onlyTsHtml = appViews.renderCodeExample({ item: onlyTs, locale: 'ru' });
  assert.match(onlyTsHtml, /data-file="ts"/);
  assert.doesNotMatch(onlyTsHtml, /data-file="html"|data-file="scss"/);
});

test('code example uses first available file when TypeScript is absent', () => {
  const htmlOnly = questions.find(({ id }) => id === 'control-flow-track');
  assert.equal(appViews.chooseExampleFile(htmlOnly.example.files), 'html');
  assert.equal(appViews.chooseExampleFile(htmlOnly.example.files, 'scss'), 'html');
  assert.match(appViews.renderCodeExample({ item: htmlOnly, locale: 'es' }), /data-file="html"[^>]*aria-selected="true"/);
});

test('code tabs expose tab semantics and selected state', () => {
  const item = questions.find(({ id }) => id === 'signal-input-contract');
  const html = appViews.renderCodeExample({ item, locale: 'es', activeFile: 'scss' });
  assert.match(html, /role="tablist"/);
  assert.match(html, /role="tab"[^>]*data-file="scss"[^>]*aria-selected="true"/);
  assert.match(html, /role="tabpanel"/);
  assert.match(html, /aria-labelledby="example-signal-input-contract-tab-scss"/);
});

test('code rendering escapes source markup', () => {
  const item = questions.find(({ id }) => id === 'control-flow-track');
  const html = appViews.renderCodeExample({ item, locale: 'en' });
  assert.match(html, /&lt;user-row/);
  assert.doesNotMatch(html, /<user-row/);
});

test('locale change preserves normalized progress identity', () => {
  const progress = { 'signal-input-contract': { mastery: 72, confidence: 'knew', attempts: 2 } };
  const before = normalizeState({ locale: 'en', bookmarks: ['signal-input-contract'], progress });
  const after = normalizeState({ ...before, locale: 'es' });
  assert.deepEqual(after.progress, before.progress);
  assert.deepEqual(after.bookmarks, before.bookmarks);
  assert.equal(after.locale, 'es');
});

test('workout reveal state is keyed independently from locale', () => {
  const item = questions.find(({ id }) => id === 'signal-input-contract');
  const reveal = { hint: true, answer: true, example: true };
  const exampleFiles = { [item.id]: 'html' };
  const russian = renderWorkoutView({ items: [item], index: 0, state: normalizeState({ locale: 'ru' }), locale: 'ru', reveal, exampleFiles });
  const spanish = renderWorkoutView({ items: [item], index: 0, state: normalizeState({ locale: 'es' }), locale: 'es', reveal, exampleFiles });
  assert.match(russian, /data-file="html"[^>]*aria-selected="true"/);
  assert.match(spanish, /data-file="html"[^>]*aria-selected="true"/);
  assert.match(russian, /Полезная подсказка/);
  assert.match(spanish, /Una pista útil/);
});

test('saved navigation always resolves to the bookmarks deck', () => {
  assert.equal(appViews.resolveNavigationDeck('saved', 'modern'), 'saved');
  assert.equal(appViews.resolveNavigationDeck('practice', 'mistakes'), 'mistakes');
});

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
  assert.equal(result.weakest.topicKey, 'Zoneless');
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
  const item = questions.find((question) => question.id === 'signal-input-contract');
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
  assert.deepEqual(report.risk, { topicKey: items[2].topicKey, itemId: items[2].id });
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

test('progress view uses singular copy after the first rated question', () => {
  const state = normalizeState({ progress: { [questions[0].id]: { mastery: 60, confidence: 'knew' } } });
  const html = renderProgressView({ state, questions, now: new Date('2026-10-23T09:00:00.000Z') });
  assert.match(html, /1 question has a real rating\./);
});

test('modern focus keeps an accessible name when its visible mobile label is hidden', () => {
  const markup = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  assert.match(markup, /id="modern-focus"[^>]*aria-label="Modern focus"/);
});

test('mobile header stacks the page title above its controls', () => {
  const styles = readFileSync(new URL('../dist/assets/styles.css', import.meta.url), 'utf8');
  const mobileRules = styles.slice(styles.indexOf('@media (max-width: 560px)'));
  assert.match(mobileRules, /\.topbar\s*\{[^}]*flex-direction:\s*column;/);
  assert.match(mobileRules, /\.lookup-trigger\s*>\s*span:not\(\[aria-hidden\]\)\s*\{[^}]*display:\s*none;/);
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
