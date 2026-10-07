import moment from 'moment';
import {useState} from 'react';
import {Platform, Text, TextInput, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {Pressable} from '@/ui/HapticPressable';
import {Divider, PrimaryButton, PropertyRow} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';

type DateSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Receives YYYY-MM-DD. */
  onSelect: (date: string) => void;
  onClear?: () => void;
};

type Preset = {
  label: string;
  value: moment.Moment;
};

function buildPresets(): Preset[] {
  const today = moment().startOf('day');
  const weekend = today.clone().day(today.day() === 0 ? 6 : 6);
  const nextWeek = today.clone().add(1, 'week').startOf('isoWeek');

  return [
    {label: 'Today', value: today},
    {label: 'Tomorrow', value: today.clone().add(1, 'day')},
    {label: 'This weekend', value: weekend.isBefore(today) ? weekend.add(1, 'week') : weekend},
    {label: 'Next week', value: nextWeek},
  ];
}

/** Date picker sheet — presets plus a custom date field. */
export function DateSheet({visible, onClose, onSelect, onClear}: DateSheetProps) {
  const [custom, setCustom] = useState('');
  const [customOpen, setCustomOpen] = useState(false);
  const presets = buildPresets();

  function choose(date: moment.Moment) {
    onSelect(date.format('YYYY-MM-DD'));
    onClose();
  }

  function applyCustom() {
    const parsed = moment(custom.trim(), ['YYYY-MM-DD', 'MMM D YYYY', 'MMM D', 'D MMM YYYY', 'D MMM'], false);
    if (!parsed.isValid()) return;
    choose(parsed);
    setCustom('');
    setCustomOpen(false);
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Date & time">
      <View style={{paddingHorizontal: 20, paddingBottom: 8}}>
        {presets.map((preset, index) => (
          <View key={preset.label}>
            <PropertyRow
              icon={index === 1 ? 'time-outline' : 'calendar-outline'}
              title={preset.label}
              value={preset.value.format('ddd, MMM D')}
              chevron={false}
              onPress={() => choose(preset.value)}
            />
            <Divider />
          </View>
        ))}

        <PropertyRow
          icon="calendar-outline"
          title="Custom date"
          onPress={() => setCustomOpen((open) => !open)}
        />

        {customOpen ? (
          <View style={{gap: 12, paddingBottom: 8}}>
            <TextInput
              value={custom}
              onChangeText={setCustom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={designTokens.textTertiary}
              autoCapitalize="none"
              autoFocus={Platform.OS === 'ios'}
              style={{
                backgroundColor: designTokens.field,
                borderRadius: radius.md,
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: designTokens.textPrimary,
                fontSize: 16,
              }}
            />
            <PrimaryButton label="Set date" onPress={applyCustom} disabled={!custom.trim()} />
          </View>
        ) : null}

        {onClear ? (
          <Pressable
            onPress={() => {
              onClear();
              onClose();
            }}
            style={{alignItems: 'center', paddingVertical: 16}}>
            <Text style={{color: designTokens.textSecondary, fontSize: 15}}>Remove date</Text>
          </Pressable>
        ) : null}
      </View>
    </Sheet>
  );
}
