import {Platform} from 'react-native';
import RNFS from 'react-native-fs';

import {folderName} from './folderName';

export type VaultLocation = 'files' | 'private';

export const VAULT_LOCATIONS: {value: VaultLocation; label: string; hint: string}[] = [
  {
    value: 'files',
    label: Platform.OS === 'ios' ? 'On this iPhone' : 'On this device',
    hint:
      Platform.OS === 'ios'
        ? 'Visible in the Files app under On My iPhone › Capture. Easy to back up or copy.'
        : 'In the app folder on your storage, visible to file managers.',
  },
  {value: 'private', label: 'Private to the app', hint: 'Hidden from the Files app. Removed if you delete the app.'},
];

/** Base folder for a location. Absolute paths are recomputed each launch (iOS container paths change). */
export function locationBase(location: VaultLocation): string {
  if (location === 'files') {
    return Platform.OS === 'android' ? RNFS.ExternalDirectoryPath ?? RNFS.DocumentDirectoryPath : RNFS.DocumentDirectoryPath;
  }
  return Platform.OS === 'ios' ? `${RNFS.LibraryDirectoryPath}/Application Support` : RNFS.DocumentDirectoryPath;
}


export type VaultPaths = {root: string; db: string; models: string; media: string};

export function pathsFor(location: VaultLocation, name: string): VaultPaths {
  const root = `${locationBase(location)}/${folderName(name)}`;
  return {root, db: `${root}/data`, models: `${root}/models`, media: `${root}/media`};
}

/** Where the app kept things before vaults existed. */
export const LEGACY = {
  dbDir: `${RNFS.DocumentDirectoryPath}/SQLite`,
  dbName: 'lockedin.db',
  model: `${RNFS.DocumentDirectoryPath}/qwen-q4_k_m.gguf`,
};
