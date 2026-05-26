import assert from 'node:assert/strict';
import { createSquareElement, shouldShowBoardCoordinateLabels } from './app.js';

function fakeDocument() {
  return {
    createElement(tagName) {
      const classNames = new Set();
      return {
        tagName,
        dataset: {},
        children: [],
        textContent: '',
        className: '',
        attributes: {},
        classList: {
          add(name) { classNames.add(name); },
          contains(name) { return classNames.has(name); },
        },
        append(...nodes) { this.children.push(...nodes); },
        setAttribute(name, value) { this.attributes[name] = value; },
        querySelectorAll(selector) {
          if (selector === '.file-label' || selector === '.rank-label') return [];
          return this.children.filter(child => child.className === selector.slice(1));
        },
      };
    },
  };
}

assert.equal(shouldShowBoardCoordinateLabels(), false);
const square = createSquareElement(fakeDocument(), 'a', '1');
assert.equal(square.dataset.coord, 'a1');
assert.equal(square.children.length, 1);
assert.equal(square.children[0].className, 'target-dot');
assert.equal(square.querySelectorAll('.file-label').length, 0);
assert.equal(square.querySelectorAll('.rank-label').length, 0);

console.log('Board label tests passed');
