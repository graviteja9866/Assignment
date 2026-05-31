const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { canTransition, VALID_TRANSITIONS } = require('../src/utils/taskTransitions');
const { AppError } = require('../src/utils/errors');

describe('Task status transitions', () => {
  test('TODO can transition to IN_PROGRESS and BLOCKED', () => {
    assert.equal(canTransition('TODO', 'IN_PROGRESS'), true);
    assert.equal(canTransition('TODO', 'BLOCKED'), true);
    assert.equal(canTransition('TODO', 'DONE'), false);
  });

  test('DONE cannot transition to any state', () => {
    assert.deepEqual(VALID_TRANSITIONS.DONE, []);
    assert.equal(canTransition('DONE', 'TODO'), false);
  });

  test('BLOCKED can return to active states', () => {
    assert.equal(canTransition('BLOCKED', 'IN_PROGRESS'), true);
    assert.equal(canTransition('BLOCKED', 'DONE'), false);
  });
});

describe('AppError', () => {
  test('serializes to consistent error format', () => {
    const err = new AppError(400, 'VALIDATION_ERROR', 'due_date must be a future date');
    assert.deepEqual(err.toJSON(), {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'due_date must be a future date',
    });
  });
});
