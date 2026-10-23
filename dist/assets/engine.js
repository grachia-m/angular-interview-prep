const DAY = 86_400_000;
const VALID_MODES = new Set(['mixed', 'modern', '16', '17', '18', '19', '20', '21', '22']);

const clamp = (value, min = 0, max = 100) => Math.min(max, Math.max(min, Number(value) || 0));

export function normalizeState(input = {}) {
  const source = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
  const progress = source.progress && typeof source.progress === 'object' && !Array.isArray(source.progress)
    ? source.progress
    : {};

  return {
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
  const modern = item.versions?.some((version) => version >= 18);
  const due = record.dueAt && new Date(record.dueAt).getTime() <= now.getTime();
  const selectedVersion = Number(mode);

  let score = 100 - masteryFor(item, state);
  score += (Number(record.mistakes) || 0) * 14;
  score += due ? 48 : 0;
  score += (item.difficulty || 3) * 2;

  if (mode === 'modern') score += modern ? 95 : 0;
  if (mode === 'mixed') score += modern ? 22 : 0;
  if (Number.isFinite(selectedVersion) && item.versions?.includes(selectedVersion)) score += 120;
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

export function calculateReadiness(content, rawState) {
  const state = normalizeState(rawState);
  const topicScores = new Map();

  for (const item of content) {
    const values = topicScores.get(item.topic) || [];
    values.push(masteryFor(item, state));
    topicScores.set(item.topic, values);
  }

  const topics = [...topicScores.entries()]
    .map(([topic, values]) => ({
      topic,
      score: Math.round(values.reduce((sum, value) => sum + clamp(value), 0) / values.length),
    }))
    .sort((a, b) => a.score - b.score || a.topic.localeCompare(b.topic));

  const overall = topics.length
    ? Math.round(topics.reduce((sum, topic) => sum + topic.score, 0) / topics.length)
    : 0;
  return { overall: clamp(overall), weakest: topics[0] || { topic: 'No data yet', score: 0 }, topics };
}

export function filterLookup(entries, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) return entries;
  return entries.filter((entry) => [entry.title, entry.useWhen, entry.trap, ...(entry.aliases || [])]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(needle));
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

export function getDeck(content, rawState, deck, now = new Date()) {
  const state = normalizeState(rawState);
  const safeNow = now instanceof Date ? now : new Date(now);
  if (deck === 'saved') return content.filter((item) => state.bookmarks.includes(item.id));
  if (deck === 'modern') return content.filter((item) => item.versions?.some((version) => version >= 18));
  if (deck === 'hard') return content.filter((item) => (item.difficulty || 0) >= 4);
  if (deck === 'due') {
    return content.filter((item) => {
      const dueAt = state.progress[item.id]?.dueAt;
      return dueAt && new Date(dueAt).getTime() <= safeNow.getTime();
    });
  }
  if (deck === 'mistakes') {
    return content
      .filter((item) => (Number(state.progress[item.id]?.mistakes) || 0) > 0)
      .sort((a, b) => {
        const mistakes = (state.progress[b.id]?.mistakes || 0) - (state.progress[a.id]?.mistakes || 0);
        return mistakes || masteryFor(a, state) - masteryFor(b, state);
      });
  }
  return content;
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
