import { lookupEntries, questions } from './data.js';
import { sectionMeta } from './data.js';
import { resolveInitialLocale, t } from './i18n.js';
import {
  applyLocaleToDocument as viewApplyLocaleToDocument,
  modeLabel as viewModeLabel,
  trackLabel as viewTrackLabel,
  renderDeckView as viewRenderDeckView,
  renderLookupResults as viewRenderLookupResults,
  renderMockQuestion as viewRenderMockQuestion,
  renderMockReport as viewRenderMockReport,
  renderMockSetup as viewRenderMockSetup,
  renderPlaceholder as viewRenderPlaceholder,
  renderPracticeHub as viewRenderPracticeHub,
  renderProgressView as viewRenderProgressView,
  renderReviewView as viewRenderReviewView,
  renderTodayView as viewRenderTodayView,
  renderWorkoutView as viewRenderWorkoutView,
} from './views.js';
import {
  applyRating,
  buildSessionBlueprint,
  buildMockReport,
  calculateReadiness,
  filterByTrack,
  filterLookup,
  getDeck,
  normalizeState,
  selectCramSession,
  selectMockQuestions,
  selectTrackWorkout,
  selectWorkout,
  toggleBookmark,
} from './engine.js';

const STORAGE_KEY = 'angle-interview-state-v1';

export function resolveNavigationDeck(nav, currentDeck) {
  return nav === 'saved' ? 'saved' : currentDeck;
}

export function captureMockAnswer(mock, answer) {
  if (!mock?.items?.[mock.index]) return mock;
  const itemId = mock.items[mock.index].id;
  return { ...mock, answers: { ...mock.answers, [itemId]: answer } };
}

export function sessionScopedState(state, session) {
  return normalizeState({ ...state, trackMode: session?.trackMode ?? state?.trackMode });
}

export function nextExampleFile(files, currentFile, key) {
  if (!files.length || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(key)) return null;
  if (key === 'Home') return files[0];
  if (key === 'End') return files.at(-1);
  const index = Math.max(0, files.indexOf(currentFile));
  const delta = key === 'ArrowRight' ? 1 : -1;
  return files[(index + delta + files.length) % files.length];
}

export function createSession({ items = [], blueprint, kind = 'daily', trackMode = 'angular' } = {}) {
  return {
    items,
    blueprint: blueprint || buildSessionBlueprint(items),
    index: 0,
    reveal: {},
    exampleFiles: {},
    sessionKind: kind,
    trackMode,
  };
}

export {
  applyLocaleToDocument,
  chooseExampleFile,
  renderDeckView,
  renderCodeExample,
  renderLookupResults,
  renderMockQuestion,
  renderMockReport,
  renderMockSetup,
  renderProgressView,
  renderReviewView,
  renderTodayView,
  renderWorkoutView,
} from './views.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadState() {
  const browserLanguages = typeof navigator === 'undefined' ? [] : (navigator.languages || [navigator.language]);
  if (typeof localStorage === 'undefined') return normalizeState({ locale: resolveInitialLocale(undefined, browserLanguages) });
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    const savedLocale = ['en', 'ru', 'es'].includes(stored?.locale) ? stored.locale : undefined;
    return normalizeState({ ...stored, locale: resolveInitialLocale(savedLocale, browserLanguages) });
  } catch {
    return normalizeState({ locale: resolveInitialLocale(undefined, browserLanguages) });
  }
}

function saveState(state) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Private browsing can deny storage. */ }
}

function dueCount(state, now) {
  return Object.values(state.progress || {}).filter((record) => record?.dueAt && new Date(record.dueAt) <= now).length;
}

function modeLabel(state) {
  if (state.modernFocus) return 'Modern Focus';
  return state.versionMode === 'mixed' ? 'Mixed' : `Angular ${state.versionMode}`;
}

function renderTodayView({ state: rawState, questions: content, now = new Date() }) {
  const state = normalizeState(rawState);
  const readiness = calculateReadiness(content, state);
  const due = dueCount(state, now);
  const modernQuestions = content.filter((item) => item.versions.some((version) => version >= 18));
  const modernReadiness = calculateReadiness(modernQuestions, state).overall;
  const weakest = readiness.weakest;

  return `
    <section class="today-grid" aria-labelledby="today-workout-title">
      <article class="hero-card">
        <p class="eyebrow">Your daily workout · ${escapeHtml(modeLabel(state))}</p>
        <h2 id="today-workout-title">Ready for today’s workout?</h2>
        <p class="lede">A focused mix of modern Angular, code reasoning, RxJS, NgRx, and one senior decision. The order stays familiar; the questions adapt to you.</p>
        <div class="session-meta" aria-label="Workout details">
          <span><strong>~18 minutes</strong> to complete</span>
          <span><strong>11 prompts</strong> across 5 sections</span>
          <span><strong>${due || 'Fresh'}</strong> ${due ? 'due today' : 'adaptive set'}</span>
        </div>
        <div class="button-row">
          <button class="primary-button" type="button" data-action="start-workout">Start workout <span aria-hidden="true">→</span></button>
          <button class="secondary-button" type="button" data-action="start-cram">Interview tomorrow</button>
        </div>
        <div class="workout-outline" aria-label="Workout sections">
          <div class="outline-step"><span>3 prompts</span><strong>Warm-up</strong></div>
          <div class="outline-step is-modern"><span>3 prompts</span><strong>Modern Angular</strong></div>
          <div class="outline-step"><span>2 prompts</span><strong>Code Challenge</strong></div>
          <div class="outline-step"><span>2 prompts</span><strong>RxJS / NgRx</strong></div>
          <div class="outline-step"><span>1 prompt</span><strong>Senior Scenario</strong></div>
        </div>
      </article>

      <div class="right-stack">
        <article class="paper-card readiness-card">
          <p class="eyebrow">Readiness, not points</p>
          <div class="readiness-number">${readiness.overall}<small>%</small></div>
          <h3>Interview readiness</h3>
          <p>Your starting estimate shifts only when you rate real practice—not from opening the app.</p>
          <div class="meter" aria-label="Overall interview readiness ${readiness.overall}%"><span style="width:${readiness.overall}%"></span></div>
          <div class="meter-caption"><span>Building</span><span>Interview ready</span></div>
        </article>

        <article class="paper-card note-card">
          <p class="eyebrow">Today’s nudge</p>
          <h3>Explain the tradeoff, not just the API.</h3>
          <p>Senior answers get stronger when you name the decision boundary, the risk, and what you would measure.</p>
        </article>
      </div>
    </section>

    <section class="snapshot-grid" aria-label="Study snapshot">
      <article class="paper-card snapshot-card">
        <div class="card-kicker"><span>Continue learning</span><span class="card-mark">↗</span></div>
        <h3>Signals & RxJS interoperability</h3>
        <p>Draw a clean boundary between synchronous UI state and async event workflows.</p>
        <div class="link-line"><button type="button" data-action="practice-topic" data-topic="Signals & RxJS">Continue topic</button><span aria-hidden="true">→</span></div>
      </article>

      <article class="paper-card snapshot-card">
        <div class="card-kicker"><span>Due for review</span><span class="card-mark">↻</span></div>
        <p class="stat">${due}</p>
        <h3>${due === 1 ? 'concept' : 'concepts'} waiting</h3>
        <p>${due ? 'A short pass now will keep them from becoming cold.' : 'Your first ratings will begin the review schedule.'}</p>
        <div class="link-line"><button type="button" data-action="review-due">Review due cards</button><span aria-hidden="true">→</span></div>
      </article>

      <article class="paper-card snapshot-card">
        <div class="card-kicker"><span>Modern Angular focus</span><span class="card-mark">18+</span></div>
        <p class="stat">${modernReadiness}%</p>
        <h3>Angular 18–22 readiness</h3>
        <p>Your biggest interview gap: <strong>${escapeHtml(weakest.topic)}</strong>. Today’s set gives weaker topics the first look.</p>
        <div class="link-line"><button type="button" data-action="open-progress">See topic breakdown</button><span aria-hidden="true">→</span></div>
      </article>
    </section>`;
}

function versionLabel(item) {
  const min = Math.min(...item.versions);
  const max = Math.max(...item.versions);
  return min === max ? `Angular ${min}` : `Angular ${min}–${max}`;
}

function renderRevealButton(action, label) {
  return `<button class="reveal-button" type="button" data-action="${action}"><span aria-hidden="true">＋</span>${label}</button>`;
}

function renderWorkoutView({ items, index, state: rawState, reveal = {}, sessionKind = 'daily' }) {
  const state = normalizeState(rawState);
  const item = items[index];
  if (!item) return renderReviewView({ items, state });
  const meta = sectionMeta[item.section];
  const saved = state.bookmarks.includes(item.id);
  const sectionOrder = ['warmup', 'modern', 'code', 'rxjs', 'scenario'];
  const currentSection = sectionOrder.indexOf(item.section);
  const percent = Math.round(((index + 1) / items.length) * 100);

  return `
    <section class="workout-view" aria-labelledby="question-title">
      <header class="workout-header">
        <div>
          <p class="eyebrow">${sessionKind === 'cram' ? 'Interview tomorrow' : 'Daily workout'} · question ${index + 1} of ${items.length}</p>
          <h2>${escapeHtml(meta.label)}</h2>
        </div>
        <div class="workout-percent" aria-label="Workout ${percent}% complete"><strong>${percent}%</strong><span>complete</span></div>
      </header>

      <div class="section-progress" aria-label="Workout section progress">
        ${sectionOrder.map((section, sectionIndex) => `<div class="section-pill ${sectionIndex < currentSection ? 'is-done' : ''} ${section === item.section ? 'is-current' : ''}"><span>${sectionIndex + 1}</span>${escapeHtml(sectionMeta[section].label)}</div>`).join('')}
      </div>

      <article class="question-card">
        <div class="question-meta">
          <div><span class="type-label">${escapeHtml(item.type)}</span><span>${escapeHtml(item.topic)}</span><span>${escapeHtml(versionLabel(item))}</span></div>
          <button class="save-button ${saved ? 'is-saved' : ''}" type="button" data-action="toggle-save" data-id="${escapeHtml(item.id)}" aria-pressed="${saved}">${saved ? 'Saved' : 'Save'}</button>
        </div>
        <p class="question-count">Question ${String(index + 1).padStart(2, '0')}</p>
        <h3 id="question-title">${escapeHtml(item.prompt)}</h3>

        <div class="reveal-stack">
          ${reveal.hint ? `<div class="answer-panel hint-panel"><p class="answer-label">A useful nudge</p><p>${escapeHtml(item.hint)}</p></div>` : renderRevealButton('reveal-hint', 'Give me a hint')}
          ${reveal.points ? `<div class="answer-panel"><p class="answer-label">Key points</p><ul>${item.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('')}</ul></div>` : renderRevealButton('reveal-points', 'Show key points')}
          ${reveal.answer ? `<div class="answer-panel full-answer"><p class="answer-label">A strong interview answer</p><p>${escapeHtml(item.answer)}</p></div>` : renderRevealButton('reveal-answer', 'Show full answer')}
          ${item.code ? (reveal.code ? `<pre class="code-block"><code>${escapeHtml(item.code)}</code></pre>` : renderRevealButton('reveal-code', 'Show code')) : ''}
        </div>

        <div class="confidence-panel">
          <div><p class="answer-label">How did that feel?</p><p>Your answer—not the reveal—sets the next review date.</p></div>
          <div class="confidence-actions">
            ${[['easy', 'Easy'], ['knew', 'Knew it'], ['unsure', 'Unsure'], ['missed', 'Missed']].map(([value, label]) => `<button type="button" data-action="rate" data-rating="${value}">${label}</button>`).join('')}
          </div>
        </div>
      </article>

      <footer class="workout-footer"><span>${escapeHtml(meta.description)}</span><button class="text-button" type="button" data-action="exit-workout">Exit workout</button></footer>
    </section>`;
}

function renderReviewView({ items, state: rawState }) {
  const state = normalizeState(rawState);
  const strong = items.filter((item) => ['easy', 'knew'].includes(state.progress[item.id]?.confidence));
  const repeat = items.filter((item) => ['unsure', 'missed'].includes(state.progress[item.id]?.confidence));
  const modernMisses = repeat.filter((item) => item.versions.some((version) => version >= 18));
  const reviewReadiness = calculateReadiness(items, state);
  const topicList = (list, fallback) => list.length
    ? `<ul class="result-list">${list.map((item) => `<li><span>${escapeHtml(item.topic)}</span><small>${escapeHtml(item.type)}</small></li>`).join('')}</ul>`
    : `<p class="result-empty">${fallback}</p>`;

  return `
    <section class="review-view">
      <div class="review-hero">
        <p class="eyebrow">Workout complete</p>
        <h2>You kept the edges sharp.</h2>
        <p>The useful signal is below: what felt solid, what should come back, and which modern topic deserves another pass.</p>
        <div class="review-score"><strong>${reviewReadiness.overall}%</strong><span>readiness across this set</span></div>
      </div>
      <div class="review-grid">
        <article class="paper-card result-card strong-card"><p class="eyebrow">Strong today</p><h3>${strong.length} confident ${strong.length === 1 ? 'answer' : 'answers'}</h3>${topicList(strong, 'No confident rating yet—and that honesty is useful.')}</article>
        <article class="paper-card result-card"><p class="eyebrow">Needs repetition</p><h3>${repeat.length} ${repeat.length === 1 ? 'concept' : 'concepts'} coming back</h3>${topicList(repeat, 'Nothing from this set needs an early repeat.')}</article>
        <article class="paper-card result-card modern-card"><p class="eyebrow">Modern Angular gap</p><h3>${modernMisses[0] ? escapeHtml(modernMisses[0].topic) : 'No new gap detected'}</h3><p>${modernMisses.length ? 'This will receive extra weight in the next adaptive set.' : 'Keep modern topics in rotation so confidence stays earned.'}</p></article>
      </div>
      <div class="review-actions"><button class="primary-button" type="button" data-action="practice-weak">Practice my weak areas · 10 min</button><button class="secondary-button" type="button" data-action="back-today">Back to today</button></div>
    </section>`;
}

const deckNames = { saved: 'Saved', mistakes: 'Mistakes', modern: 'Modern Angular', hard: 'Hard questions', due: 'Review today' };

function renderDeckView({ deck, items, state: rawState }) {
  const state = normalizeState(rawState);
  const title = deckNames[deck] || 'Practice deck';
  const emptyCopy = deck === 'saved' ? 'Nothing saved yet' : 'No cards here yet';
  return `
    <section class="deck-view">
      <header class="view-intro"><p class="eyebrow">Personal revision decks</p><h2>${escapeHtml(title)}</h2><p>Use short, targeted passes when you do not need a full workout.</p></header>
      <div class="deck-tabs" role="tablist" aria-label="Revision decks">
        ${Object.entries(deckNames).map(([key, label]) => `<button role="tab" aria-selected="${deck === key}" class="${deck === key ? 'is-active' : ''}" type="button" data-action="open-deck" data-deck="${key}">${label}</button>`).join('')}
      </div>
      ${items.length ? `
        <div class="deck-toolbar"><span>${items.length} ${items.length === 1 ? 'card' : 'cards'}</span><button class="primary-button" type="button" data-action="practice-deck" data-deck="${deck}">Practice this deck <span aria-hidden="true">→</span></button></div>
        <div class="deck-grid">${items.map((item) => {
          const saved = state.bookmarks.includes(item.id);
          const record = state.progress[item.id];
          return `<article class="paper-card deck-card"><div class="question-meta"><span class="type-label">${escapeHtml(item.type)}</span><span>${escapeHtml(item.topic)}</span></div><h3>${escapeHtml(item.prompt)}</h3><div class="deck-card-footer"><span>${record?.confidence ? `Last: ${escapeHtml(record.confidence)}` : escapeHtml(versionLabel(item))}</span><button type="button" data-action="toggle-save" data-id="${escapeHtml(item.id)}">${saved ? 'Remove' : 'Save'}</button></div></article>`;
        }).join('')}</div>`
        : `<div class="deck-empty"><p class="eyebrow">A clean slate</p><h3>${emptyCopy}</h3><p>${deck === 'saved' ? 'Save any question from a workout and it will appear here.' : 'Your ratings will build this deck automatically.'}</p><button class="secondary-button" type="button" data-action="start-workout">Start a workout</button></div>`}
    </section>`;
}

function renderPracticeHub(state) {
  const due = getDeck(questions, state, 'due').length;
  const mistakes = getDeck(questions, state, 'mistakes').length;
  return `
    <section class="practice-hub">
      <header class="view-intro"><p class="eyebrow">Choose the shape of today’s work</p><h2>Practice with a purpose.</h2><p>The daily workout is still the best default. Focused decks are here for a specific gap or a short window before an interview.</p></header>
      <div class="practice-grid">
        <article class="practice-feature"><p class="eyebrow">Recommended · 18 min</p><h3>Adaptive daily workout</h3><p>Visible structure, automatically chosen questions, and extra modern Angular weight.</p><button class="primary-button" type="button" data-action="start-workout">Start workout <span aria-hidden="true">→</span></button></article>
        <article class="paper-card practice-option"><span class="card-mark">24h</span><h3>Interview tomorrow</h3><p>A 10-question refresher built from mistakes, modern Angular, RxJS, and senior scenarios.</p><button class="text-button" type="button" data-action="start-cram">Build my cram session →</button></article>
        <article class="paper-card practice-option"><span class="card-mark">↻</span><h3>Review today</h3><p>${due ? `${due} concepts are due.` : 'Nothing is overdue yet.'} Keep the spacing schedule honest.</p><button class="text-button" type="button" data-action="open-deck" data-deck="due">Open review deck →</button></article>
        <article class="paper-card practice-option"><span class="card-mark">!</span><h3>Recent mistakes</h3><p>${mistakes ? `${mistakes} missed concepts are waiting.` : 'Missed questions will collect here.'}</p><button class="text-button" type="button" data-action="open-deck" data-deck="mistakes">Open mistakes →</button></article>
        <article class="paper-card practice-option"><span class="card-mark">18+</span><h3>Modern Angular</h3><p>Signals, resources, zoneless, hydration, and modern template patterns.</p><button class="text-button" type="button" data-action="open-deck" data-deck="modern">Focus on 18–22 →</button></article>
      </div>
    </section>`;
}

function renderMockSetup() {
  return `
    <section class="mock-setup">
      <header class="view-intro"><p class="eyebrow">No answers until the end</p><h2>30 min mock interview</h2><p>Six questions, one at a time. Speak your answer out loud, leave yourself a short note, and judge coverage—not charisma.</p></header>
      <div class="level-grid">
        <article class="level-card">
          <div class="level-number">M</div><p class="eyebrow">Middle developer</p><h3>Reason clearly from the fundamentals.</h3><p>Practical Angular, RxJS decisions, code review, and one modern migration question.</p>
          <ul><li>6 questions</li><li>~30 minutes</li><li>Balanced difficulty</li></ul>
          <button class="secondary-button" type="button" data-action="start-mock" data-level="middle">Start middle interview</button>
        </article>
        <article class="level-card senior-level">
          <div class="level-number">S</div><p class="eyebrow">Senior developer</p><h3>Make the tradeoff visible.</h3><p>Architecture, migration risk, performance, modern rendering, and state ownership.</p>
          <ul><li>6 questions</li><li>~30 minutes</li><li>Higher ambiguity</li></ul>
          <button class="primary-button" type="button" data-action="start-mock" data-level="senior">Start senior interview</button>
        </article>
      </div>
    </section>`;
}

function renderMockQuestion({ items, index, level, answers = {} }) {
  const item = items[index];
  const progress = Math.round(((index + 1) / items.length) * 100);
  return `
    <section class="mock-session" aria-labelledby="mock-question-title">
      <header class="mock-session-head">
        <div><p class="eyebrow">${escapeHtml(level)} mock · question ${index + 1} of ${items.length}</p><h2>Interview in progress</h2></div>
        <div class="mock-timer"><span aria-hidden="true">◷</span><strong>~${Math.max(5, 30 - index * 5)} min</strong><small>remaining</small></div>
      </header>
      <div class="meter mock-meter" aria-label="Mock interview ${progress}% complete"><span style="width:${progress}%"></span></div>
      <article class="mock-question-card">
        <div class="question-meta"><div><span class="type-label">${escapeHtml(item.type)}</span><span>${escapeHtml(item.topic)}</span><span>${escapeHtml(versionLabel(item))}</span></div></div>
        <p class="question-count">Interviewer asks</p>
        <h3 id="mock-question-title">${escapeHtml(item.prompt)}</h3>
        <label class="response-field"><span>Your answer notes</span><textarea id="mock-answer" rows="7" placeholder="Write a few anchors after answering out loud…">${escapeHtml(answers[item.id] || '')}</textarea></label>
        <div class="mock-self-check"><div><p class="answer-label">Private self-check</p><p>Did your answer cover the decision and its tradeoffs?</p></div><div>${[['strong', 'Strong'], ['partial', 'Partial'], ['pass', 'Pass / unsure']].map(([value, label]) => `<button type="button" data-action="mock-assess" data-assessment="${value}">${label}</button>`).join('')}</div></div>
      </article>
      <p class="mock-note">Key points stay hidden until the full interview is complete.</p>
    </section>`;
}

function renderMockReport(report) {
  const list = (entries, fallback) => entries.length
    ? `<ul class="report-topics">${entries.map((entry) => `<li><span>${escapeHtml(entry.topic)}</span><small>${escapeHtml(entry.assessment)}</small></li>`).join('')}</ul>`
    : `<p class="result-empty">${fallback}</p>`;
  return `
    <section class="mock-report">
      <header class="report-hero"><div><p class="eyebrow">Interview complete</p><h2>Your answers had a shape.<br>Now sharpen the weak edge.</h2></div><div class="report-score"><strong>${report.score}</strong><span>mock readiness</span></div></header>
      <div class="report-grid">
        <article class="paper-card"><p class="eyebrow">Strong</p><h3>${report.strong.length} answers held up</h3>${list(report.strong, 'No answer was marked strong this round.')}</article>
        <article class="paper-card"><p class="eyebrow">Needs work</p><h3>${report.needsWork.length} answers to revisit</h3>${list(report.needsWork, 'No immediate weakness marked.')}</article>
        <article class="risk-card"><p class="eyebrow">Interview risk</p><h3>${escapeHtml(report.risk)}</h3><p>Re-answer the weakest prompt in two minutes: decision first, reasons second, risks last.</p></article>
      </div>
      <div class="report-actions"><button class="primary-button" type="button" data-action="practice-mock-gaps">Practice these gaps</button><button class="secondary-button" type="button" data-action="restart-mock">Run another mock</button></div>
    </section>`;
}

function renderProgressView({ state: rawState, questions: content, now = new Date() }) {
  const state = normalizeState(rawState);
  const readiness = calculateReadiness(content, state);
  const modern = calculateReadiness(content.filter((item) => item.versions.some((version) => version >= 18)), state);
  const due = getDeck(content, state, 'due', now).length;
  const practiced = Object.keys(state.progress).length;
  return `
    <section class="progress-view">
      <header class="view-intro"><p class="eyebrow">Useful signal, no leaderboard</p><h2>Interview readiness</h2><p>This is a study estimate from your own confidence ratings. It shows where to spend the next session, not a promise about an interview outcome.</p></header>
      <div class="progress-summary">
        <article class="readiness-panel"><p class="eyebrow">Overall readiness</p><strong>${readiness.overall}%</strong><div class="meter"><span style="width:${readiness.overall}%"></span></div><p>${practiced ? (practiced === 1 ? '1 question has a real rating.' : `${practiced} questions have real ratings.`) : 'Start a workout to replace the baseline with your own evidence.'}</p></article>
        <article class="gap-panel"><p class="eyebrow">Biggest interview gap</p><h3>${escapeHtml(readiness.weakest.topic)}</h3><p>This topic has the lowest current confidence estimate and will surface more often.</p><button class="text-button" type="button" data-action="practice-topic" data-topic="${escapeHtml(readiness.weakest.topic)}">Practice this gap →</button></article>
        <article class="review-panel"><p class="eyebrow">Review today</p><strong>${due}</strong><p>${due ? 'concepts are due for spaced repetition.' : 'Nothing overdue. New ratings will start the schedule.'}</p><button class="text-button" type="button" data-action="open-deck" data-deck="due">Open review deck →</button></article>
      </div>
      <div class="topic-panel">
        <div class="topic-panel-head"><div><p class="eyebrow">Topic breakdown</p><h3>Modern Angular readiness · ${modern.overall}%</h3></div><p>Lower-confidence topics appear first.</p></div>
        <div class="topic-bars">${readiness.topics.map((topic) => `<div class="topic-row"><div><span>${escapeHtml(topic.topic)}</span><strong>${topic.score}%</strong></div><div class="meter" aria-label="${escapeHtml(topic.topic)} ${topic.score}%"><span style="width:${topic.score}%"></span></div></div>`).join('')}</div>
      </div>
    </section>`;
}

function renderPlaceholder(view) {
  const copy = {
    practice: ['Practice library', 'Start with the structured workout or choose a focused deck.'],
    mock: ['Mock interview', 'A calm, one-question-at-a-time interview with feedback after the final answer.'],
    saved: ['Saved & mistakes', 'Your personal revision deck will collect bookmarks and questions you miss.'],
    progress: ['Readiness', 'Topic confidence, review timing, and your most important interview gap.'],
  };
  const [title, description] = copy[view] || copy.practice;
  return `<section class="empty-view"><p class="eyebrow">Study mode</p><h2>${title}</h2><p>${description}</p><button class="primary-button" type="button" data-action="start-workout">Start today’s workout <span aria-hidden="true">→</span></button></section>`;
}

function renderLookupResults(query = '') {
  const entries = filterLookup(lookupEntries, query);
  if (!entries.length) return '<p class="lookup-empty">No concise card matched that phrase. Try a broader Angular or RxJS term.</p>';
  return entries.map((entry) => `
    <article class="paper-card lookup-result">
      <p class="eyebrow">Reference card</p>
      <h3>${escapeHtml(entry.title)}</h3>
      <p><strong>Use when</strong><br>${escapeHtml(entry.useWhen)}</p>
      <pre><code>${escapeHtml(entry.typical)}</code></pre>
      <p><strong>Interview trap</strong><br>${escapeHtml(entry.trap)}</p>
    </article>`).join('');
}

function boot() {
  let state = loadState();
  saveState(state);
  let currentView = location.hash.replace('#', '') || 'today';
  let currentDeck = 'saved';
  let session = null;
  let mock = null;
  const viewNode = document.querySelector('#view');
  const pageTitle = document.querySelector('#page-title');
  const versionSelect = document.querySelector('#version-mode');
  const focusInput = document.querySelector('#modern-focus');
  const trackSelect = document.querySelector('#track-mode');
  const localeSelect = document.querySelector('#locale-select');
  const sidebarMode = document.querySelector('#sidebar-mode');
  const lookupDialog = document.querySelector('#lookup-dialog');
  const lookupInput = document.querySelector('#lookup-input');
  const lookupResults = document.querySelector('#lookup-results');

  function syncControls() {
    trackSelect.value = state.trackMode;
    versionSelect.value = state.versionMode;
    focusInput.checked = state.modernFocus;
    const angularControlsRelevant = ['angular', 'mixed'].includes(state.trackMode);
    versionSelect.disabled = !angularControlsRelevant;
    focusInput.disabled = !angularControlsRelevant;
    document.querySelector('.topbar-actions')?.classList.toggle('is-non-angular', !angularControlsRelevant);
    document.body.dataset.track = state.trackMode;
    if (localeSelect) localeSelect.value = state.locale;
    sidebarMode.textContent = state.trackMode === 'angular'
      ? `${viewTrackLabel(state.trackMode, state.locale)} · ${viewModeLabel(state, state.locale)}`
      : viewTrackLabel(state.trackMode, state.locale);
    viewApplyLocaleToDocument(state.locale);
  }

  function setActiveNav(view) {
    document.querySelectorAll('[data-nav]').forEach((item) => item.classList.toggle('is-active', item.dataset.nav === view));
  }

  function render(view = currentView) {
    currentView = view;
    const titleKeys = { today: 'page.today', practice: 'page.practice', workout: 'page.practice', review: 'page.review', mock: 'page.mock', saved: 'page.saved', progress: 'page.progress' };
    pageTitle.textContent = t(state.locale, titleKeys[view] || 'page.today');
    if (view === 'today') viewNode.innerHTML = viewRenderTodayView({ state, questions, locale: state.locale });
    else if (view === 'practice') viewNode.innerHTML = viewRenderPracticeHub(state, state.locale);
    else if (view === 'workout' && session) viewNode.innerHTML = viewRenderWorkoutView({ ...session, state, locale: state.locale });
    else if (view === 'review' && session) viewNode.innerHTML = viewRenderReviewView({ items: session.items, state: sessionScopedState(state, session), locale: state.locale });
    else if (view === 'saved') viewNode.innerHTML = viewRenderDeckView({ deck: currentDeck, items: getDeck(questions, state, currentDeck, new Date(), state.trackMode), state, locale: state.locale });
    else if (view === 'mock') {
      if (!mock) viewNode.innerHTML = viewRenderMockSetup({ locale: state.locale, trackMode: state.trackMode });
      else if (mock.complete) viewNode.innerHTML = viewRenderMockReport(buildMockReport(mock.items, mock.assessments, state), state.locale);
      else viewNode.innerHTML = viewRenderMockQuestion({ ...mock, locale: state.locale });
    }
    else if (view === 'progress') viewNode.innerHTML = viewRenderProgressView({ state, questions, locale: state.locale });
    else viewNode.innerHTML = viewRenderPlaceholder(view, state.locale);
    setActiveNav(['workout', 'review'].includes(view) ? 'practice' : view);
    syncControls();
  }

  function startSession(items, kind = 'daily', blueprint, trackMode = state.trackMode) {
    const selectedSession = items?.length
      ? { items, blueprint }
      : selectTrackWorkout(questions, state, { trackMode });
    session = createSession({ ...selectedSession, kind, trackMode });
    location.hash = 'workout';
    render('workout');
    document.querySelector('#main-view')?.focus();
  }

  function finishSession() {
    state = {
      ...state,
      sessionsCompleted: state.sessionsCompleted + 1,
      lastSessionAt: new Date().toISOString(),
    };
    saveState(state);
    render('review');
  }

  function showToast(message) {
    const toast = document.querySelector('#toast');
    toast.textContent = message;
    toast.classList.add('is-visible');
    setTimeout(() => toast.classList.remove('is-visible'), 1700);
  }

  function openLookup() {
    lookupResults.innerHTML = viewRenderLookupResults('', state.locale, state.trackMode);
    lookupDialog.showModal();
    requestAnimationFrame(() => lookupInput.focus());
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) {
      if (nav.dataset.nav === 'lookup') return openLookup();
      currentDeck = resolveNavigationDeck(nav.dataset.nav, currentDeck);
      location.hash = nav.dataset.nav;
      render(nav.dataset.nav);
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    const actionNode = event.target.closest('[data-action]');
    if (action === 'open-lookup') openLookup();
    if (action === 'close-lookup') lookupDialog.close();
    if (action === 'open-progress') { location.hash = 'progress'; render('progress'); }
    if (action === 'start-workout') startSession();
    if (action === 'start-cram') startSession(selectCramSession(filterByTrack(questions, state.trackMode), state, { total: 10, trackMode: state.trackMode }), 'cram');
    if (action === 'exit-workout' || action === 'back-today') { location.hash = 'today'; render('today'); }
    if (action === 'reveal-hint' || action === 'reveal-points' || action === 'reveal-answer' || action === 'reveal-example') {
      session.reveal[action.replace('reveal-', '')] = true;
      render('workout');
    }
    if (action === 'select-example-file' && session) {
      const item = session.items[session.index];
      session.exampleFiles[item.id] = actionNode.dataset.file;
      render('workout');
    }
    if (action === 'toggle-save') {
      const itemId = actionNode.dataset.id || session?.items?.[session.index]?.id;
      state = toggleBookmark(state, itemId);
      saveState(state);
      showToast(t(state.locale, state.bookmarks.includes(itemId) ? 'toast.saved' : 'toast.removed'));
      render(currentView);
    }
    if (action === 'rate' && session) {
      const item = session.items[session.index];
      state = applyRating(state, item, actionNode.dataset.rating, new Date());
      saveState(state);
      if (session.index >= session.items.length - 1) finishSession();
      else {
        session.index += 1;
        session.reveal = {};
        render('workout');
        document.querySelector('#main-view')?.focus();
      }
    }
    if (action === 'open-deck') {
      currentDeck = actionNode.dataset.deck || 'saved';
      location.hash = 'saved';
      render('saved');
    }
    if (action === 'practice-deck') {
      const deck = actionNode.dataset.deck || currentDeck;
      startSession(getDeck(questions, state, deck, new Date(), state.trackMode).slice(0, 10), deck);
    }
    if (action === 'review-due') {
      currentDeck = 'due';
      location.hash = 'saved';
      render('saved');
    }
    if (action === 'practice-topic') {
      const topicKey = actionNode.dataset.topicKey || '';
      const filtered = filterByTrack(questions, state.trackMode).filter((item) => item.topicKey === topicKey);
      startSession(filtered.slice(0, 6), 'focused');
    }
    if (action === 'practice-weak') {
      const followupTrack = session?.trackMode ?? state.trackMode;
      const scoped = filterByTrack(questions, followupTrack);
      const weak = getDeck(questions, state, 'mistakes', new Date(), followupTrack);
      startSession((weak.length ? weak : selectCramSession(scoped, state, { total: 6, trackMode: followupTrack })).slice(0, 6), 'weak areas', undefined, followupTrack);
    }
    if (action === 'start-mock') {
      const level = actionNode.dataset.level || 'middle';
      mock = { items: selectMockQuestions(questions, level, 6, state.trackMode), index: 0, level, answers: {}, assessments: {}, complete: false, trackMode: state.trackMode };
      render('mock');
      document.querySelector('#main-view')?.focus();
    }
    if (action === 'mock-assess' && mock) {
      const item = mock.items[mock.index];
      const answer = document.querySelector('#mock-answer')?.value || '';
      mock.answers[item.id] = answer;
      mock.assessments[item.id] = actionNode.dataset.assessment || 'partial';
      if (mock.index >= mock.items.length - 1) mock.complete = true;
      else mock.index += 1;
      render('mock');
      document.querySelector('#main-view')?.focus();
    }
    if (action === 'restart-mock') {
      mock = null;
      render('mock');
    }
    if (action === 'practice-mock-gaps' && mock) {
      const report = buildMockReport(mock.items, mock.assessments, state);
      startSession(report.needsWork.map((entry) => questions.find((item) => item.id === entry.id)).filter(Boolean), 'mock gaps', undefined, mock.trackMode);
    }
  });

  versionSelect.addEventListener('change', () => {
    state = { ...state, versionMode: versionSelect.value };
    saveState(state);
    render();
  });
  focusInput.addEventListener('change', () => {
    state = { ...state, modernFocus: focusInput.checked };
    saveState(state);
    render();
  });
  trackSelect.addEventListener('change', () => {
    if (mock && !mock.complete) mock = captureMockAnswer(mock, document.querySelector('#mock-answer')?.value || mock.answers[mock.items[mock.index].id] || '');
    state = normalizeState({ ...state, trackMode: trackSelect.value });
    saveState(state);
    render();
  });
  localeSelect?.addEventListener('change', () => {
    if (mock && !mock.complete) {
      mock = captureMockAnswer(mock, document.querySelector('#mock-answer')?.value || mock.answers[mock.items[mock.index].id] || '');
    }
    state = { ...state, locale: localeSelect.value };
    saveState(state);
    render();
  });
  lookupInput.addEventListener('input', () => { lookupResults.innerHTML = viewRenderLookupResults(lookupInput.value, state.locale, state.trackMode); });
  window.addEventListener('hashchange', () => render(location.hash.replace('#', '') || 'today'));
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openLookup(); }
    if (event.key === 'Escape' && lookupDialog.open) lookupDialog.close();
    const tab = event.target.closest?.('[role="tab"][data-action="select-example-file"]');
    if (tab && session) {
      const tabs = [...tab.closest('[role="tablist"]').querySelectorAll('[role="tab"]')];
      const requested = nextExampleFile(tabs.map((node) => node.dataset.file), tab.dataset.file, event.key);
      if (requested) {
        event.preventDefault();
        const item = session.items[session.index];
        session.exampleFiles[item.id] = requested;
        render('workout');
        requestAnimationFrame(() => document.querySelector(`[role="tab"][data-file="${requested}"]`)?.focus());
      }
    }
  });

  syncControls();
  render(currentView);
}

if (typeof document !== 'undefined') boot();
