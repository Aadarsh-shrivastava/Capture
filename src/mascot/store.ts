import Storage from 'expo-sqlite/kv-store';
import {create} from 'zustand';

import {CHARACTERS, type CharacterKey} from './characters';

const KEY = 'mascot.character';

function stored(): CharacterKey {
  const value = Storage.getItemSync(KEY);
  return value && value in CHARACTERS ? (value as CharacterKey) : 'male';
}

/** Which character the app shows; chosen in onboarding or Edit profile. */
export const useMascotStore = create<{character: CharacterKey; setCharacter: (c: CharacterKey) => void}>(set => ({
  character: stored(),
  setCharacter: character => {
    Storage.setItemSync(KEY, character);
    set({character});
  },
}));
