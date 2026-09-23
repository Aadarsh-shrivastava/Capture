import { Pressable, Text, TextInput, View } from 'react-native';

import type { BehaviorFieldDef } from '@/domain/behaviorDefinitions';
import { getBehaviorDefinition } from '@/domain/behaviorDefinitions';
import { getBehaviorFormTitle } from '@/domain/behaviorTypeConfig';
import { designTokens } from '@/ui/designTokens';
import { formatDateTimeForDisplay, parseDateTimeInput } from '@/ui/formatDateTime';

type BehaviorFormRendererProps = {
  behaviorName: string;
  values: Record<string, string>;
  onChange: (field: string, value: string) => void;
};

function FieldControl({
  field,
  value,
  onChange,
}: {
  field: BehaviorFieldDef;
  value: string;
  onChange: (value: string) => void;
}) {
  if (field.input === 'select' && field.options) {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {field.options.map((option) => {
          const active = value === option.value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={{
                borderWidth: 1,
                borderColor: active ? designTokens.accent : designTokens.surfaceBorder,
                backgroundColor: active ? designTokens.accentMuted : 'transparent',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: active ? designTokens.textPrimary : designTokens.textSecondary, fontSize: 13 }}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  const isDateTime = field.input === 'datetime';
  const displayValue = isDateTime ? formatDateTimeForDisplay(value) : value;

  return (
    <TextInput
      value={displayValue}
      onChangeText={(text) => onChange(isDateTime ? parseDateTimeInput(text) : text)}
      placeholder={field.placeholder}
      placeholderTextColor={designTokens.textTertiary}
      keyboardType={field.input === 'number' ? 'numeric' : field.input === 'url' ? 'url' : 'default'}
      autoCapitalize={field.input === 'url' ? 'none' : 'sentences'}
      style={{
        color: designTokens.textPrimary,
        fontSize: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
        paddingVertical: 10,
      }}
    />
  );
}

export function BehaviorFormRenderer({ behaviorName, values, onChange }: BehaviorFormRendererProps) {
  const definition = getBehaviorDefinition(behaviorName);
  if (!definition || definition.fields.length === 0) return null;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: designTokens.surfaceBorder,
        borderRadius: 10,
        padding: 14,
        marginBottom: 12,
        backgroundColor: designTokens.surfaceRaised,
      }}
    >
      <Text
        style={{
          color: designTokens.textSecondary,
          fontSize: 12,
          fontWeight: '600',
          letterSpacing: 0.8,
          marginBottom: 12,
          textTransform: 'uppercase',
        }}
      >
        {getBehaviorFormTitle(behaviorName)}
      </Text>
      {definition.fields.map((field) => (
        <View key={field.name} style={{ marginBottom: 12 }}>
          <Text style={{ color: designTokens.textTertiary, fontSize: 13, marginBottom: 6 }}>
            {field.label}
            {field.required ? ' *' : ''}
          </Text>
          <FieldControl
            field={field}
            value={values[field.name] ?? ''}
            onChange={(next) => onChange(field.name, next)}
          />
        </View>
      ))}
    </View>
  );
}

type BehaviorFormsProps = {
  behaviorNames: string[];
  behaviorData: Record<string, Record<string, string>>;
  onFieldChange: (behaviorName: string, field: string, value: string) => void;
};

export function BehaviorForms({ behaviorNames, behaviorData, onFieldChange }: BehaviorFormsProps) {
  return (
    <>
      {behaviorNames.map((name) => (
        <BehaviorFormRenderer
          key={name}
          behaviorName={name}
          values={behaviorData[name] ?? {}}
          onChange={(field, value) => onFieldChange(name, field, value)}
        />
      ))}
    </>
  );
}
