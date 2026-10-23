import { lookupEntries, questions } from './data.js';
import { calculateReadiness, filterLookup, normalizeState } from './engine.js';

const STORAGE_KEY = 'angle-interview-state-v1';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function loadState() {
  if (typeof localStorage === 'undefined') return normalizeState({});
  try {
    return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  } catch {
    return normalizeState({});
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

export function renderTodayView({ state: rawState, questions: content, now = new Date() }) {
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
  let currentView = location.hash.replace('#', '') || 'today';
  const viewNode = document.querySelector('#view');
  const pageTitle = document.querySelector('#page-title');
  const versionSelect = document.querySelector('#version-mode');
  const focusInput = document.querySelector('#modern-focus');
  const sidebarMode = document.querySelector('#sidebar-mode');
  const lookupDialog = document.querySelector('#lookup-dialog');
  const lookupInput = document.querySelector('#lookup-input');
  const lookupResults = document.querySelector('#lookup-results');

  function syncControls() {
    versionSelect.value = state.versionMode;
    focusInput.checked = state.modernFocus;
    sidebarMode.textContent = modeLabel(state);
  }

  function setActiveNav(view) {
    document.querySelectorAll('[data-nav]').forEach((item) => item.classList.toggle('is-active', item.dataset.nav === view));
  }

  function render(view = currentView) {
    currentView = view;
    const titles = { today: 'Today', practice: 'Practice', mock: 'Mock interview', saved: 'Saved', progress: 'Progress' };
    pageTitle.textContent = titles[view] || 'Today';
    viewNode.innerHTML = view === 'today' ? renderTodayView({ state, questions }) : renderPlaceholder(view);
    setActiveNav(view);
    syncControls();
  }

  function openLookup() {
    lookupResults.innerHTML = renderLookupResults('');
    lookupDialog.showModal();
    requestAnimationFrame(() => lookupInput.focus());
  }

  document.addEventListener('click', (event) => {
    const nav = event.target.closest('[data-nav]');
    if (nav) {
      if (nav.dataset.nav === 'lookup') return openLookup();
      location.hash = nav.dataset.nav;
      render(nav.dataset.nav);
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'open-lookup') openLookup();
    if (action === 'close-lookup') lookupDialog.close();
    if (action === 'open-progress') { location.hash = 'progress'; render('progress'); }
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
  lookupInput.addEventListener('input', () => { lookupResults.innerHTML = renderLookupResults(lookupInput.value); });
  window.addEventListener('hashchange', () => render(location.hash.replace('#', '') || 'today'));
  window.addEventListener('keydown', (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); openLookup(); }
    if (event.key === 'Escape' && lookupDialog.open) lookupDialog.close();
  });

  syncControls();
  render(currentView);
}

if (typeof document !== 'undefined') boot();
