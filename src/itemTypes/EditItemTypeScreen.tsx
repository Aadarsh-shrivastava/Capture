import {Ionicons} from '@expo/vector-icons';
import {useLocalSearchParams, useRouter} from 'expo-router';
import {useState} from 'react';
import {Alert, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {getBehaviorLabel} from '@/domain/behaviorTypeConfig';
import {PrimaryButton, SelectChip} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {countItemsOfType, deleteItemType, saveItemType} from './service';
import {useItemTypesStore} from './store';

type Mode = 'off' | 'optional' | 'always';

// ponytail: only behaviors with working UI/logic are offered; add others here once they do something.
const MANAGEABLE: {name: string; hint: string; needsDoable?: boolean; alwaysOnly?: boolean}[] = [
  {name: 'Doable', hint: 'Due date, completion, Focus and reminders', alwaysOnly: true},
  {name: 'Notable', hint: 'Main text is the body (notes, journals)', alwaysOnly: true},
  {name: 'Repeatable', hint: 'Repeats daily, weekly or on chosen days', needsDoable: true},
  {name: 'Remindable', hint: 'Custom reminder times', needsDoable: true},
  {name: 'Divisible', hint: 'Checklist of steps'},
  {name: 'Visitable', hint: 'Holds a link'},
];

const ICONS = [
  'ellipse-outline', 'checkmark-circle-outline', 'document-text-outline', 'book-outline', 'bulb-outline',
  'barbell-outline', 'cart-outline', 'cash-outline', 'briefcase-outline', 'home-outline',
  'heart-outline', 'airplane-outline', 'school-outline', 'restaurant-outline', 'medkit-outline',
  'musical-notes-outline', 'film-outline', 'code-slash-outline', 'people-outline', 'leaf-outline',
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
  return <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 20, marginBottom: 10}}>{children}</Text>;
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
  const [icon, setIcon] = useState<string | null>(existing?.icon ?? null);
  const [modes, setModes] = useState<Record<string, Mode>>(() =>
    Object.fromEntries(
      MANAGEABLE.map(b => [
        b.name,
        existing?.defaults.includes(b.name) ? 'always' : existing?.optional.includes(b.name) ? 'optional' : 'off',
      ]),
    ),
  );
  const [saving, setSaving] = useState(false);

  function setMode(behavior: string, mode: Mode) {
    setModes(prev => {
      const next = {...prev, [behavior]: mode};
      const def = MANAGEABLE.find(b => b.name === behavior);
      // Repeat/reminders need a due date, so they bring Doable along.
      if (mode !== 'off' && def?.needsDoable && next.Doable === 'off') next.Doable = 'always';
      if (behavior === 'Doable' && mode === 'off') {
        for (const b of MANAGEABLE) if (b.needsDoable) next[b.name] = 'off';
      }
      return next;
    });
  }

  const nameTaken = types.some(t => t.name.toLowerCase() === name.trim().toLowerCase() && t.id !== existing?.id);

  async function save() {
    setSaving(true);
    try {
      await saveItemType({
        id: existing?.id,
        name,
        description,
        icon,
        defaults: MANAGEABLE.filter(b => modes[b.name] === 'always').map(b => b.name),
        // Keep any optional behaviors this screen doesn't manage.
        optional: [
          ...MANAGEABLE.filter(b => modes[b.name] === 'optional').map(b => b.name),
          ...(existing?.optional ?? []).filter(b => !MANAGEABLE.some(m => m.name === b)),
        ],
      });
      router.back();
    } catch (err) {
      Alert.alert('Could not save type', err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!existing) return;
    const count = await countItemsOfType(existing.id);
    const fallback = types.find(t => t.name === (existing.defaults.includes('Doable') ? 'Task' : 'Note'));
    const doDelete = async () => {
      await deleteItemType(existing.id, fallback!.id);
      router.back();
    };
    Alert.alert(
      `Delete "${existing.name}"?`,
      count ? `${count} item${count === 1 ? '' : 's'} will become ${fallback?.name}s.` : 'No items use this type.',
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
          <Pressable onPress={remove} hitSlop={12} accessibilityLabel="Delete type">
            <Ionicons name="trash-outline" size={22} color={designTokens.textPrimary} />
          </Pressable>
        ) : undefined
      }>
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingBottom: 24}} keyboardShouldPersistTaps="handled">
        <Label>Name</Label>
        <TextInput
          value={name}
          onChangeText={setName}
          editable={!locked}
          placeholder="e.g. Workout, Bill, Recipe"
          placeholderTextColor={designTokens.textTertiary}
          style={[field, locked && {opacity: 0.5}]}
        />
        {nameTaken ? <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 6}}>A type with this name already exists.</Text> : null}

        <Label>Description</Label>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What goes here? Helps capture sort things later."
          placeholderTextColor={designTokens.textTertiary}
          style={field}
        />

        <Label>Icon</Label>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 10}}>
          {ICONS.map(name => {
            const active = (icon ?? '') === name;
            return (
              <Pressable
                key={name}
                onPress={() => setIcon(name)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: radius.md,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: active ? designTokens.surfaceRaised : designTokens.card,
                  borderWidth: 1,
                  borderColor: active ? designTokens.textSecondary : 'transparent',
                }}>
                <Ionicons name={name} size={20} color={designTokens.textPrimary} />
              </Pressable>
            );
          })}
        </View>

        <Label>Behaviors</Label>
        <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: -4, marginBottom: 8}}>
          Always = every item has it. Optional = items can turn it on.
        </Text>
        {MANAGEABLE.map(b => {
          const mode = modes[b.name];
          const lockedDefault = locked && existing?.defaults.includes(b.name);
          const options: Mode[] = lockedDefault ? ['always'] : b.alwaysOnly ? (locked ? ['off'] : ['off', 'always']) : ['off', 'optional', ...(locked ? [] : (['always'] as Mode[]))];
          return (
            <View key={b.name} style={{paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: designTokens.divider, gap: 8}}>
              <View>
                <Text style={{color: designTokens.textPrimary, fontSize: 15, fontWeight: '500'}}>{getBehaviorLabel(b.name)}</Text>
                <Text style={{color: designTokens.textTertiary, fontSize: 12, marginTop: 2}}>{b.hint}</Text>
              </View>
              <View style={{flexDirection: 'row', gap: 8}}>
                {options.map(o => (
                  <SelectChip key={o} label={o === 'off' ? 'Off' : o === 'optional' ? 'Optional' : 'Always'} active={mode === o} onPress={() => setMode(b.name, o)} />
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: insets.bottom + 8, borderTopWidth: 1, borderTopColor: designTokens.divider}}>
        <PrimaryButton compact label="Save" loading={saving} disabled={!name.trim() || nameTaken} onPress={save} />
      </View>
    </ScreenShell>
  );
}
