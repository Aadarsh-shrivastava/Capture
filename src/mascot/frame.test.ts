import {frameOf, POSES, type Character} from './characters';

const grid: Character = {label: 't', sheet: 0, width: 400, height: 400, cols: 4, rows: 4, face: {x: 0.5, y: 0.5}, inset: 0.1};

test('poses map row by row onto the grid, trimmed at the sides', () => {
  expect(POSES).toHaveLength(16);
  expect(frameOf(grid, 'neutral')).toEqual({x: 10, y: 0, w: 80, h: 100});
  expect(frameOf(grid, 'sleeping')).toEqual({x: 210, y: 200, w: 80, h: 100}); // index 10 → col 2, row 2
});
