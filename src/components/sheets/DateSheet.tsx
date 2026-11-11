import moment from 'moment';
import {useState} from 'react';
import DateTimePicker, {DateTimePickerAndroid} from '@react-native-community/datetimepicker';
import {Platform, Text, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {Pressable} from '@/ui/HapticPressable';
import {Divider, PrimaryButton, PropertyRow} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

type DateSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Receives YYYY-MM-DD, or a local ISO datetime when a time was picked. */
  onSelect: (date: string) => void;
  onClear?: () => void;
  /** Let the custom picker choose a time too. */
  withTime?: boolean;
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
export function DateSheet({visible, onClose, onSelect, onClear, withTime = false}: DateSheetProps) {
  const [custom, setCustom] = useState(() => new Date());
  const [customOpen, setCustomOpen] = useState(false);
  /** iOS with time: a preset day was tapped, the inline picker now asks for its time. */
  const [timeFor, setTimeFor] = useState<moment.Moment | null>(null);
  const presets = buildPresets();

  function choose(date: moment.Moment) {
    setTimeFor(null);
    onSelect(date.format('YYYY-MM-DD'));
    onClose();
  }

  /** With time: a preset day, then its time (cancel / "No time" = the day only). */
  function choosePreset(day: moment.Moment) {
    if (!withTime) return choose(day);
    const start = day.clone().hours(Math.min(23, moment().hours() + 1)).minutes(0).toDate();
    if (Platform.OS === 'ios') {
      setCustomOpen(false);
      setCustom(start);
      return setTimeFor(day);
    }
    DateTimePickerAndroid.open({
      value: start,
      mode: 'time',
      onChange: (event, time) => (event.type === 'set' && time ? chooseCustom(time) : choose(day)),
    });
  }

  function chooseCustom(date: Date) {
    setCustomOpen(false);
    setTimeFor(null);
    if (!withTime) return choose(moment(date));
    onSelect(moment(date).seconds(0).format());
    onClose();
  }

  function openCustom() {
    if (Platform.OS === 'ios') {
      setTimeFor(null);
      return setCustomOpen((open) => !open);
    }
    // Android has no combined picker: date dialog, then time dialog.
    DateTimePickerAndroid.open({
      value: custom,
      mode: 'date',
      onChange: (event, date) => {
        if (event.type !== 'set' || !date) return;
        if (!withTime) return chooseCustom(date);
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          onChange: (timeEvent, time) => {
            if (timeEvent.type === 'set' && time) chooseCustom(time);
          },
        });
      },
    });
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
              onPress={() => choosePreset(preset.value)}
            />
            <Divider />
          </View>
        ))}

        <PropertyRow
          icon="calendar-outline"
          title={withTime ? 'Custom date & time' : 'Custom date'}
          onPress={openCustom}
        />

        {timeFor ? (
          <View style={{gap: 12, paddingBottom: 8, alignItems: 'center'}}>
            <DateTimePicker value={custom} mode="time" display="spinner" themeVariant="dark" onChange={(_, date) => date && setCustom(date)} />
            <PrimaryButton label={`Set time · ${timeFor.format('ddd, MMM D')}`} onPress={() => chooseCustom(custom)} style={{alignSelf: 'stretch'}} />
            <Pressable onPress={() => choose(timeFor)} style={{paddingVertical: 8}}>
              <Text style={{color: designTokens.textSecondary, fontSize: 15}}>No time</Text>
            </Pressable>
          </View>
        ) : null}

        {customOpen ? (
          <View style={{gap: 12, paddingBottom: 8, alignItems: 'center'}}>
            <DateTimePicker
              value={custom}
              mode={withTime ? 'datetime' : 'date'}
              display="spinner"
              themeVariant="dark"
              onChange={(_, date) => date && setCustom(date)}
            />
            <PrimaryButton
              label={withTime ? 'Set date & time' : 'Set date'}
              onPress={() => chooseCustom(custom)}
              style={{alignSelf: 'stretch'}}
            />
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
