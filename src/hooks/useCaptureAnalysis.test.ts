import {analyzeText} from './useCaptureAnalysis';

jest.mock('@/hooks/useLlamaModel', () => ({useLlamaModel: jest.fn()}));

test('the classifier picks the type', async () => {
  expect((await analyzeText('buy milk on the way home')).typeName).toBe('Task');
  expect((await analyzeText('had a lovely evening with my friends')).typeName).toBe('Journal');
  expect((await analyzeText('what if the app could read my mind')).typeName).toBe('Idea');
});

test('a task starts pending, title from your words', async () => {
  const draft = await analyzeText('I need to renew the car insurance');
  expect(draft.behaviorData).toEqual({Doable: {status: 'pending', due_at: '', estimated_minutes: ''}});
  expect(draft.title).toBe('Renew the car insurance');
});

test('your pick when sharing beats the classifier', async () => {
  expect((await analyzeText('had a lovely day', undefined, new Date(), 'todo')).typeName).toBe('Task');
  const read = await analyzeText('buy milk', undefined, new Date(), 'read');
  expect(read.typeName).toBe('Note');
  expect(read.behaviorData).toHaveProperty('Memorable');
});
