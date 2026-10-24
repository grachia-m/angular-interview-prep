import { getLocalizedContent, normalizeLocale } from './i18n.js';

const DAY = 86_400_000;
const VALID_MODES = new Set(['mixed', 'modern', '16', '17', '18', '19', '20', '21', '22']);
export const SUPPORTED_TRACKS = ['angular', 'javascript', 'html', 'css', 'mixed'];

export function normalizeTrack(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return SUPPORTED_TRACKS.includes(normalized) ? normalized : 'angular';
}

export function filterByTrack(content, trackMode = 'angular') {
  const track = normalizeTrack(trackMode);
  return track === 'mixed' ? [...content] : content.filter((item) => item.track === track);
}

const WORKOUT_BLUEPRINTS = {
  angular: { id: 'angular', total: 11, stages: [
    { key: 'warmup', sections: ['warmup'], count: 3 }, { key: 'modern', sections: ['modern'], count: 3 },
    { key: 'code', sections: ['code'], count: 2 }, { key: 'rxjs', sections: ['rxjs'], count: 2 },
    { key: 'scenario', sections: ['scenario'], count: 1 },
  ] },
  javascript: { id: 'javascript', total: 10, stages: [
    { key: 'js-runtime', sections: ['js-runtime'], count: 2 }, { key: 'js-functions', sections: ['js-functions'], count: 2 },
    { key: 'js-async', sections: ['js-async'], count: 3 }, { key: 'js-code', sections: ['js-code'], count: 2 },
    { key: 'js-scenario', sections: ['js-scenario'], count: 1 },
  ] },
  html: { id: 'html', total: 6, stages: [
    { key: 'html-semantics', sections: ['html-semantics'], count: 1 }, { key: 'html-forms', sections: ['html-forms'], count: 1 },
    { key: 'html-browser', sections: ['html-browser'], count: 2 }, { key: 'html-review', sections: ['html-review'], count: 1 },
    { key: 'html-scenario', sections: ['html-scenario'], count: 1 },
  ] },
  css: { id: 'css', total: 6, stages: [
    { key: 'css-cascade', sections: ['css-cascade'], count: 1 }, { key: 'css-layout', sections: ['css-layout'], count: 2 },
    { key: 'css-responsive', sections: ['css-responsive'], count: 1 }, { key: 'css-review', sections: ['css-review'], count: 1 },
    { key: 'css-scenario', sections: ['css-scenario'], count: 1 },
  ] },
  mixed: { id: 'mixed', total: 11, stages: [
    { key: 'mix-warmup', count: 1 }, { key: 'mix-js-core', count: 2 }, { key: 'mix-js-async', count: 3 },
    { key: 'mix-web', count: 3 }, { key: 'mix-angular', count: 1 }, { key: 'mix-scenario', count: 1 },
  ] },
};

export function getWorkoutBlueprint(trackMode = 'angular') {
  return WORKOUT_BLUEPRINTS[normalizeTrack(trackMode)];
}

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

export function normalizeState(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const progress = source.progress && typeof source.progress === 'object' && !Array.isArray(source.progress)
    ? source.progress
    : {};

  return {
    locale: normalizeLocale(source.locale),
    trackMode: normalizeTrack(source.trackMode),
    versionMode: VALID_MODES.has(String(source.versionMode)) ? String(source.versionMode) : 'mixed',
    modernFocus: source.modernFocus === true,
    bookmarks: Array.isArray(source.bookmarks) ? source.bookmarks.filter((id) => typeof id === 'string') : [],
    progress,
    streak: Number.isFinite(source.streak) ? Math.max(0, source.streak) : 0,
    sessionsCompleted: Number.isFinite(source.sessionsCompleted) ? Math.max(0, source.sessionsCompleted) : 0,
    lastSessionAt: typeof source.lastSessionAt === 'string' ? source.lastSessionAt : null,
  };
}

function masteryFor(item, state) {
  const stored = state.progress?.[item.id]?.mastery;
  if (Number.isFinite(stored)) return clamp(stored);
  return item.versions?.some((version) => version >= 18) ? 46 : 68;
}

function itemScore(item, state, mode, now) {
  const record = state.progress?.[item.id] || {};
  const angularItem = !item.track || item.track === 'angular';
  const modern = angularItem && item.versions?.some((version) => version >= 18);
  const due = record.dueAt && new Date(record.dueAt).getTime() <= now.getTime();
  const selectedVersion = Number(mode);

  let score = 100 - masteryFor(item, state);
  score += (Number(record.mistakes) || 0) * 14;
  score += due ? 48 : 0;
  score += (item.difficulty || 3) * 2;

  if (angularItem && mode === 'modern') score += modern ? 95 : 0;
  if (angularItem && mode === 'mixed') score += modern ? 22 : 0;
  if (angularItem && Number.isFinite(selectedVersion) && item.versions?.includes(selectedVersion)) score += 120;
  return score;
}

export function selectWorkout(content, rawState, mode = 'mixed', options = {}) {
  const state = normalizeState(rawState);
  const safeMode = VALID_MODES.has(String(mode)) ? String(mode) : 'mixed';
  const total = Math.max(1, Number(options.total) || 11);
  const now = options.now ? new Date(options.now) : new Date();
  const ranked = content
    .map((item, index) => ({ item, index, score: itemScore(item, state, safeMode, now) }))
    .sort((a, b) => b.score - a.score || a.index - b.index);

  const exactVersion = Number(safeMode);
  if (Number.isFinite(exactVersion)) {
    ranked.sort((a, b) => {
      const aExact = a.item.versions?.includes(exactVersion) ? 1 : 0;
      const bExact = b.item.versions?.includes(exactVersion) ? 1 : 0;
      return bExact - aExact || b.score - a.score || a.index - b.index;
    });
  }

  const sections = new Set(content.map((item) => item.section));
  const useStructure = options.structured !== false && total >= 11 && ['warmup', 'modern', 'code', 'rxjs', 'scenario'].every((section) => sections.has(section));
  if (!useStructure) return ranked.slice(0, total).map(({ item }) => item);

  const quotas = { warmup: 3, modern: 3, code: 2, rxjs: 2, scenario: 1 };
  const selected = [];
  for (const [section, count] of Object.entries(quotas)) {
    selected.push(...ranked.filter(({ item }) => item.section === section).slice(0, count).map(({ item }) => item));
  }
  return selected.slice(0, total);
}

export function selectTrackWorkout(content, rawState, options = {}) {
  const state = normalizeState(rawState);
  const trackMode = normalizeTrack(options.trackMode ?? state.trackMode);
  const blueprint = getWorkoutBlueprint(trackMode);
  const now = options.now || new Date();
  const angularMode = state.modernFocus ? 'modern' : state.versionMode;
  const selected = [];
  const seen = new Set();
  const addRanked = (candidates, count) => {
    const ranked = selectWorkout(candidates.filter((item) => !seen.has(item.id)), state, angularMode, { total: Math.max(count, candidates.length), now, structured: false });
    ranked.slice(0, count).forEach((item) => { seen.add(item.id); selected.push(item); });
  };

  if (trackMode !== 'mixed') {
    const scoped = filterByTrack(content, trackMode);
    for (const stage of blueprint.stages) addRanked(scoped.filter((item) => stage.sections.includes(item.section)), stage.count);
    return { items: selected.slice(0, blueprint.total), blueprint };
  }

  const javascript = content.filter((item) => item.track === 'javascript');
  const nonAsync = javascript.filter((item) => !item.tags?.includes('async'));
  addRanked(nonAsync, 1);
  addRanked(nonAsync, 2);
  addRanked(javascript.filter((item) => item.tags?.includes('async')), 3);
  addRanked(content.filter((item) => item.track === 'html'), 2);
  addRanked(content.filter((item) => item.track === 'css'), 1);
  addRanked(content.filter((item) => item.track === 'angular' && item.section !== 'scenario'), 1);
  addRanked(content.filter((item) => item.track === 'angular' && item.section === 'scenario'), 1);
  return { items: selected.slice(0, blueprint.total), blueprint };
}

export function applyRating(rawState, item, rating, now = new Date()) {
  const state = normalizeState(rawState);
  const current = state.progress[item.id] || {};
  const baseMastery = Number.isFinite(current.mastery) ? clamp(current.mastery) : 50;
  const changes = {
    easy: { delta: 14, days: 14 },
    knew: { delta: 8, days: 7 },
    unsure: { delta: -5, days: 3 },
    missed: { delta: -16, days: 1 },
  };
  const change = changes[rating] || changes.unsure;
  const mistakes = Math.max(0, Number(current.mistakes) || 0) + (rating === 'missed' ? 1 : 0);
  const dueAt = new Date(now.getTime() + change.days * DAY).toISOString();

  return {
    ...state,
    progress: {
      ...state.progress,
      [item.id]: {
        ...current,
        mastery: clamp(baseMastery + change.delta),
        confidence: rating,
        attempts: Math.max(0, Number(current.attempts) || 0) + 1,
        mistakes,
        lastSeenAt: now.toISOString(),
        dueAt,
      },
    },
  };
}

export function calculateReadiness(content, rawState, trackMode) {
  const state = normalizeState(rawState);
  const scopedContent = trackMode ? filterByTrack(content, trackMode) : content;
  const topicScores = new Map();
  const topicLabels = new Map();

  for (const item of scopedContent) {
    const topicKey = item.topicKey || item.topic || 'no-data';
    const values = topicScores.get(topicKey) || [];
    values.push(masteryFor(item, state));
    topicScores.set(topicKey, values);
    if (!topicLabels.has(topicKey)) topicLabels.set(topicKey, item.topic || topicKey);
  }

  const topics = [...topicScores.entries()]
    .map(([topicKey, values]) => {
      const summary = {
        topicKey,
        score: Math.round(values.reduce((sum, value) => sum + clamp(value), 0) / values.length),
      };
      Object.defineProperty(summary, 'topic', { value: topicLabels.get(topicKey) || topicKey, enumerable: false });
      return summary;
    })
    .sort((a, b) => a.score - b.score || a.topicKey.localeCompare(b.topicKey));

  const overall = topics.length
    ? Math.round(topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length)
    : 0;
  const empty = { topicKey: 'no-data', score: 0 };
  Object.defineProperty(empty, 'topic', { value: 'No data yet', enumerable: false });
  return { overall: clamp(overall), weakest: topics[0] || empty, topics };
}

export function filterLookup(entries, query, locale = 'en') {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((entry) => {
    const localized = getLocalizedContent(entry, locale);
    return [localized.title, localized.useWhen, localized.trap, ...(entry.aliases || [])]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
      .includes(needle);
  });
}

export function toggleBookmark(rawState, itemId) {
  const state = normalizeState(rawState);
  const exists = state.bookmarks.includes(itemId);
  return {
    ...state,
    bookmarks: exists
      ? state.bookmarks.filter((id) => id !== itemId)
      : [...state.bookmarks, itemId],
  };
}

export function getDeck(content, rawState, deck, now = new Date(), trackMode) {
  const state = normalizeState(rawState);
  const safeNow = now instanceof Date ? now : new Date(now);
  const scoped = trackMode ? filterByTrack(content, trackMode) : content;
  if (deck === 'saved') return scoped.filter((item) => state.bookmarks.includes(item.id));
  if (deck === 'modern') return scoped.filter((item) => item.versions?.some((version) => version >= 18));
  if (deck === 'hard') return scoped.filter((item) => (item.difficulty || 0) >= 4);
  if (deck === 'due') {
    return scoped.filter((item) => {
      const dueAt = state.progress[item.id]?.dueAt;
      return dueAt && new Date(dueAt).getTime() <= safeNow.getTime();
    });
  }
  if (deck === 'mistakes') {
    return scoped
      .filter((item) => (Number(state.progress[item.id]?.mistakes) || 0) > 0)
      .sort((a, b) => {
        const mistakes = (state.progress[b.id]?.mistakes || 0) - (state.progress[a.id]?.mistakes || 0);
        return mistakes || masteryFor(a, state) - masteryFor(b, state);
      });
  }
  return scoped;
}

export function selectCramSession(content, rawState, options = {}) {
  const state = normalizeState(rawState);
  const total = Math.max(1, Number(options.total) || 10);
  const now = options.now ? new Date(options.now) : new Date();
  const result = [];
  const seen = new Set();
  const add = (item) => {
    if (item && !seen.has(item.id) && result.length < total) {
      seen.add(item.id);
      result.push(item);
    }
  };

  getDeck(content, state, 'mistakes', now).slice(0, 2).forEach(add);
  ['modern', 'rxjs', 'scenario'].forEach((section) => {
    const candidate = selectWorkout(
      content.filter((item) => section === 'modern'
        ? item.versions?.some((version) => version >= 18)
        : item.section === section),
      state,
      'modern',
      { total: 1, now, structured: false },
    )[0];
    add(candidate);
  });
  selectWorkout(content, state, 'modern', { total: content.length, now, structured: false }).forEach(add);
  return result.slice(0, total);
}

export function selectMockQuestions(content, level = 'middle', total = 6, trackMode) {
  const count = Math.max(1, Number(total) || 6);
  const direction = level === 'senior' ? -1 : 1;
  const normalizedTrack = trackMode ? normalizeTrack(trackMode) : null;
  const scoped = normalizedTrack ? filterByTrack(content, normalizedTrack) : content;
  const ranked = [...scoped].sort((a, b) => direction * ((a.difficulty || 0) - (b.difficulty || 0)) || a.id.localeCompare(b.id));
  const selected = [];
  const seen = new Set();
  const add = (item) => {
    if (item && !seen.has(item.id) && selected.length < count) {
      seen.add(item.id);
      selected.push(item);
    }
  };
  if (normalizedTrack === 'mixed') {
    add(ranked.find((item) => item.track === 'javascript' && item.section === 'js-scenario'));
    for (const item of ranked.filter((candidate) => candidate.track === 'javascript')) {
      if (selected.filter((candidate) => candidate.track === 'javascript').length >= 3) break;
      add(item);
    }
    add(ranked.find((item) => item.track === 'html'));
    add(ranked.find((item) => item.track === 'css'));
    add(ranked.find((item) => item.track === 'angular'));
  } else {
    const stages = normalizedTrack ? getWorkoutBlueprint(normalizedTrack).stages : ['warmup', 'modern', 'code', 'rxjs', 'scenario'].map((key) => ({ sections: [key] }));
    stages.forEach((stage) => add(ranked.find((item) => stage.sections?.includes(item.section))));
  }
  ranked.forEach(add);
  return selected.slice(0, count);
}

export function buildMockReport(items, assessments = {}, rawState = {}) {
  const state = normalizeState(rawState);
  const assessmentScores = { strong: 85, partial: 58, pass: 30 };
  const entries = items.map((item) => {
    const assessment = assessments[item.id] || 'pass';
    const selfScore = assessmentScores[assessment] || assessmentScores.pass;
    const previous = state.progress[item.id]?.mastery;
    const score = Number.isFinite(previous) ? Math.round((selfScore * 2 + clamp(previous)) / 3) : selfScore;
    return { ...item, assessment, score };
  });
  const strong = entries.filter((entry) => entry.assessment === 'strong');
  const needsWork = entries.filter((entry) => entry.assessment !== 'strong');
  const weakest = [...entries].sort((a, b) => a.score - b.score || b.difficulty - a.difficulty)[0];
  const score = entries.length ? Math.round(entries.reduce((sum, entry) => sum + entry.score, 0) / entries.length) : 0;
  const risk = weakest ? { topicKey: weakest.topicKey || weakest.topic, itemId: weakest.id } : null;
  return { score: clamp(score), strong, needsWork, risk, entries };
}
