import { lookupEntries, questions as catalog, sectionMeta } from './data.js';
import { calculateReadiness, filterByTrack, filterLookup, getDeck, getWorkoutBlueprint, normalizeState } from './engine.js';
import { documentLanguage, getDocumentMetadata, getLocalizedContent, normalizeLocale, t } from './i18n.js';

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const activeLocale = (locale, state) => normalizeLocale(locale ?? state?.locale);
const localize = (record, locale) => getLocalizedContent(record, locale);
const countLabel = (locale, count) => t(locale, count === 1 ? 'common.questionCountOne' : 'common.questionCount', { count });

function dueCount(state, now) {
  return Object.values(state.progress || {}).filter((record) => record?.dueAt && new Date(record.dueAt) <= now).length;
}

export function modeLabel(state, locale = state?.locale) {
  if (state?.modernFocus) return t(locale, 'mode.modern');
  return state?.versionMode === 'mixed' ? t(locale, 'mode.mixed') : t(locale, 'mode.angular', { version: state?.versionMode });
}

export function trackLabel(trackMode = 'angular', locale = 'en') {
  return t(locale, `track.${trackMode}`);
}

function versionLabel(item, locale = 'en') {
  if (item.track && item.track !== 'angular') return trackLabel(item.track, locale);
  const min = Math.min(...item.versions);
  const max = Math.max(...item.versions);
  return min === max ? `Angular ${min}` : `Angular ${min}–${max}`;
}

function topicLabel(topicKey, content, locale) {
  const record = content.find((item) => item.topicKey === topicKey);
  return record ? localize(record, locale).topic : topicKey;
}

function renderRevealButton(action, label) {
  return `<button class="reveal-button" type="button" data-action="${action}"><span aria-hidden="true">＋</span>${escapeHtml(label)}</button>`;
}

export function chooseExampleFile(files = {}, requestedFile) {
  const available = ['js', 'ts', 'html', 'scss'].filter((file) => typeof files[file] === 'string' && files[file].trim());
  if (requestedFile && available.includes(requestedFile)) return requestedFile;
  return available.includes('js') ? 'js' : available.includes('ts') ? 'ts' : available[0];
}

export function renderCodeExample({ item, locale = 'en', activeFile } = {}) {
  if (!item?.example?.files) return '';
  const lang = normalizeLocale(locale);
  const files = item.example.files;
  const selected = chooseExampleFile(files, activeFile);
  if (!selected) return '';
  const context = item.example.context?.[lang] || item.example.context?.en || '';
  const tabs = ['js', 'ts', 'html', 'scss'].filter((file) => files[file]?.trim());
  const tabId = `example-${item.id}-tab-${selected}`;
  const panelId = `example-${item.id}-panel`;
  return `<section class="code-example" aria-label="${escapeHtml(t(lang, 'workout.example'))}">
    <p class="code-example-context">${escapeHtml(context)}</p>
    <div class="code-tabs" role="tablist" aria-label="${escapeHtml(t(lang, 'example.tabs'))}">
      ${tabs.map((file) => `<button id="example-${escapeHtml(item.id)}-tab-${file}" role="tab" type="button" data-action="select-example-file" data-file="${file}" aria-controls="${panelId}" aria-selected="${file === selected}" tabindex="${file === selected ? '0' : '-1'}">${escapeHtml(t(lang, `example.${file}`))}</button>`).join('')}
    </div>
    <div id="${panelId}" class="code-panel" role="tabpanel" aria-labelledby="${tabId}" tabindex="0">
      <pre class="code-block"><code>${escapeHtml(files[selected])}</code></pre>
    </div>
  </section>`;
}

export function renderTodayView({ state: rawState, questions: content = catalog, now = new Date(), locale } = {}) {
  const state = normalizeState(rawState);
  const lang = activeLocale(locale, state);
  const scoped = filterByTrack(content, state.trackMode);
  const readiness = calculateReadiness(content, state, state.trackMode);
  const modern = calculateReadiness(content.filter((item) => item.track === 'angular' && item.versions.some((version) => version >= 18)), state);
  const due = getDeck(content, state, 'due', now, state.trackMode).length;
  const weakest = topicLabel(readiness.weakest.topicKey, scoped, lang);
  const activeTrack = trackLabel(state.trackMode, lang);
  const activeMode = state.trackMode === 'angular' ? `${activeTrack} · ${modeLabel(state, lang)}` : activeTrack;
  const blueprint = getWorkoutBlueprint(state.trackMode);
  return `
    <section class="today-grid" aria-labelledby="today-workout-title">
      <article class="hero-card">
        <p class="eyebrow">${escapeHtml(t(lang, 'today.eyebrow', { mode: activeMode }))}</p>
        <h2 id="today-workout-title">${escapeHtml(t(lang, 'today.title'))}</h2>
        <p class="lede">${escapeHtml(t(lang, 'today.lede'))}</p>
        <div class="session-meta">
          <span><strong>${escapeHtml(t(lang, 'today.minutes'))}</strong></span>
          <span><strong>${escapeHtml(countLabel(lang, blueprint.total))}</strong> ${escapeHtml(t(lang, 'today.sections', { count: blueprint.stages.length }))}</span>
          <span><strong>${escapeHtml(due ? t(lang, 'today.dueCount', { count: due }) : t(lang, 'today.fresh'))}</strong></span>
        </div>
        <div class="button-row">
          <button class="primary-button" type="button" data-action="start-workout">${escapeHtml(t(lang, 'today.start'))} <span aria-hidden="true">→</span></button>
          <button class="secondary-button" type="button" data-action="start-cram">${escapeHtml(t(lang, 'today.cram'))}</button>
        </div>
        <div class="workout-outline">
          ${blueprint.stages.map((stage) => {
            const meta = sectionMeta[stage.key] ? localize(sectionMeta[stage.key], lang) : { label: t(lang, `stage.${stage.key}`) };
            return `<div class="outline-step ${stage.key.includes('modern') || stage.key.includes('async') ? 'is-modern' : ''}"><span>${escapeHtml(countLabel(lang, stage.count))}</span><strong>${escapeHtml(meta.label)}</strong></div>`;
          }).join('')}
        </div>
      </article>
      <div class="right-stack">
        <article class="paper-card readiness-card">
          <p class="eyebrow">${escapeHtml(t(lang, 'today.readiness'))}</p>
          <div class="readiness-number">${readiness.overall}<small>%</small></div>
          <h3>${escapeHtml(t(lang, 'progress.title'))}</h3>
          <p>${escapeHtml(t(lang, 'today.readinessBody'))}</p>
          <div class="meter"><span style="width:${readiness.overall}%"></span></div>
        </article>
        <article class="paper-card note-card">
          <p class="eyebrow">${escapeHtml(t(lang, 'today.nudge'))}</p>
          <h3>${escapeHtml(t(lang, 'today.nudge'))}</h3>
          <p>${escapeHtml(t(lang, 'today.nudgeBody'))}</p>
        </article>
      </div>
    </section>
    <section class="snapshot-grid">
      <article class="paper-card snapshot-card">
        <div class="card-kicker"><span>${escapeHtml(t(lang, 'today.continue'))}</span><span class="card-mark">↗</span></div>
        <h3>${escapeHtml(state.trackMode === 'angular' ? t(lang, 'today.continueTitle') : weakest)}</h3>
        <p>${escapeHtml(state.trackMode === 'angular' ? t(lang, 'today.continueBody') : t(lang, 'today.modernBody', { topic: weakest }))}</p>
        <div class="link-line"><button type="button" data-action="practice-topic" data-topic-key="${escapeHtml(readiness.weakest.topicKey)}">${escapeHtml(t(lang, 'today.continue'))}</button><span aria-hidden="true">→</span></div>
      </article>
      <article class="paper-card snapshot-card">
        <div class="card-kicker"><span>${escapeHtml(t(lang, 'today.due'))}</span><span class="card-mark">↻</span></div>
        <p class="stat">${due}</p><h3>${escapeHtml(t(lang, 'deck.due'))}</h3>
        <p>${escapeHtml(t(lang, 'today.dueBody', { count: due }))}</p>
        <div class="link-line"><button type="button" data-action="review-due">${escapeHtml(t(lang, 'progress.review'))}</button><span aria-hidden="true">→</span></div>
      </article>
      <article class="paper-card snapshot-card">
        <div class="card-kicker"><span>${escapeHtml(state.trackMode === 'angular' ? t(lang, 'today.modern') : activeTrack)}</span><span class="card-mark">${state.trackMode === 'angular' ? '18+' : '↑'}</span></div>
        <p class="stat">${state.trackMode === 'angular' ? modern.overall : readiness.overall}%</p><h3>${escapeHtml(state.trackMode === 'angular' ? t(lang, 'today.modernTitle') : activeTrack)}</h3>
        <p>${escapeHtml(t(lang, 'today.modernBody', { topic: weakest }))}</p>
        <div class="link-line"><button type="button" data-action="open-progress">${escapeHtml(t(lang, 'today.breakdown'))}</button><span aria-hidden="true">→</span></div>
      </article>
    </section>`;
}

export function renderWorkoutView({ items = [], index = 0, state: rawState, reveal = {}, sessionKind = 'daily', locale, activeExampleFile, exampleFiles = {}, blueprint } = {}) {
  const state = normalizeState(rawState);
  const lang = activeLocale(locale, state);
  const item = items[index];
  if (!item) return renderReviewView({ items, state, locale: lang });
  const copy = localize(item, lang);
  const activeBlueprint = blueprint || getWorkoutBlueprint(state.trackMode);
  let stageStart = 0;
  const activeStageIndex = Math.max(0, activeBlueprint.stages.findIndex((stage) => {
    const isCurrent = index >= stageStart && index < stageStart + stage.count;
    stageStart += stage.count;
    return isCurrent;
  }));
  const stageMeta = (stage) => sectionMeta[stage.key]
    ? localize(sectionMeta[stage.key], lang)
    : { label: t(lang, `stage.${stage.key}`), description: t(lang, `stage.${stage.key}`) };
  const meta = stageMeta(activeBlueprint.stages[activeStageIndex]);
  const saved = state.bookmarks.includes(item.id);
  const percent = Math.round(((index + 1) / items.length) * 100);
  return `
    <section class="workout-view" aria-labelledby="question-title">
      <header class="workout-header">
        <div><p class="eyebrow">${escapeHtml(t(lang, sessionKind === 'cram' ? 'workout.cram' : 'workout.daily'))} · ${escapeHtml(t(lang, 'workout.questionOf', { current: index + 1, total: items.length }))}</p><h2>${escapeHtml(meta.label)}</h2></div>
        <div class="workout-percent"><strong>${percent}%</strong><span>${escapeHtml(t(lang, 'workout.complete'))}</span></div>
      </header>
      <div class="section-progress">
        ${activeBlueprint.stages.map((stage, stageIndex) => `<div class="section-pill ${stageIndex < activeStageIndex ? 'is-done' : ''} ${stageIndex === activeStageIndex ? 'is-current' : ''}"><span>${stageIndex + 1}</span>${escapeHtml(stageMeta(stage).label)}</div>`).join('')}
      </div>
      <article class="question-card">
        <div class="question-meta">
          <div><span class="type-label">${escapeHtml(copy.type)}</span><span>${escapeHtml(copy.topic)}</span><span>${escapeHtml(versionLabel(item, lang))}</span></div>
          <button class="save-button ${saved ? 'is-saved' : ''}" type="button" data-action="toggle-save" data-id="${escapeHtml(item.id)}" aria-pressed="${saved}">${escapeHtml(t(lang, saved ? 'workout.saved' : 'workout.save'))}</button>
        </div>
        <p class="question-count">${escapeHtml(t(lang, 'workout.question', { number: String(index + 1).padStart(2, '0') }))}</p>
        <h3 id="question-title">${escapeHtml(copy.prompt)}</h3>
        <div class="reveal-stack">
          ${reveal.hint ? `<div class="answer-panel hint-panel"><p class="answer-label">${escapeHtml(t(lang, 'workout.hintLabel'))}</p><p>${escapeHtml(copy.hint)}</p></div>` : renderRevealButton('reveal-hint', t(lang, 'workout.hint'))}
          ${reveal.points ? `<div class="answer-panel"><p class="answer-label">${escapeHtml(t(lang, 'workout.pointsLabel'))}</p><ul>${copy.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul></div>` : renderRevealButton('reveal-points', t(lang, 'workout.points'))}
          ${reveal.answer ? `<div class="answer-panel full-answer"><p class="answer-label">${escapeHtml(t(lang, 'workout.answerLabel'))}</p><p>${escapeHtml(copy.answer)}</p></div>` : renderRevealButton('reveal-answer', t(lang, 'workout.answer'))}
          ${item.example ? (reveal.example ? renderCodeExample({ item, locale: lang, activeFile: exampleFiles[item.id] || activeExampleFile }) : renderRevealButton('reveal-example', t(lang, 'workout.example'))) : ''}
        </div>
        <div class="confidence-panel">
          <div><p class="answer-label">${escapeHtml(t(lang, 'confidence.title'))}</p><p>${escapeHtml(t(lang, 'confidence.body'))}</p></div>
          <div class="confidence-actions">${['easy', 'knew', 'unsure', 'missed'].map((rating) => `<button type="button" data-action="rate" data-rating="${rating}">${escapeHtml(t(lang, `rating.${rating}`))}</button>`).join('')}</div>
        </div>
      </article>
      <footer class="workout-footer"><span>${escapeHtml(meta.description)}</span><button class="text-button" type="button" data-action="exit-workout">${escapeHtml(t(lang, 'workout.exit'))}</button></footer>
    </section>`;
}

export function renderReviewView({ items = [], state: rawState, locale } = {}) {
  const state = normalizeState(rawState);
  const lang = activeLocale(locale, state);
  const strong = items.filter((item) => ['easy', 'knew'].includes(state.progress[item.id]?.confidence));
  const repeat = items.filter((item) => ['unsure', 'missed'].includes(state.progress[item.id]?.confidence));
  const modern = state.trackMode === 'angular' ? repeat.filter((item) => item.versions.some((version) => version >= 18)) : repeat;
  const list = (entries, emptyKey) => entries.length
    ? `<ul>${entries.map((item) => `<li>${escapeHtml(localize(item, lang).topic)}</li>`).join('')}</ul>`
    : `<p>${escapeHtml(t(lang, emptyKey))}</p>`;
  return `<section class="review-view">
    <header class="view-intro"><p class="eyebrow">${escapeHtml(t(lang, 'review.complete'))}</p><h2>${escapeHtml(t(lang, 'review.title'))}</h2><p>${escapeHtml(t(lang, 'review.body'))}</p></header>
    <div class="review-grid">
      <article class="paper-card"><h3>${escapeHtml(t(lang, 'review.strong'))}</h3>${list(strong, 'review.noneStrong')}</article>
      <article class="paper-card"><h3>${escapeHtml(t(lang, 'review.repeat'))}</h3>${list(repeat, 'review.noneRepeat')}</article>
      <article class="paper-card"><h3>${escapeHtml(state.trackMode === 'angular' ? t(lang, 'review.modern') : trackLabel(state.trackMode, lang))}</h3>${list(modern, state.trackMode === 'angular' ? 'review.noneModern' : 'review.noneRepeat')}</article>
    </div>
    <div class="button-row"><button class="primary-button" type="button" data-action="practice-weak">${escapeHtml(t(lang, 'review.practice'))}</button><button class="secondary-button" type="button" data-action="back-today">${escapeHtml(t(lang, 'review.back'))}</button></div>
  </section>`;
}

const deckKey = (deck) => `deck.${['saved', 'mistakes', 'modern', 'hard', 'due'].includes(deck) ? deck : 'saved'}`;

export function renderDeckView({ deck = 'saved', items = [], state: rawState, locale } = {}) {
  const state = normalizeState(rawState);
  const lang = activeLocale(locale, state);
  const name = t(lang, deckKey(deck));
  const decks = ['saved', 'mistakes', 'modern', 'hard', 'due'];
  return `<section class="deck-view">
    <header class="view-intro"><p class="eyebrow">${escapeHtml(t(lang, 'deck.eyebrow'))}</p><h2>${escapeHtml(name)}</h2><p>${escapeHtml(countLabel(lang, items.length))}</p></header>
    <div class="deck-tabs" role="tablist" aria-label="${escapeHtml(t(lang, 'deck.eyebrow'))}">
      ${decks.map((key) => `<button type="button" data-action="open-deck" data-deck="${key}" role="tab" aria-selected="${key === deck}" class="${key === deck ? 'is-active' : ''}">${escapeHtml(t(lang, deckKey(key)))}</button>`).join('')}
    </div>
    ${items.length ? `<div class="deck-grid">${items.map((item) => {
      const copy = localize(item, lang);
      const saved = state.bookmarks.includes(item.id);
      return `<article class="paper-card deck-card"><div class="question-meta"><span class="type-label">${escapeHtml(copy.type)}</span><span>${escapeHtml(copy.topic)}</span></div><h3>${escapeHtml(copy.prompt)}</h3><div class="deck-card-footer"><span>${escapeHtml(versionLabel(item, lang))}</span><button type="button" data-action="toggle-save" data-id="${escapeHtml(item.id)}">${escapeHtml(t(lang, saved ? 'deck.remove' : 'workout.save'))}</button></div></article>`;
    }).join('')}</div><button class="primary-button" type="button" data-action="practice-deck" data-deck="${escapeHtml(deck)}">${escapeHtml(t(lang, 'deck.practice'))}</button>`
      : `<div class="deck-empty"><h3>${escapeHtml(t(lang, deck === 'saved' ? 'deck.emptySaved' : 'deck.empty'))}</h3><p>${escapeHtml(t(lang, 'deck.emptyBody'))}</p><button class="secondary-button" type="button" data-action="start-workout">${escapeHtml(t(lang, 'practice.start'))}</button></div>`}
  </section>`;
}

export function renderPracticeHub(stateInput = {}, locale) {
  const state = normalizeState(stateInput);
  const lang = activeLocale(locale, state);
  const due = getDeck(catalog, state, 'due', new Date(), state.trackMode).length;
  const mistakes = getDeck(catalog, state, 'mistakes', new Date(), state.trackMode).length;
  const finalDeck = state.trackMode === 'angular'
    ? ['practice.modern', 'practice.modernBody', 'open-deck', 'modern', '18+']
    : ['deck.hard', 'practice.hardBody', 'open-deck', 'hard', '↑'];
  const cards = [
    ['practice.cram', 'practice.cramBody', 'start-cram', '', '24h'],
    ['practice.review', 'practice.reviewBody', 'open-deck', 'due', '↻'],
    ['practice.mistakes', 'practice.mistakesBody', 'open-deck', 'mistakes', '!'],
    finalDeck,
  ];
  return `<section class="practice-hub"><header class="view-intro"><h2>${escapeHtml(t(lang, 'practice.title'))}</h2><p>${escapeHtml(t(lang, 'practice.body'))}</p></header>
    <div class="practice-grid"><article class="practice-feature"><h3>${escapeHtml(t(lang, 'practice.daily'))}</h3><p>${escapeHtml(t(lang, 'practice.dailyBody'))}</p><button class="primary-button" type="button" data-action="start-workout">${escapeHtml(t(lang, 'practice.start'))}</button></article>
    ${cards.map(([title, body, action, deck, mark]) => `<article class="paper-card practice-option"><span class="card-mark">${mark}</span><h3>${escapeHtml(t(lang, title))}</h3><p>${escapeHtml(t(lang, body, { count: deck === 'due' ? due : mistakes }))}</p><button class="text-button" type="button" data-action="${action}" ${deck ? `data-deck="${deck}"` : ''}>${escapeHtml(action === 'start-cram' ? t(lang, 'today.cram') : t(lang, 'practice.open'))} →</button></article>`).join('')}</div>
  </section>`;
}

export function renderMockSetup({ locale = 'en', trackMode = 'angular' } = {}) {
  const lang = normalizeLocale(locale);
  const card = (level, mark) => `<article class="level-card ${level === 'senior' ? 'senior-level' : ''}"><div class="level-number">${mark}</div><p class="eyebrow">${escapeHtml(t(lang, `mock.${level}`))}</p><h3>${escapeHtml(t(lang, `mock.${level}Title`))}</h3><p>${escapeHtml(t(lang, `mock.${level}Body`))}</p><button class="${level === 'senior' ? 'primary-button' : 'secondary-button'}" type="button" data-action="start-mock" data-level="${level}">${escapeHtml(t(lang, `mock.start${level[0].toUpperCase()}${level.slice(1)}`))}</button></article>`;
  return `<section class="mock-setup"><header class="view-intro"><p class="eyebrow">${escapeHtml(trackLabel(trackMode, lang))}</p><h2>${escapeHtml(t(lang, 'mock.setup'))}</h2><p>${escapeHtml(t(lang, 'mock.setupBody'))}</p></header><div class="level-grid">${card('middle', 'M')}${card('senior', 'S')}</div></section>`;
}

export function renderMockQuestion({ items = [], index = 0, level = 'middle', answers = {}, locale = 'en' } = {}) {
  const lang = normalizeLocale(locale);
  const item = items[index];
  if (!item) return '';
  const copy = localize(item, lang);
  const progress = Math.round(((index + 1) / items.length) * 100);
  return `<section class="mock-session" aria-labelledby="mock-question-title"><header class="mock-session-head"><div><p class="eyebrow">${escapeHtml(t(lang, 'mock.questionOf', { level: t(lang, `mock.${level}`), current: index + 1, total: items.length }))}</p><h2>${escapeHtml(t(lang, 'mock.inProgress'))}</h2></div><div class="mock-timer"><strong>${escapeHtml(t(lang, 'mock.remaining', { minutes: Math.max(5, 30 - index * 5) }))}</strong></div></header>
    <div class="meter mock-meter"><span style="width:${progress}%"></span></div><article class="mock-question-card"><div class="question-meta"><span class="type-label">${escapeHtml(copy.type)}</span><span>${escapeHtml(copy.topic)}</span></div><p class="question-count">${escapeHtml(t(lang, 'mock.interviewer'))}</p><h3 id="mock-question-title">${escapeHtml(copy.prompt)}</h3><label class="response-field"><span>${escapeHtml(t(lang, 'mock.notes'))}</span><textarea id="mock-answer" rows="7" placeholder="${escapeHtml(t(lang, 'mock.placeholder'))}">${escapeHtml(answers[item.id] || '')}</textarea></label><div class="mock-self-check"><p>${escapeHtml(t(lang, 'mock.selfCheck'))}</p><div>${['strong', 'partial', 'pass'].map((value) => `<button type="button" data-action="mock-assess" data-assessment="${value}">${escapeHtml(t(lang, `mock.${value}`))}</button>`).join('')}</div></div></article><p class="mock-note">${escapeHtml(t(lang, 'mock.hidden'))}</p></section>`;
}

export function renderMockReport(report, locale = 'en') {
  const lang = normalizeLocale(locale);
  const list = (entries, fallback) => entries.length
    ? `<ul class="report-topics">${entries.map((entry) => {
      const copy = localize(entry, lang);
      return `<li><span>${escapeHtml(copy.topic)}</span><small>${escapeHtml(t(lang, `mock.${entry.assessment}`))}</small></li>`;
    }).join('')}</ul>` : `<p class="result-empty">${escapeHtml(t(lang, fallback))}</p>`;
  const riskEntry = report.risk ? report.entries.find((entry) => entry.id === report.risk.itemId) : null;
  const riskTopic = riskEntry ? localize(riskEntry, lang).topic : '';
  return `<section class="mock-report"><header class="report-hero"><div><p class="eyebrow">${escapeHtml(t(lang, 'mock.complete'))}</p><h2>${escapeHtml(t(lang, 'mock.reportTitle'))}</h2></div><div class="report-score"><strong>${report.score}</strong><span>${escapeHtml(t(lang, 'mock.score'))}</span></div></header><div class="report-grid">
    <article class="paper-card"><h3>${escapeHtml(t(lang, 'mock.strongCount', { count: report.strong.length }))}</h3>${list(report.strong, 'mock.noStrong')}</article>
    <article class="paper-card"><p class="eyebrow">${escapeHtml(t(lang, 'mock.needsWork'))}</p><h3>${escapeHtml(t(lang, 'mock.workCount', { count: report.needsWork.length }))}</h3>${list(report.needsWork, 'mock.noWeak')}</article>
    <article class="risk-card"><p class="eyebrow">${escapeHtml(t(lang, 'mock.risk'))}</p><h3>${escapeHtml(riskEntry ? t(lang, 'mock.riskBody', { topic: riskTopic }) : t(lang, 'mock.noRisk'))}</h3><p>${escapeHtml(t(lang, 'mock.riskAdvice'))}</p></article>
    </div><div class="report-actions"><button class="primary-button" type="button" data-action="practice-mock-gaps">${escapeHtml(t(lang, 'mock.practice'))}</button><button class="secondary-button" type="button" data-action="restart-mock">${escapeHtml(t(lang, 'mock.restart'))}</button></div></section>`;
}

export function renderProgressView({ state: rawState, questions: content = catalog, now = new Date(), locale } = {}) {
  const state = normalizeState(rawState);
  const lang = activeLocale(locale, state);
  const scoped = filterByTrack(content, state.trackMode);
  const readiness = calculateReadiness(content, state, state.trackMode);
  const modern = calculateReadiness(content.filter((item) => item.track === 'angular' && item.versions.some((version) => version >= 18)), state);
  const due = getDeck(content, state, 'due', now, state.trackMode).length;
  const scopedIds = new Set(scoped.map(({ id }) => id));
  const practiced = Object.keys(state.progress).filter((id) => scopedIds.has(id)).length;
  const weakest = topicLabel(readiness.weakest.topicKey, scoped, lang);
  const activeTrack = trackLabel(state.trackMode, lang);
  return `<section class="progress-view"><header class="view-intro"><p class="eyebrow">${escapeHtml(activeTrack)}</p><h2>${escapeHtml(t(lang, 'progress.title'))}</h2><p>${escapeHtml(t(lang, 'progress.body'))}</p></header><div class="progress-summary">
    <article class="readiness-panel"><p class="eyebrow">${escapeHtml(t(lang, 'progress.overall'))}</p><strong>${readiness.overall}%</strong><div class="meter"><span style="width:${readiness.overall}%"></span></div><p>${escapeHtml(practiced ? t(lang, practiced === 1 ? 'progress.oneRated' : 'progress.rated', { count: practiced }) : t(lang, 'progress.start'))}</p></article>
    <article class="gap-panel"><p class="eyebrow">${escapeHtml(t(lang, 'progress.gap'))}</p><h3>${escapeHtml(weakest)}</h3><p>${escapeHtml(t(lang, 'progress.gapBody'))}</p><button class="text-button" type="button" data-action="practice-topic" data-topic-key="${escapeHtml(readiness.weakest.topicKey)}">${escapeHtml(t(lang, 'progress.practiceGap'))} →</button></article>
    <article class="review-panel"><p class="eyebrow">${escapeHtml(t(lang, 'progress.review'))}</p><strong>${due}</strong><p>${escapeHtml(t(lang, 'progress.dueBody', { count: due }))}</p><button class="text-button" type="button" data-action="open-deck" data-deck="due">${escapeHtml(t(lang, 'practice.open'))} →</button></article>
    </div><div class="topic-panel"><div class="topic-panel-head"><div><p class="eyebrow">${escapeHtml(t(lang, 'progress.breakdown'))}</p><h3>${escapeHtml(state.trackMode === 'angular' ? t(lang, 'progress.modern', { percent: modern.overall }) : `${activeTrack} · ${readiness.overall}%`)}</h3></div><p>${escapeHtml(t(lang, 'progress.lowFirst'))}</p></div><div class="topic-bars">${readiness.topics.map((topic) => {
      const label = topicLabel(topic.topicKey, scoped, lang);
      return `<div class="topic-row"><div><span>${escapeHtml(label)}</span><strong>${topic.score}%</strong></div><div class="meter" aria-label="${escapeHtml(label)} ${topic.score}%"><span style="width:${topic.score}%"></span></div></div>`;
    }).join('')}</div></div></section>`;
}

export function renderLookupResults(query = '', locale = 'en', trackMode = 'mixed') {
  const lang = normalizeLocale(locale);
  const entries = filterLookup(trackMode === 'mixed' ? lookupEntries : lookupEntries.filter((entry) => entry.track === trackMode), query, lang);
  if (!entries.length) return `<p class="lookup-empty">${escapeHtml(t(lang, 'lookup.empty'))}</p>`;
  return entries.map((entry) => {
    const copy = localize(entry, lang);
    return `<article class="paper-card lookup-result"><p class="eyebrow">${escapeHtml(t(lang, 'lookup.card'))}</p><h3>${escapeHtml(copy.title)}</h3><p><strong>${escapeHtml(t(lang, 'lookup.useWhen'))}</strong><br>${escapeHtml(copy.useWhen)}</p><pre><code>${escapeHtml(copy.typical)}</code></pre><p><strong>${escapeHtml(t(lang, 'lookup.trap'))}</strong><br>${escapeHtml(copy.trap)}</p></article>`;
  }).join('');
}

export function renderPlaceholder(view, locale = 'en') {
  const lang = normalizeLocale(locale);
  const key = ['practice', 'mock', 'saved', 'progress'].includes(view) ? `page.${view}` : 'page.practice';
  return `<section class="empty-view"><h2>${escapeHtml(t(lang, key))}</h2><button class="primary-button" type="button" data-action="start-workout">${escapeHtml(t(lang, 'today.start'))}</button></section>`;
}

export function applyLocaleToDocument(locale, root = document) {
  const lang = normalizeLocale(locale);
  const documentNode = root.nodeType === 9 ? root : root.ownerDocument || root;
  if (documentNode.documentElement) documentNode.documentElement.lang = documentLanguage(lang);
  const metadata = getDocumentMetadata(lang);
  documentNode.title = metadata.title;
  const description = documentNode.querySelector?.('meta[name="description"]');
  if (description) description.setAttribute('content', metadata.description);
  documentNode.querySelectorAll?.('[data-i18n]').forEach((node) => { node.textContent = t(lang, node.dataset.i18n); });
  documentNode.querySelectorAll?.('[data-i18n-aria]').forEach((node) => { node.setAttribute('aria-label', t(lang, node.dataset.i18nAria)); });
  documentNode.querySelectorAll?.('[data-i18n-placeholder]').forEach((node) => { node.setAttribute('placeholder', t(lang, node.dataset.i18nPlaceholder)); });
  return metadata;
}
