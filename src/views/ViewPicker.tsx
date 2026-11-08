import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {Text} from 'react-native';

import {DateSheet} from '@/components/sheets/DateSheet';
import {OptionsSheet} from '@/components/sheets/OptionsSheet';
import {designTokens, typeScale} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {useCurrentView} from './current';
import {VIEWS, type ViewKey} from './registry';
import {useViewStore} from './store';

/** Header title "Today ▾" — opens a sheet to switch Today / Tomorrow / This week / This month / a custom date. */
export function ViewPicker() {
  const view = useCurrentView();
  const setView = useViewStore(state => state.setView);
  const setDay = useViewStore(state => state.setDay);
  const [open, setOpen] = useState(false);
  const [dayOpen, setDayOpen] = useState(false);
  return (
    <>
      <Pressable onPress={() => setOpen(true)} hitSlop={10} accessibilityRole="button" style={{flexDirection: 'row', alignItems: 'center', gap: 4}}>
        <Text style={{...typeScale.sheetTitle, color: designTokens.textPrimary}}>{view.label}</Text>
        <Ionicons name="chevron-down" size={14} color={designTokens.textTertiary} />
      </Pressable>
      <OptionsSheet
        visible={open}
        onClose={() => setOpen(false)}
        title="View"
        value={view.key}
        options={VIEWS.map(v => ({label: v.label, value: v.key, icon: v.icon}))}
        onSelect={key => (key === 'custom' ? setDayOpen(true) : setView(key as ViewKey))}
      />
      <DateSheet visible={dayOpen} onClose={() => setDayOpen(false)} onSelect={setDay} />
    </>
  );
}
