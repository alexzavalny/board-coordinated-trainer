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
const timerEl = isBrowser ? document.querySelector('#timer') : null;
const scoreEl = isBrowser ? document.querySelector('#score') : null;
const typedEl = isBrowser ? document.querySelector('#typed') : null;
const messageEl = isBrowser ? document.querySelector('#message') : null;
const startButton = isBrowser ? document.querySelector('#startButton') : null;
const answerInput = isBrowser ? document.querySelector('#answerInput') : null;

let state = createGameState({ durationSeconds: 30, cells: ALL_CELLS });
let timerId = null;

function buildBoard() {
  boardEl.innerHTML = '';
  [...RANKS].reverse().forEach(rank => {
    FILES.forEach(file => {
      boardEl.append(createSquareElement(document, file, rank));
    });
  });
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
    messageEl.textContent = `Время вышло. Результат: ${state.score}. Нажми «Старт», чтобы сыграть ещё раз.`;
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
  state = startGame(createGameState({ durationSeconds: 30, cells: ALL_CELLS }));
  answerInput.value = '';
  answerInput.disabled = false;
  answerInput.focus();
  startButton.disabled = true;
  startButton.textContent = 'Идёт игра…';
  if (timerId) clearInterval(timerId);
  timerId = setInterval(tick, 100);
  render();
}

if (isBrowser) {
  startButton.addEventListener('click', begin);
  answerInput.addEventListener('input', () => {
    state = applyAnswer(state, answerInput.value);
    answerInput.value = state.typed;
    render();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !state.running) begin();
  });

  buildBoard();
  render();
}
