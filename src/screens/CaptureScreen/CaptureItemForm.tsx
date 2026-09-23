import {Text, TextInput, View} from 'react-native';

import {type CaptureItemDraft} from '@/capture/captureItemDraft';
import {getDefaultFieldValues} from '@/domain/behaviorDefinitions';
import {filterValidOptionalBehaviors} from '@/domain/behaviorTypeConfig';
import {ItemTypePicker} from '@/ui/components/ItemComponents';
import {BehaviorFormRenderer} from '@/ui/components/BehaviorFormRenderer';
import {FormField, PriorityPicker} from '@/ui/components/SimpleFormFields';
import {type ItemTypeName} from '@/ui/itemTypeConfig';
import {designTokens} from '@/ui/designTokens';
import {useThemeStore} from '@/store/themeStore';

type Props = {
  draft: CaptureItemDraft;
  onChange: (draft: CaptureItemDraft) => void;
};

export function CaptureItemForm({draft, onChange}: Props) {
  const {theme} = useThemeStore();
  const {colors, rounded} = theme;
  const isTask = draft.typeName === 'Task';

  const doableValues = {
    ...getDefaultFieldValues('Doable'),
    ...(draft.behaviorData?.Doable ?? {}),
  };

  function setTypeName(typeName: ItemTypeName) {
    const optional = filterValidOptionalBehaviors(typeName, draft.optionalBehaviorNames ?? []);
    onChange({...draft, typeName, optionalBehaviorNames: optional});
  }

  function setDoableField(field: string, value: string) {
    onChange({
      ...draft,
      behaviorData: {
        ...draft.behaviorData,
        Doable: {
          ...doableValues,
          [field]: value,
        },
      },
    });
  }

  return (
    <View style={{gap: 4}}>
      <FormField label="Type">
        <ItemTypePicker value={draft.typeName} onChange={setTypeName} />
      </FormField>

      <FormField label="Title">
        <TextInput
          value={draft.title}
          onChangeText={title => onChange({...draft, title})}
          placeholder="Title"
          placeholderTextColor={colors.placeholder}
          style={{
            color: colors.onSurface,
            fontSize: 20,
            fontWeight: '600',
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            paddingVertical: 8,
          }}
        />
      </FormField>

      <FormField label="Notes">
        <TextInput
          value={draft.content ?? ''}
          onChangeText={content => onChange({...draft, content: content || null})}
          placeholder="Optional details"
          placeholderTextColor={colors.placeholder}
          multiline
          style={{
            color: colors.onSurface,
            fontSize: 15,
            lineHeight: 22,
            minHeight: 72,
            textAlignVertical: 'top',
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surfaceContainer,
            borderRadius: rounded.md,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        />
      </FormField>

      {isTask ? (
        <>
          <FormField label="Priority">
            <PriorityPicker
              importance={draft.importance ?? null}
              urgency={draft.urgency ?? null}
              onImportanceChange={importance => onChange({...draft, importance})}
              onUrgencyChange={urgency => onChange({...draft, urgency})}
            />
          </FormField>

          <BehaviorFormRenderer
            behaviorName="Doable"
            values={doableValues}
            onChange={setDoableField}
          />

          <FormField label="Tags">
            <TextInput
              value={(draft.tagNames ?? []).join(', ')}
              onChangeText={text =>
                onChange({
                  ...draft,
                  tagNames: text
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(Boolean),
                })
              }
              placeholder="comma separated"
              placeholderTextColor={colors.placeholder}
              style={{
                color: colors.onSurface,
                fontSize: 15,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.surfaceContainer,
                borderRadius: rounded.md,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            />
          </FormField>
        </>
      ) : null}

      {!draft.title.trim() ? (
        <Text style={{color: designTokens.textTertiary, fontSize: 12}}>Title is required to submit.</Text>
      ) : null}
    </View>
  );
}
