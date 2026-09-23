import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {useState} from 'react';
import {Pressable, Text, View} from 'react-native';

import {
  getBehaviorIncludedHint,
  getBehaviorLabel,
  getBehaviorsForTypeUI,
  getDefaultBehaviorsForType,
} from '@/domain/behaviorTypeConfig';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

type FieldProps = {
  label: string;
  children: ReactNode;
};

export function FormField({label, children}: FieldProps) {
  return (
    <View style={{gap: 8, marginBottom: 16}}>
      <Text
        style={{
          color: designTokens.textTertiary,
          fontSize: 12,
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: 0.4,
        }}>
        {label}
      </Text>
      {children}
    </View>
  );
}

type DropdownProps<T extends string> = {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  renderLabel?: (value: T) => string;
};

export function SimpleDropdown<T extends string>({
  value,
  options,
  onChange,
  renderLabel = v => v,
}: DropdownProps<T>) {
  const {theme} = useThemeStore();
  const {colors, rounded} = theme;
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Pressable
        onPress={() => setOpen(v => !v)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceContainer,
          borderRadius: rounded.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
        }}>
        <Text style={{color: colors.onSurface, fontSize: 16}}>
          {renderLabel(value)}
        </Text>
        <Ionicons
          name={open ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.onSurfaceVariant}
        />
      </Pressable>
      {open ? (
        <View
          style={{
            marginTop: 4,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceContainer,
            borderRadius: rounded.md,
            overflow: 'hidden',
          }}>
          {options.map(opt => {
            const selected = opt === value;
            return (
              <Pressable
                key={opt}
                onPress={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: selected
                    ? designTokens.accentMuted
                    : 'transparent',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}>
                <Text
                  style={{
                    color: colors.onSurface,
                    fontSize: 15,
                    fontWeight: selected ? '600' : '400',
                  }}>
                  {renderLabel(opt)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

type PriorityPickerProps = {
  importance: number | null;
  urgency: number | null;
  onImportanceChange: (value: number | null) => void;
  onUrgencyChange: (value: number | null) => void;
};

const LEVELS = [1, 2, 3, 4, 5] as const;

function ScoreRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const {theme} = useThemeStore();
  const {colors} = theme;

  return (
    <View style={{gap: 8}}>
      <Text style={{color: colors.onSurfaceVariant, fontSize: 13}}>
        {label}
      </Text>
      <View style={{flexDirection: 'row', gap: 6, alignItems: 'center'}}>
        <Pressable
          onPress={() => onChange(null)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: value == null ? designTokens.accent : colors.border,
            backgroundColor:
              value == null ? designTokens.accentMuted : 'transparent',
          }}>
          <Text style={{color: colors.onSurface, fontSize: 13}}>—</Text>
        </Pressable>
        {LEVELS.map(level => {
          const active = value === level;
          return (
            <Pressable
              key={level}
              onPress={() => onChange(level)}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: active ? designTokens.accent : colors.border,
                backgroundColor: active
                  ? designTokens.accentMuted
                  : 'transparent',
              }}>
              <Text
                style={{
                  color: colors.onSurface,
                  fontSize: 13,
                  fontWeight: active ? '700' : '400',
                }}>
                {level}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function PriorityPicker({
  importance,
  urgency,
  onImportanceChange,
  onUrgencyChange,
}: PriorityPickerProps) {
  return (
    <View style={{gap: 12}}>
      <ScoreRow
        label="Importance"
        value={importance}
        onChange={onImportanceChange}
      />
      <ScoreRow label="Urgency" value={urgency} onChange={onUrgencyChange} />
    </View>
  );
}

type BehaviorCheckboxProps = {
  behaviorName: string;
  checked: boolean;
  locked?: boolean;
  onToggle: () => void;
};

export function BehaviorCheckbox({
  behaviorName,
  checked,
  locked,
  onToggle,
}: BehaviorCheckboxProps) {
  const {theme} = useThemeStore();
  const {colors} = theme;

  return (
    <Pressable
      onPress={locked ? undefined : onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 8,
        opacity: locked ? 0.7 : 1,
      }}>
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 4,
          borderWidth: 1.5,
          borderColor: checked ? designTokens.accent : colors.border,
          backgroundColor: checked ? designTokens.accent : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {checked ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
      </View>
      <Text style={{color: colors.onSurface, fontSize: 15, flex: 1}}>
        {getBehaviorLabel(behaviorName)}
      </Text>
      {locked ? (
        <Text style={{color: colors.onSurfaceVariant, fontSize: 11}}>
          {getBehaviorIncludedHint(behaviorName)}
        </Text>
      ) : null}
    </Pressable>
  );
}

type BehaviorCheckboxListProps = {
  typeName: string;
  optionalBehaviors: string[];
  onToggleOptional: (name: string) => void;
};

export function BehaviorCheckboxList({
  typeName,
  optionalBehaviors,
  onToggleOptional,
}: BehaviorCheckboxListProps) {
  const defaultBehaviors = getDefaultBehaviorsForType(typeName);
  const visibleBehaviors = getBehaviorsForTypeUI(typeName);
  const defaults = new Set(defaultBehaviors);
  const optional = new Set(optionalBehaviors);

  return (
    // eslint-disable-next-line react/react-in-jsx-scope
    <View>
      {visibleBehaviors.map(name => {
        const isDefault = defaults.has(name);
        const checked = isDefault || optional.has(name);
        return (
          // eslint-disable-next-line react/react-in-jsx-scope
          <BehaviorCheckbox
            key={name}
            behaviorName={name}
            checked={checked}
            locked={isDefault}
            onToggle={() => onToggleOptional(name)}
          />
        );
      })}
    </View>
  );
}
