import type {ReactNode} from 'react';
import {View} from 'react-native';

import {Appear, BULK_SLIDE_MS, SlideOut, STAGGER_MS} from '@/motion';
import {radius} from '@/ui/designTokens';

import {useSelectionStore, type SelectedItem} from './store';
import {useSelectable} from './useSelectable';

const SELECTED_TINT = 'rgba(255, 255, 255, 0.14)';

/**
 * Paints a medium-grey tint over a selected row (no border).
 * `bleed` widens it past the content for edge-to-edge text rows; cards use 0 so it matches the card.
 */
export function SelectionTint({selected, bleed = 0, children}: {selected: boolean; bleed?: number; children: ReactNode}) {
  return (
    <View>
      {children}
      {selected ? (
        <Appear
          duration={160}
          style={{position: 'absolute', top: 0, left: -bleed, right: -bleed, bottom: 0, borderRadius: bleed ? radius.md : radius.lg, backgroundColor: SELECTED_TINT, pointerEvents: 'none'}}>
          {null}
        </Appear>
      ) : null}
    </View>
  );
}

type SelectableProps = {
  item: SelectedItem;
  onOpen: () => void;
  bleed?: number;
  children: (handlers: {onPress: () => void; onLongPress: () => void}) => ReactNode;
};

/** Wrap any row: gives it long-press-to-select, tap-to-toggle while selecting, and the tint. */
export function Selectable({item, onOpen, bleed, children}: SelectableProps) {
  const {selected, onPress, onLongPress} = useSelectable(item, onOpen);
  const leavingAt = useSelectionStore(state => state.leaving[item.id]);
  return (
    <SlideOut out={leavingAt !== undefined} delay={(leavingAt ?? 0) * STAGGER_MS} duration={BULK_SLIDE_MS}>
      <SelectionTint selected={selected} bleed={bleed}>
        {children({onPress, onLongPress})}
      </SelectionTint>
    </SlideOut>
  );
}
