import * as ImagePicker from 'expo-image-picker';
import RNFS from 'react-native-fs';

import {vaultPaths} from '@/vault';

/** Absolute file URI for a stored photo name, or null. */
export function photoUri(photo?: string): string | null {
  if (!photo) return null;
  try {
    return `file://${vaultPaths().media}/${photo}`;
  } catch {
    return null; // no vault yet (onboarding)
  }
}

/**
 * Let the user pick a square photo, copy it into the vault's media folder and return its file name.
 * The previous photo is deleted. Returns null if they cancel.
 */
export async function pickProfilePhoto(previous?: string): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled || !result.assets[0]) return null;

  const media = vaultPaths().media;
  const name = `avatar-${Date.now()}.jpg`; // new name each time so cached images don't stick
  await RNFS.mkdir(media);
  await RNFS.copyFile(result.assets[0].uri.replace(/^file:\/\//, ''), `${media}/${name}`);
  if (previous) await RNFS.unlink(`${media}/${previous}`).catch(() => {});
  return name;
}
