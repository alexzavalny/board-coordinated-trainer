import { ALL_CELLS, FILES, RANKS, applyAnswer, createGameState, startGame, updateClock } from './game.js';

const boardEl = document.querySelector('#board');
const timerEl = document.querySelector('#timer');
const scoreEl = document.querySelector('#score');
const typedEl = document.querySelector('#typed');
const messageEl = document.querySelector('#message');
const startButton = document.querySelector('#startButton');
const answerInput = document.querySelector('#answerInput');

let state = createGameState({ durationSeconds: 30, cells: ALL_CELLS });
let timerId = null;

function buildBoard() {
  boardEl.innerHTML = '';
  [...RANKS].reverse().forEach(rank => {
    FILES.forEach(file => {
      const coord = `${file}${rank}`;
      const square = document.createElement('div');
      square.className = `square ${(FILES.indexOf(file) + RANKS.indexOf(rank)) % 2 === 0 ? 'dark' : 'light'}`;
      square.dataset.coord = coord;
      square.setAttribute('aria-label', coord);

      const fileLabel = document.createElement('span');
      fileLabel.className = 'file-label';
      fileLabel.textContent = rank === '1' ? file : '';

      const rankLabel = document.createElement('span');
      rankLabel.className = 'rank-label';
      rankLabel.textContent = file === 'a' ? rank : '';

      const dot = document.createElement('span');
      dot.className = 'target-dot';

      square.append(rankLabel, fileLabel, dot);
      boardEl.append(square);
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
