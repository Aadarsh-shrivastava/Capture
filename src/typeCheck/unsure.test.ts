import {unsureCandidates} from './unsure';

const apply = {name: 'Apply', description: 'job applications', keywords: ['job', 'cv', 'resume']};
const reads = {name: 'Reads', description: 'articles to read', keywords: ['article', 'blog']};

test('asks when a learning type fits but something else was picked', () => {
  expect(unsureCandidates('send my cv to amazon', 'Task', [apply, reads])).toEqual(['Apply']);
});

test('quiet when nothing custom fits', () => {
  expect(unsureCandidates('buy milk tomorrow', 'Task', [apply, reads])).toBeNull();
});

test('quiet when the custom pick is a strong match', () => {
  expect(unsureCandidates('apply job, send cv and resume', 'Apply', [apply, reads])).toBeNull();
});

test('quiet once a type has learned enough words', () => {
  const learned = {...apply, keywords: Array.from({length: 15}, (_, i) => `w${i}`).concat('cv')};
  expect(unsureCandidates('send my cv to amazon', 'Task', [learned])).toBeNull();
});
