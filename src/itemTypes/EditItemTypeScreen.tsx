import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useState} from 'react';
import {Alert, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {getBehaviorLabel} from '@/domain/behaviorTypeConfig';
import {BEHAVIOR_FIELDS} from '@/behaviors';
import {PrimaryButton} from '@/ui/components/Primitives';
import {SelectField} from '@/ui/components/SelectField';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {countItemsOfType, deleteItemType, saveItemType} from './service';
import {useItemTypesStore} from './store';

type Mode = 'off' | 'optional' | 'always';

// Core behaviors are on/off only; every behavior with a form field (src/behaviors/fields.ts) is listed
// automatically, so new behaviors show up here without touching this screen.
const MANAGEABLE: {
  name: string;
  needsDoable?: boolean;
  alwaysOnly?: boolean;
}[] = [
  {name: 'Doable', alwaysOnly: true},
  {name: 'Notable', alwaysOnly: true},
  ...BEHAVIOR_FIELDS.map(b => ({name: b.behavior, needsDoable: b.needsDoable})),
];

const MODE_LABEL: Record<Mode, string> = {
  off: 'Off',
  optional: 'Optional',
  always: 'Always',
};

const iconLabel = (name: string) =>
  name.replace(/-outline$/, '').replace(/-/g, ' ');

const ICONS = [
  'ellipse-outline',
  'checkmark-circle-outline',
  'document-text-outline',
  'book-outline',
  'bulb-outline',
  'barbell-outline',
  'cart-outline',
  'cash-outline',
  'briefcase-outline',
  'home-outline',
  'heart-outline',
  'airplane-outline',
  'school-outline',
  'restaurant-outline',
  'medkit-outline',
  'musical-notes-outline',
  'film-outline',
  'code-slash-outline',
  'people-outline',
  'leaf-outline',
] as const;

const field = {
  backgroundColor: designTokens.field,
  borderRadius: radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: designTokens.textPrimary,
  fontSize: 16,
};

function Label({children}: {children: string}) {
  return (
    <Text
      style={{
        color: designTokens.textSecondary,
        fontSize: 13,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
      }}>
      {children}
    </Text>
  );
}

/** Create or edit an item type: name, icon, description and which behaviors it has. */
export function EditItemTypeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {id} = useLocalSearchParams<{id?: string}>();
  const types = useItemTypesStore(state => state.types);
  const existing = id ? types.find(t => t.id === Number(id)) : undefined;
  const locked = Boolean(existing?.isSystem);

  const [name, setName] = useState(existing?.name ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const originalKeywords = (existing?.keywords ?? []).join(', ');
  const [keywords, setKeywords] = useState(originalKeywords);
  const [icon, setIcon] = useState<string | null>(existing?.icon ?? null);
  const [modes, setModes] = useState<Record<string, Mode>>(() =>
    Object.fromEntries(
      MANAGEABLE.map(b => [
        b.name,
        existing?.defaults.includes(b.name)
          ? 'always'
          : existing?.optional.includes(b.name)
          ? 'optional'
          : 'off',
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);

  function setMode(behavior: string, mode: Mode) {
    setModes(prev => {
      const next = {...prev, [behavior]: mode};
      const def = MANAGEABLE.find(b => b.name === behavior);
      // Repeat/reminders need a due date, so they bring Doable along.
      if (mode !== 'off' && def?.needsDoable && next.Doable === 'off')
        next.Doable = 'always';
      if (behavior === 'Doable' && mode === 'off') {
        for (const b of MANAGEABLE) if (b.needsDoable) next[b.name] = 'off';
      }
      return next;
    });
  }

  const nameTaken = types.some(
    t =>
      t.name.toLowerCase() === name.trim().toLowerCase() &&
      t.id !== existing?.id,
  );

  async function save() {
    setSaving(true);
    try {
      await saveItemType({
        id: existing?.id,
        name,
        description,
        icon,
        // Keywords left as they were but name/description changed → clear so they regenerate on next capture.
        keywords:
          keywords === originalKeywords &&
          (name.trim() !== (existing?.name ?? '') ||
            description.trim() !== (existing?.description ?? ''))
            ? []
            : keywords.split(','),
        defaults: MANAGEABLE.filter(b => modes[b.name] === 'always').map(
          b => b.name,
        ),
        // Keep any optional behaviors this screen doesn't manage.
        optional: [
          ...MANAGEABLE.filter(b => modes[b.name] === 'optional').map(
            b => b.name,
          ),
          ...(existing?.optional ?? []).filter(
            b => !MANAGEABLE.some(m => m.name === b),
          ),
        ],
      });
      router.back();
    } catch (err) {
      Alert.alert(
        'Could not save type',
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    const count = await countItemsOfType(existing.id);
    const fallback = types.find(
      t => t.name === (existing.defaults.includes('Doable') ? 'Task' : 'Note'),
    );
    const doDelete = async () => {
      await deleteItemType(existing.id, fallback!.id);
      router.back();
    };
    Alert.alert(
      `Delete "${existing.name}"?`,
      count
        ? `${count} item${count === 1 ? '' : 's'} will become ${
            fallback?.name
          }s.`
        : 'No items use this type.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Delete', style: 'destructive', onPress: doDelete},
      ],
    );
  }

  return (
    <ScreenShell
      title={existing ? existing.name : 'New type'}
      leading="back"
      right={
        existing && !locked ? (
          <Pressable
            onPress={remove}
            hitSlop={12}
            accessibilityLabel="Delete type">
            <Ionicons
              name="trash-outline"
              size={22}
              color={designTokens.textPrimary}
            />
          </Pressable>
        ) : undefined
      }>
      <ScrollView
        contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 24}}
        keyboardShouldPersistTaps="handled">
        <Label>Name</Label>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={!locked}
          placeholder="e.g. Workout, Bill, Recipe"
          placeholderTextColor={designTokens.textTertiary}
          style={[field, locked && {opacity: 0.5}]}
        />
        {nameTaken ? (
          <Text
            style={{
              color: designTokens.textTertiary,
              fontSize: 12,
              marginTop: 6,
            }}>
            A type with this name already exists.
          </Text>
        ) : null}

        <Label>Description</Label>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What goes here? Helps capture sort things later."
          placeholderTextColor={designTokens.textTertiary}
          style={field}
        />

        <Label>Keywords</Label>
        <TextInput
          value={keywords}
          onChangeText={setKeywords}
          placeholder="Filled in automatically on your next capture"
          placeholderTextColor={designTokens.textTertiary}
          autoCapitalize="none"
          multiline
          style={[field, {minHeight: 64, textAlignVertical: 'top'}]}
        />

        <Label>Icon</Label>
        <SelectField
          title="Icon"
          options={ICONS.map(name => ({
            label: iconLabel(name),
            value: name,
            icon: name,
          }))}
          value={icon ?? ''}
          onChange={setIcon}
        />

        <Label>Behaviors</Label>
        <View style={{gap: 10}}>
          {MANAGEABLE.map(b => {
            const lockedDefault = locked && existing?.defaults.includes(b.name);
            const options: Mode[] = lockedDefault
              ? ['always']
              : b.alwaysOnly
              ? locked
                ? ['off']
                : ['off', 'always']
              : ['off', 'optional', ...(locked ? [] : (['always'] as Mode[]))];
            return (
              <View key={b.name} style={{gap: 6}}>
                <Text style={{color: designTokens.textPrimary, fontSize: 14}}>
                  {getBehaviorLabel(b.name)}
                </Text>
                <SelectField
                  title={getBehaviorLabel(b.name)}
                  options={options.map(o => ({label: MODE_LABEL[o], value: o}))}
                  value={modes[b.name]}
                  onChange={o => setMode(b.name, o as Mode)}
                />
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: insets.bottom + 8,
          borderTopWidth: 1,
          borderTopColor: designTokens.divider,
        }}>
        <PrimaryButton
          compact
          label="Save"
          loading={saving}
          disabled={!name.trim() || nameTaken}
          onPress={save}
        />
      </View>
    </ScreenShell>
  );
}
