export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
export const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'];
export const ALL_CELLS = FILES.flatMap(file => RANKS.map(rank => `${file}${rank}`));

const CYRILLIC_TO_LATIN = new Map([
  ['а', 'a'], ['А', 'a'],
  ['б', 'b'], ['Б', 'b'],
  ['ц', 'c'], ['Ц', 'c'],
  ['д', 'd'], ['Д', 'd'],
  ['е', 'e'], ['Е', 'e'],
  ['ф', 'f'], ['Ф', 'f'],
  ['г', 'g'], ['Г', 'g'],
  ['х', 'h'], ['Х', 'h'],
]);

export function normalizeCoordinate(value) {
  return String(value ?? '')
    .trim()
    .split('')
    .map(ch => CYRILLIC_TO_LATIN.get(ch) ?? ch)
    .join('')
    .toLowerCase();
}

export function isCoordinateMatch(answer, target) {
  return normalizeCoordinate(answer) === normalizeCoordinate(target);
}

export function nextTarget(cells = ALL_CELLS, previous = null, random = Math.random) {
  if (!cells.length) throw new Error('cells must not be empty');
  if (cells.length === 1) return cells[0];

  let candidate = previous;
  while (candidate === previous) {
    candidate = cells[Math.floor(random() * cells.length)];
  }
  return candidate;
}

export function createGameState({ durationSeconds = 30, cells = ALL_CELLS } = {}) {
  return {
    durationSeconds,
    cells,
    running: false,
    score: 0,
    typed: '',
    currentTarget: null,
    feedback: null,
    startedAt: null,
    endsAt: null,
    timeLeft: durationSeconds,
  };
}

export function startGame(state = createGameState(), now = Date.now()) {
  return {
    ...state,
    running: true,
    score: 0,
    typed: '',
    feedback: null,
    currentTarget: nextTarget(state.cells),
    startedAt: now,
    endsAt: now + state.durationSeconds * 1000,
    timeLeft: state.durationSeconds,
  };
}

export function updateClock(state, now = Date.now()) {
  if (!state.running) return state;
  const msLeft = Math.max(0, state.endsAt - now);
  const timeLeft = Math.ceil(msLeft / 1000);
  if (msLeft <= 0) {
    return { ...state, running: false, timeLeft: 0, typed: '', feedback: null };
  }
  return { ...state, timeLeft };
}

export function applyAnswer(state, answer, now = Date.now(), random = Math.random) {
  const timed = updateClock(state, now);
  if (!timed.running) return timed;

  const typed = normalizeCoordinate(answer);
  if (!isCoordinateMatch(typed, timed.currentTarget)) {
    return { ...timed, typed, feedback: typed.length >= 2 ? 'wrong' : null };
  }

  return {
    ...timed,
    score: timed.score + 1,
    typed: '',
    feedback: 'correct',
    currentTarget: nextTarget(timed.cells, timed.currentTarget, random),
  };
}
