import assert from 'node:assert/strict';
import { normalizeCoordinate, isCoordinateMatch, createGameState, startGame, applyAnswer, nextTarget } from './game.js';

assert.equal(normalizeCoordinate(' E4 '), 'e4');
assert.equal(normalizeCoordinate('е4'), 'e4'); // Cyrillic е should work for Russian keyboard accidents
assert.equal(isCoordinateMatch('A1', 'a1'), true);
assert.equal(isCoordinateMatch('a2', 'a1'), false);

let state = createGameState({ durationSeconds: 30, cells: ['a1', 'b2', 'c3'] });
state = startGame(state, 1000);
assert.equal(state.score, 0);
assert.equal(state.timeLeft, 30);
assert.equal(state.currentTarget, 'a1');

let wrong = applyAnswer(state, 'b2', 1500);
assert.equal(wrong.score, 0);
assert.equal(wrong.feedback, 'wrong');
assert.equal(wrong.currentTarget, 'a1');
assert.equal(wrong.typed, 'b2');

let right = applyAnswer(state, 'a1', 1500);
assert.equal(right.score, 1);
assert.equal(right.feedback, 'correct');
assert.equal(right.currentTarget, 'b2');
assert.equal(right.typed, '');

let expired = applyAnswer({ ...state, endsAt: 1000 }, 'a1', 31001);
assert.equal(expired.running, false);
assert.equal(expired.timeLeft, 0);

assert.equal(nextTarget(['a1'], 'a1'), 'a1');
for (let i = 0; i < 20; i++) {
  assert.notEqual(nextTarget(['a1', 'b2'], 'a1'), 'a1');
}

console.log('All game logic tests passed');
