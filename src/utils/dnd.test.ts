import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { reorderList, insertItemAt, swapAdjacent } from './dnd.js';

describe('Drag and Drop Pure Logic Tests', () => {
  it('correctly reorders an item moving downwards', () => {
    const list = ['A', 'B', 'C', 'D'];
    // Moving 'A' (index 0) to after 'C' (target index 3)
    const result = reorderList(list, 0, 3);
    assert.deepEqual(result, ['B', 'C', 'A', 'D']);
  });

  it('correctly reorders an item moving upwards', () => {
    const list = ['A', 'B', 'C', 'D'];
    // Moving 'D' (index 3) to index 1 (before 'B')
    const result = reorderList(list, 3, 1);
    assert.deepEqual(result, ['A', 'D', 'B', 'C']);
  });

  it('keeps identical list when fromIndex equals toIndex', () => {
    const list = ['A', 'B', 'C'];
    const result = reorderList(list, 1, 1);
    assert.deepEqual(result, ['A', 'B', 'C']);
  });

  it('handles out of bounds indices safely', () => {
    const list = ['A', 'B'];
    const result = reorderList(list, 5, 0);
    assert.deepEqual(result, ['A', 'B']);
  });

  it('inserts an item at a specific target index', () => {
    const list = ['Title', 'Email', 'Submit'];
    const newItem = 'Signature';
    const result = insertItemAt(list, newItem, 2);
    assert.deepEqual(result, ['Title', 'Email', 'Signature', 'Submit']);
  });

  it('appends an item to the end when targetIndex is undefined', () => {
    const list = ['First', 'Second'];
    const newItem = 'Last';
    const result = insertItemAt(list, newItem);
    assert.deepEqual(result, ['First', 'Second', 'Last']);
  });

  it('swaps adjacent items up and down cleanly', () => {
    const list = ['1', '2', '3'];
    const swappedUp = swapAdjacent(list, 1, 'up');
    assert.deepEqual(swappedUp, ['2', '1', '3']);

    const swappedDown = swapAdjacent(list, 1, 'down');
    assert.deepEqual(swappedDown, ['1', '3', '2']);
  });
});
