import Storage from 'expo-sqlite/kv-store';
import RNFS from 'react-native-fs';

import {LEGACY, pathsFor, type VaultLocation, type VaultPaths} from './paths';

const KEY = 'vault.config';

export type VaultConfig = {name: string; location: VaultLocation; createdAt: string};

// The pointer to the vault lives in app settings (outside the vault) so it can be found at launch.
export function getVaultConfig(): VaultConfig | null {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw ? (JSON.parse(raw) as VaultConfig) : null;
  } catch {
    return null;
  }
}

/** Paths of the current vault; throws if onboarding hasn't created one yet. */
export function vaultPaths(): VaultPaths {
  const config = getVaultConfig();
  if (!config) throw new Error('No vault yet');
  return pathsFor(config.location, config.name);
}

async function moveIfPresent(from: string, to: string): Promise<void> {
  if ((await RNFS.exists(from)) && !(await RNFS.exists(to))) await RNFS.moveFile(from, to);
}

/**
 * Create the vault folders, move any pre-vault data (database + WAL files, model) into it,
 * write a small manifest, then remember it. Must run before the database is opened.
 */
export async function createVault(name: string, location: VaultLocation): Promise<VaultConfig> {
  const paths = pathsFor(location, name);
  for (const dir of [paths.root, paths.db, paths.models, paths.media]) await RNFS.mkdir(dir);

  for (const suffix of ['', '-wal', '-shm']) {
    await moveIfPresent(`${LEGACY.dbDir}/${LEGACY.dbName}${suffix}`, `${paths.db}/${LEGACY.dbName}${suffix}`);
  }
  await moveIfPresent(LEGACY.model, `${paths.models}/qwen-q4_k_m.gguf`);

  const config: VaultConfig = {name: name.trim() || 'Vault', location, createdAt: new Date().toISOString()};
  await RNFS.writeFile(`${paths.root}/vault.json`, JSON.stringify({app: 'Capture', ...config}, null, 2), 'utf8');
  Storage.setItemSync(KEY, JSON.stringify(config));
  return config;
}
