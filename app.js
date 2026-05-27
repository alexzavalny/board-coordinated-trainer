import { ALL_CELLS, FILES, RANKS, applyAnswer, createGameState, startGame, updateClock } from './game.js';

/* ── i18n ── */
const i18n = {
  en: {
    pageTitle: 'Board Coordinates Trainer',
    eyebrow: 'Chess trainer',
    title: 'Board Coordinates Trainer',
    lead: 'Score as many coordinates as you can in one minute.',
    statTime: 'Time',
    statScore: 'Score',
    statInput: 'Input',
    colorLabel: 'Color:',
    colorWhite: 'White',
    colorBlack: 'Black',
    colorRandom: 'Random',
    startBtn: 'Start',
    playingBtn: 'Playing…',
    againBtn: 'Play again',
    closeBtn: 'Close',
    msgReady: 'Press «Start», then type the coordinate of the highlighted square.',
    msgWrong: 'Wrong square — try again.',
    msgTargeting: 'Type the coordinate of the highlighted square.',
    modalTitle: "Time's up!",
    modalMode: 'Mode',
    modalScore: 'Score',
    modeWhite: 'As White',
    modeBlack: 'As Black',
    modeRandom: 'Random',
  },
  ru: {
    pageTitle: 'Тренажёр координат доски',
    eyebrow: 'Chess trainer',
    title: 'Тренажёр координат доски',
    lead: 'За минуту набери как можно больше координат подсвеченных клеток.',
    statTime: 'Время',
    statScore: 'Очки',
    statInput: 'Ввод',
    colorLabel: 'Цвет:',
    colorWhite: 'Белые',
    colorBlack: 'Чёрные',
    colorRandom: 'Рандом',
    startBtn: 'Старт',
    playingBtn: 'Идёт игра…',
    againBtn: 'Ещё раз',
    closeBtn: 'Закрыть',
    msgReady: 'Нажми «Старт», затем печатай координату подсвеченной клетки.',
    msgWrong: 'Не та клетка — попробуй ещё.',
    msgTargeting: 'Печатай координату подсвеченной клетки.',
    modalTitle: 'Время вышло!',
    modalMode: 'Режим',
    modalScore: 'Очки',
    modeWhite: 'За белых',
    modeBlack: 'За чёрных',
    modeRandom: 'Рандом',
  },
};

let lang = 'en';

function applyLanguage() {
  const dict = i18n[lang];
  if (!dict) return;
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key] !== undefined) {
      if (el.placeholder !== undefined) {
        el.placeholder = dict[key];
      } else {
        el.textContent = dict[key];
      }
    }
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
    const key = el.dataset.i18nAriaLabel;
    if (dict[key] !== undefined) {
      el.setAttribute('aria-label', dict[key]);
    }
  });
  // Update lang switch buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });
  // Update html lang attribute
  document.documentElement.lang = lang;
}

function t(key) {
  return i18n[lang]?.[key] ?? key;
}

/* ── Board ── */
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
const langButtons = isBrowser ? document.querySelectorAll('.lang-btn') : null;
const modalEl = isBrowser ? document.querySelector('#resultModal') : null;
const modalIcon = isBrowser ? document.querySelector('#modalIcon') : null;
const modalMode = isBrowser ? document.querySelector('#modalMode') : null;
const modalScore = isBrowser ? document.querySelector('#modalScore') : null;
const modalBtn = isBrowser ? document.querySelector('#modalPlayAgain') : null;
const modalClose = isBrowser ? document.querySelector('#modalClose') : null;

let state = createGameState({ durationSeconds: 60, cells: ALL_CELLS });
let timerId = null;
let orientationSetting = 'white'; // 'white' | 'black' | 'random'
let resultModalDismissed = false;

function hideResultModal() {
  resultModalDismissed = true;
  if (modalEl) {
    modalEl.classList.add('hidden');
    modalEl.setAttribute('aria-hidden', 'true');
  }
}

function resolveOrientation() {
  if (orientationSetting === 'random') {
    return Math.random() < 0.5 ? 'white' : 'black';
  }
  return orientationSetting;
}

function buildBoard(orientation) {
  boardEl.innerHTML = '';
  const ranks = orientation === 'white' ? [...RANKS].reverse() : RANKS;
  const files = orientation === 'white' ? FILES : [...FILES].reverse();
  ranks.forEach(rank => {
    files.forEach(file => {
      boardEl.append(createSquareElement(document, file, rank));
    });
  });
  boardEl.dataset.orientation = orientation;
  if (boardWrap) boardWrap.dataset.orientation = orientation;

  // Place kings on their squares
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

function getModeLabel() {
  if (orientationSetting === 'random') return t('modeRandom');
  return state.orientation === 'black' ? t('modeBlack') : t('modeWhite');
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
    const isBlack = state.orientation === 'black';
    if (modalIcon) modalIcon.textContent = isBlack ? '♚' : '♔';
    if (modalMode) modalMode.textContent = getModeLabel();
    if (modalScore) modalScore.textContent = state.score;
    if (modalEl && !resultModalDismissed) {
      modalEl.classList.remove('hidden');
      modalEl.setAttribute('aria-hidden', 'false');
    }
    messageEl.textContent = '';
    answerInput.disabled = true;
    startButton.disabled = false;
    startButton.textContent = t('againBtn');
  } else if (state.running) {
    messageEl.textContent = state.feedback === 'wrong' ? t('msgWrong') : t('msgTargeting');
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
  hideResultModal();
  resultModalDismissed = false;
  const orientation = resolveOrientation();
  buildBoard(orientation);
  state = startGame(createGameState({ durationSeconds: 60, cells: ALL_CELLS }), Date.now());
  state = { ...state, orientation };
  answerInput.value = '';
  answerInput.disabled = false;
  answerInput.focus();
  startButton.disabled = true;
  startButton.textContent = t('playingBtn');
  if (timerId) clearInterval(timerId);
  timerId = setInterval(tick, 100);
  render();
}

function setOrientation(value) {
  orientationSetting = value;
  colorButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.color === value);
  });
  if (value !== 'random') {
    buildBoard(value);
    if (!state.running) {
      document.querySelectorAll('.square').forEach(sq => sq.classList.remove('target'));
    }
  } else {
    buildBoard('white');
  }
}

if (isBrowser) {
  startButton.addEventListener('click', begin);
  answerInput.addEventListener('input', () => {
    state = applyAnswer(state, answerInput.value);
    answerInput.value = state.typed;

    if (state.feedback === 'correct' && orientationSetting === 'random') {
      const newOrient = resolveOrientation();
      buildBoard(newOrient);
      state = { ...state, orientation: newOrient };
    }

    render();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modalEl && !modalEl.classList.contains('hidden')) {
      hideResultModal();
      return;
    }
    if (event.key === 'Enter' && !state.running) begin();
  });

  colorButtons.forEach(btn => {
    btn.addEventListener('click', () => setOrientation(btn.dataset.color));
  });

  if (modalBtn) {
    modalBtn.addEventListener('click', begin);
  }

  if (modalClose) {
    modalClose.addEventListener('click', hideResultModal);
  }

  if (modalEl) {
    modalEl.addEventListener('click', event => {
      if (event.target === modalEl) hideResultModal();
    });
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      applyLanguage();
      // Re-render dynamic text in the running state
      if (state.running) {
        messageEl.textContent = state.feedback === 'wrong' ? t('msgWrong') : t('msgTargeting');
        startButton.textContent = t('playingBtn');
      } else if (state.startedAt) {
        startButton.textContent = t('againBtn');
        if (modalMode) modalMode.textContent = getModeLabel();
      } else {
        startButton.textContent = t('startBtn');
      }
    });
  });

  applyLanguage();
  buildBoard('white');
  render();
}
