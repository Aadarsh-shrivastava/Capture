import {distinctiveWords, keywordScore, parseKeywords} from './typeKeywords';

test('keyword answers are cleaned', () => {
  expect(parseKeywords('CV, resume,\ninterview; job offer, the, recruiter!')).toEqual(['cv', 'resume', 'interview', 'recruiter']);
});

test('distinctive words skip filler and urls', () => {
  expect(distinctiveWords('I need to send my CV to Acme at www.acme.com')).toEqual(['send', 'acme']);
});

const apply = {name: 'Apply', description: 'job applications', keywords: ['cv', 'resume', 'recruiter', 'google', 'amazon']};
const reads = {name: 'Reads', description: 'articles to read later', keywords: ['article', 'blog', 'paper']};

test('keyword scoring counts matching keywords', () => {
  expect(keywordScore(apply, 'send my cv to amazon')).toBe(2);
  expect(keywordScore(reads, 'buy milk')).toBe(0);
});
