import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

const KEY = 'profile';

/** `photo` is a file name inside the vault's media folder (relative, so it survives container moves). */
export type Profile = {name: string; avatar: string; photo?: string};

function load(): Profile {
  try {
    return {name: '', avatar: '', photo: undefined, ...JSON.parse(Storage.getItemSync(KEY) ?? '{}')};
  } catch {
    return {name: '', avatar: ''};
  }
}

/** Name + avatar (an emoji or a letter), kept on the device. */
export const useProfileStore = create<Profile & {update: (p: Profile) => void}>(set => ({
  ...load(),
  update: profile => {
    const clean = {name: profile.name.trim(), avatar: profile.avatar.trim(), photo: profile.photo};
    Storage.setItemSync(KEY, JSON.stringify(clean));
    set(clean);
  },
}));

/** What to show in the avatar circle: chosen emoji/letter, else the name's initial. */
export function avatarText({name, avatar}: Profile): string {
  return avatar || name.charAt(0).toUpperCase();
}
