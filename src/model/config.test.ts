import {directDownloadUrl} from './config';

test('drive share links become direct downloads', () => {
  const direct = 'https://drive.usercontent.google.com/download?id=1AbC-d_9&export=download&confirm=t';
  expect(directDownloadUrl('https://drive.google.com/file/d/1AbC-d_9/view?usp=sharing')).toBe(direct);
  expect(directDownloadUrl('https://drive.google.com/open?id=1AbC-d_9')).toBe(direct);
  expect(directDownloadUrl('https://example.com/model.gguf')).toBe('https://example.com/model.gguf');
});
