import { ALL_CELLS, FILES, RANKS, applyAnswer, createGameState, startGame, updateClock } from './game.js';

export function shouldShowBoardCoordinateLabels() {
  return false;
}

export function createSquareElement(documentRef, file, rank) {
  const coord = `${file}${rank}`;
  const square = documentRef.createElement('div');
  square.className = `square ${(FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0 ? 'dark' : 'light'}`;
  square.dataset.coord = coord;
  square.setAttribute('aria-label', coord);

  const dot = documentRef.createElement('span');
  dot.className = 'target-dot';
  square.append(dot);
  return square;
}

const isBrowser = typeof document !== 'undefined';
const boardEl = isBrowser ? document.querySelector('#board') : null;
const boardWrap = isBrowser ? document.querySelector('.board-wrap') : null;
const timerEl = isBrowser ? document.querySelector('#timer') : null;
const scoreEl = isBrowser ? document.querySelector('#score') : null;
const typedEl = isBrowser ? document.querySelector('#typed') : null;
const messageEl = isBrowser ? document.querySelector('#message') : null;
const startButton = isBrowser ? document.querySelector('#startButton') : null;
const answerInput = isBrowser ? document.querySelector('#answerInput') : null;
const colorButtons = isBrowser ? document.querySelectorAll('.color-btn') : null;

let state = createGameState({ durationSeconds: 60, cells: ALL_CELLS });
let timerId = null;
let orientationSetting = 'white'; // 'white' | 'black' | 'random'

function resolveOrientation() {
  if (orientationSetting === 'random') {
    return Math.random() < 0.5 ? 'white' : 'black';
  }
  return orientationSetting;
}

function buildBoard(orientation) {
  boardEl.innerHTML = '';
  const ranks = orientation === 'white' ? [...RANKS].reverse() : RANKS;       // white: 8→1, black: 1→8
  const files = orientation === 'white' ? FILES : [...FILES].reverse();       // white: a→h, black: h→a
  ranks.forEach(rank => {
    files.forEach(file => {
      boardEl.append(createSquareElement(document, file, rank));
    });
  });
  boardEl.dataset.orientation = orientation;
  if (boardWrap) boardWrap.dataset.orientation = orientation;

  // Ставим королей на законные места
  const placeKing = (coord, src) => {
    const sq = boardEl.querySelector(`[data-coord="${coord}"]`);
    if (!sq) return;
    sq.querySelector('.king')?.remove();
    const el = document.createElement('img');
    el.className = 'king';
    el.src = src;
    el.alt = '';
    el.draggable = false;
    sq.append(el);
  };
  placeKing('e1', 'king-w.svg');
  placeKing('e8', 'king-b.svg');
}

function render() {
  timerEl.textContent = state.timeLeft;
  scoreEl.textContent = state.score;
  typedEl.textContent = state.typed || '—';
  typedEl.classList.toggle('correct', state.feedback === 'correct');
  typedEl.classList.toggle('wrong', state.feedback === 'wrong');

  document.querySelectorAll('.square').forEach(square => {
    square.classList.toggle('target', state.running && square.dataset.coord === state.currentTarget);
    square.classList.toggle('correct-flash', state.feedback === 'correct' && square.dataset.coord === state.currentTarget);
  });

  if (!state.running && state.startedAt) {
    const orientLabel = state.orientation === 'black' ? ' за чёрных' : ' за белых';
    messageEl.textContent = `Время вышло! Играл${orientLabel}. Результат: ${state.score}. Нажми «Старт» снова.`;
    answerInput.disabled = true;
    startButton.disabled = false;
    startButton.textContent = 'Ещё раз';
  } else if (state.running) {
    messageEl.textContent = state.feedback === 'wrong'
      ? 'Не та клетка — попробуй ещё.'
      : 'Печатай координату подсвеченной клетки.';
  }
}

function tick() {
  state = updateClock(state);
  render();
  if (!state.running && timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function begin() {
  const orientation = resolveOrientation();
  buildBoard(orientation);
  state = startGame(createGameState({ durationSeconds: 60, cells: ALL_CELLS }), Date.now());
  state = { ...state, orientation };
  answerInput.value = '';
  answerInput.disabled = false;
  answerInput.focus();
  startButton.disabled = true;
  startButton.textContent = 'Идёт игра…';
  if (timerId) clearInterval(timerId);
  timerId = setInterval(tick, 100);
  render();
}

function setOrientation(value) {
  orientationSetting = value;
  colorButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === value);
  });
  // Перестраиваем доску с новой ориентацией сразу (кроме Random — там на старте)
  if (value !== 'random') {
    buildBoard(value);
    // Сбрасываем подсветку цели если не в игре
    if (!state.running) {
      document.querySelectorAll('.square').forEach(sq => sq.classList.remove('target'));
    }
  } else {
    // Random — показываем нейтрально (белые)
    buildBoard('white');
  }
}

if (isBrowser) {
  startButton.addEventListener('click', begin);
  answerInput.addEventListener('input', () => {
    state = applyAnswer(state, answerInput.value);
    answerInput.value = state.typed;

    // Random mode: переворачиваем доску после каждого правильного ответа
    if (state.feedback === 'correct' && orientationSetting === 'random') {
      const newOrient = resolveOrientation();
      buildBoard(newOrient);
      state = { ...state, orientation: newOrient };
    }

    render();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !state.running) begin();
  });

  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => setOrientation(btn.dataset.color));
  });

  buildBoard('white');
  render();
}
