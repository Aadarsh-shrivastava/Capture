import {create} from 'zustand';

/** Something asked the input bar to start typing or listening (widget, Siri link, pull-to-capture, a group). */
export type ComposerRequest = {id: number; mode: 'type' | 'voice'; text?: string; groupName?: string};

type CaptureState = {
  request: ComposerRequest | null;
  /** Focus the input bar, optionally with text already in it (and the group the thought belongs to). */
  openTextCapture: (initialText?: string, groupName?: string) => void;
  /** Start listening in the input bar. */
  openVoiceCapture: () => void;
  clearRequest: () => void;
};

let nextId = 1;

/** There are no capture screens: every way in just points the input bar at typing or listening. */
export const useCaptureStore = create<CaptureState>(set => ({
  request: null,
  openTextCapture: (text = '', groupName) => set({request: {id: nextId++, mode: 'type', text, groupName}}),
  openVoiceCapture: () => set({request: {id: nextId++, mode: 'voice'}}),
  clearRequest: () => set({request: null}),
}));
