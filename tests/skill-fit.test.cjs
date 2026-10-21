const test = require('node:test');
const assert = require('node:assert/strict');
const F = require('../skill-fit.js');
const complete = count => ({ task: 'Comentar una tabla en cada estudio.', answers: [...Array.from({ length: 5 }, (_, i) => i < count ? 'yes' : 'no'), 'yes'] });

test('task criteria select prompt, narrowing or skill at the workshop boundaries', () => {
  for (const [count, type] of [[0, 'prompt'], [1, 'prompt'], [2, 'narrow'], [3, 'narrow'], [4, 'skill'], [5, 'skill']]) {
    const result = F.evaluate(complete(count));
    assert.equal(result.type, type); assert.equal(result.score, count); assert.equal(result.answered, 6); assert.equal(result.ready, true);
  }
});
test('a result requires a named task and all six answers', () => {
  assert.equal(F.evaluate({ ...complete(5), task: '   ' }).ready, false);
  const data = complete(5); data.answers[2] = null;
  const result = F.evaluate(data);
  assert.equal(result.type, 'pending'); assert.equal(result.answered, 5); assert.equal(result.ready, false);
});
test('authorised use and critical review take precedence over five positive criteria', () => {
  const data = complete(5); data.answers[5] = 'no';
  const result = F.evaluate(data);
  assert.equal(result.type, 'review'); assert.equal(result.score, 5); assert.ok(result.reasons.length > 0);
});
test('old projects remain valid and invalid answers are not interpreted as no', () => {
  assert.deepEqual(F.restore(undefined), F.initial());
  const restored = F.restore({ task: 'a'.repeat(1200), selection: 'not-an-example', answers: ['yes', 'invalid', true, 'no'], example: 'true' });
  assert.equal(restored.task.length, 1000); assert.equal(restored.selection, '');
  assert.deepEqual(restored.answers, ['yes', null, null, 'no', null, null]); assert.equal(restored.example, false);
});
test('worked examples cover all four useful outcomes', () => {
  const expected = { translate: 'prompt', methods: 'skill', titles: 'prompt', indicators: 'skill', explain: 'narrow', merit: 'review' };
  for (const [key, example] of Object.entries(F.examples)) assert.equal(F.evaluate(example).type, expected[key], key);
});
test('a mostly suitable one-off task receives a reuse qualification', () => {
  const data = complete(5); data.answers[0] = 'no'; const result = F.evaluate(data);
  assert.equal(result.score, 4); assert.ok(result.reasons.some(r => r.includes('una vez')));
});
