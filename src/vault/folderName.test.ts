import {folderName} from './folderName';

test('vault names become safe folder names', () => {
  expect(folderName('  My Vault  ')).toBe('My Vault');
  expect(folderName('work/notes: 2026')).toBe('work-notes- 2026');
  expect(folderName('   ')).toBe('Vault');
});
