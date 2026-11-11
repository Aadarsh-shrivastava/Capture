import {extractCaptureMode, extractTextFromCaptureUrl} from './parseCaptureDeepLink';

test('widget buttons open text or voice capture', () => {
  expect(extractCaptureMode('capture://open?mode=voice')).toBe('voice');
  expect(extractCaptureMode('capture://open?mode=type')).toBe('type');
  expect(extractCaptureMode('capture://open?mode=dance')).toBeNull();
  expect(extractCaptureMode('capture://capture?text=hi')).toBeNull();
});

test('text links still save directly', () => {
  expect(extractTextFromCaptureUrl('capture://capture?text=buy%20milk')).toBe('buy milk');
});
