import {bestTypeByKeywords, distinctiveWords, keywordScore, parseKeywords} from './typeKeywords';

test('keyword answers are cleaned', () => {
  expect(parseKeywords('CV, resume,\ninterview; job offer, the, recruiter!')).toEqual(['cv', 'resume', 'interview', 'recruiter']);
});

test('distinctive words skip filler and urls', () => {
  expect(distinctiveWords('I need to send my CV to Acme at www.acme.com')).toEqual(['send', 'acme']);
});

const apply = {name: 'Apply', description: 'job applications', keywords: ['cv', 'resume', 'recruiter', 'google', 'amazon']};
const reads = {name: 'Reads', description: 'articles to read later', keywords: ['article', 'blog', 'paper']};

test('keyword scoring picks a clear winner only', () => {
  expect(keywordScore(apply, 'send my cv to amazon')).toBe(2);
  expect(bestTypeByKeywords([apply, reads], 'send my cv to amazon')?.name).toBe('Apply');
  expect(bestTypeByKeywords([apply, reads], 'read this blog paper later')?.name).toBe('Reads');
  expect(bestTypeByKeywords([apply, reads], 'buy milk')).toBeNull();
  expect(bestTypeByKeywords([apply, reads], 'google')).toBeNull(); // one weak hit isn't enough
});
