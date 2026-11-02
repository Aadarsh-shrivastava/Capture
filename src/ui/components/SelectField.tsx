import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {ScrollView, Text, View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {OptionsSheet, type SheetOption} from '@/components/sheets/OptionsSheet';
import {Divider, PrimaryButton} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

type RowProps = {
  icon?: keyof typeof Ionicons.glyphMap;
  text: string;
  placeholder?: boolean;
  onPress: () => void;
};

/** Field-looking row showing the current choice; tapping opens a sheet. */
export function SelectRow({icon, text, placeholder, onPress}: RowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: designTokens.field,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 14,
      }}>
      {icon ? <Ionicons name={icon} size={18} color={designTokens.textSecondary} /> : null}
      <Text numberOfLines={1} style={{flex: 1, color: placeholder ? designTokens.textTertiary : designTokens.textPrimary, fontSize: 16}}>
        {text}
      </Text>
      <Ionicons name="chevron-down" size={16} color={designTokens.textTertiary} />
    </Pressable>
  );
}

type SelectProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  options: SheetOption[];
  value: string;
  onChange: (value: string) => void;
};

/** Single choice via bottom sheet. */
export function SelectField({title, icon, options, value, onChange}: SelectProps) {
  const [open, setOpen] = useState(false);
  const current = options.find(o => o.value === value);
  return (
    <>
      <SelectRow icon={current?.icon ?? icon} text={current?.label ?? title} placeholder={!current} onPress={() => setOpen(true)} />
      <OptionsSheet visible={open} onClose={() => setOpen(false)} title={title} options={options} value={value} onSelect={onChange} />
    </>
  );
}

type MultiProps = {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  options: SheetOption[];
  values: string[];
  onChange: (values: string[]) => void;
  /** Row text when nothing is picked. */
  emptyText: string;
};

/** Multiple choice via bottom sheet (stays open; Done closes). */
export function MultiSelectField({title, icon, options, values, onChange, emptyText}: MultiProps) {
  const [open, setOpen] = useState(false);
  const picked = options.filter(o => values.includes(o.value));
  const toggle = (v: string) => onChange(values.includes(v) ? values.filter(x => x !== v) : [...values, v]);

  return (
    <>
      <SelectRow
        icon={icon}
        text={picked.length ? picked.map(o => o.label).join(', ') : emptyText}
        placeholder={!picked.length}
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={title}>
        <ScrollView style={{maxHeight: 420}} contentContainerStyle={{paddingHorizontal: 20}}>
          {options.map((option, index) => {
            const active = values.includes(option.value);
            return (
              <View key={option.value}>
                <Pressable
                  onPress={() => toggle(option.value)}
                  accessibilityRole="checkbox"
                  accessibilityState={{checked: active}}
                  style={{flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16}}>
                  {option.icon ? <Ionicons name={option.icon} size={20} color={designTokens.textSecondary} /> : null}
                  <Text style={{flex: 1, color: designTokens.textPrimary, fontSize: 16}}>{option.label}</Text>
                  <Ionicons name={active ? 'checkbox' : 'square-outline'} size={20} color={designTokens.textSecondary} />
                </Pressable>
                {index < options.length - 1 ? <Divider /> : null}
              </View>
            );
          })}
        </ScrollView>
        <View style={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12}}>
          <PrimaryButton compact label="Done" onPress={() => setOpen(false)} />
        </View>
      </Sheet>
    </>
  );
}
