import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeStore } from '@/store/themeStore';

import { designTokens, formatRelativeDay } from '@/ui/designTokens';
import {
  getItemTypeConfig,
  ITEM_TYPE_ORDER,
  type ItemTypeName,
} from '@/ui/itemTypeConfig';

type ItemRowProps = {
  title: string;
  typeName: string;
  createdAt: string;
  onPress?: () => void;
};

export function ItemRow({ title, typeName, createdAt, onPress }: ItemRowProps) {
  const config = getItemTypeConfig(typeName);

  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: config.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
          }}
        >
          <Ionicons name={config.icon} size={16} color={config.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: designTokens.textPrimary,
              fontSize: 16,
              fontWeight: '500',
              marginBottom: 6,
            }}
          >
            {title}
          </Text>
          <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>
            {config.label} · {formatRelativeDay(createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

type FilterChipProps = {
  label: string;
  active: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

export function FilterChip({ label, active, icon, onPress }: FilterChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: active ? designTokens.accent : designTokens.surfaceBorder,
        backgroundColor: active ? designTokens.accentMuted : 'transparent',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 7,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? designTokens.accent : designTokens.textSecondary}
        />
      ) : null}
      <Text
        style={{
          color: active ? designTokens.textPrimary : designTokens.textSecondary,
          fontSize: 13,
          fontWeight: active ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Fixed four-type picker — not driven by DB catalog. */
type ItemTypePickerProps = {
  value: ItemTypeName;
  onChange: (typeName: ItemTypeName) => void;
};

export function ItemTypePicker({ value, onChange }: ItemTypePickerProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {ITEM_TYPE_ORDER.map((typeName) => {
        const active = value === typeName;
        const config = getItemTypeConfig(typeName);

        return (
          <Pressable
            key={typeName}
            onPress={() => onChange(typeName)}
            style={{
              flex: 1,
              minWidth: '44%',
              borderWidth: 1,
              borderColor: active ? config.accent : designTokens.surfaceBorder,
              backgroundColor: active ? config.accentMuted : designTokens.surfaceRaised,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <Ionicons name={config.icon} size={18} color={config.accent} />
            <Text
              style={{
                color: designTokens.textPrimary,
                fontSize: 15,
                fontWeight: '600',
                marginTop: 10,
                marginBottom: 4,
              }}
            >
              {config.label}
            </Text>
            <Text style={{ color: designTokens.textTertiary, fontSize: 12 }}>{config.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type TypeSelectorProps = {
  types: { id: number; name: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
};

export function TypeSelector({ types, selectedId, onSelect }: TypeSelectorProps) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>
      {types.map((type) => {
        const active = selectedId === type.id;
        const config = getItemTypeConfig(type.name);

        return (
          <Pressable
            key={type.id}
            onPress={() => onSelect(type.id)}
            style={{
              flex: 1,
              minWidth: '30%',
              borderWidth: 1,
              borderColor: active ? config.accent : designTokens.surfaceBorder,
              backgroundColor: active ? config.accentMuted : designTokens.surfaceRaised,
              borderRadius: 10,
              padding: 14,
            }}
          >
            <Ionicons name={config.icon} size={18} color={config.accent} />
            <Text
              style={{
                color: designTokens.textPrimary,
                fontSize: 15,
                fontWeight: '600',
                marginTop: 10,
                marginBottom: 4,
              }}
            >
              {config.label}
            </Text>
            <Text style={{ color: designTokens.textTertiary, fontSize: 12 }}>{config.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type GroupChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

export function GroupChip({ label, active, onPress }: GroupChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        borderWidth: 1,
        borderColor: active ? designTokens.accent : designTokens.surfaceBorder,
        backgroundColor: active ? designTokens.accentMuted : designTokens.surfaceRaised,
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <Text
        style={{
          color: active ? designTokens.textPrimary : designTokens.textSecondary,
          fontSize: 13,
          fontWeight: active ? '600' : '400',
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

type GroupDropdownProps = {
  groups: { id: number; name: string }[];
  selectedGroupId: number | null;
  onSelect: (groupId: number | null) => void;
};

/** Optional single-group dropdown for create/edit forms. */
export function GroupDropdown({ groups, selectedGroupId, onSelect }: GroupDropdownProps) {
  const { theme } = useThemeStore();
  const { colors, rounded } = theme;
  const [open, setOpen] = useState(false);

  if (groups.length === 0) {
    return (
      <Text style={{ color: designTokens.textTertiary, fontSize: 14, lineHeight: 20 }}>
        No groups yet. Create one from the Groups tab, then come back to assign it.
      </Text>
    );
  }

  const selectedName =
    groups.find((g) => g.id === selectedGroupId)?.name ?? 'No group';

  return (
    <View>
      <Pressable
        onPress={() => setOpen((v) => !v)}
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
        }}
      >
        <Text
          style={{
            color: selectedGroupId ? colors.onSurface : colors.onSurfaceVariant,
            fontSize: 16,
          }}
        >
          {selectedName}
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
          }}
        >
          <Pressable
            onPress={() => {
              onSelect(null);
              setOpen(false);
            }}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 12,
              backgroundColor:
                selectedGroupId == null ? designTokens.accentMuted : 'transparent',
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text
              style={{
                color: colors.onSurface,
                fontSize: 15,
                fontWeight: selectedGroupId == null ? '600' : '400',
              }}
            >
              No group
            </Text>
          </Pressable>
          {groups.map((group) => {
            const selected = selectedGroupId === group.id;
            return (
              <Pressable
                key={group.id}
                onPress={() => {
                  onSelect(group.id);
                  setOpen(false);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  backgroundColor: selected ? designTokens.accentMuted : 'transparent',
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <Text
                  style={{
                    color: colors.onSurface,
                    fontSize: 15,
                    fontWeight: selected ? '600' : '400',
                  }}
                >
                  {group.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

type SettingsRowProps = {
  label: string;
  onPress?: () => void;
};

export function SettingsRow({ label, onPress }: SettingsRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
      }}
    >
      <Text style={{ color: designTokens.textPrimary, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

type GroupRowProps = {
  name: string;
  itemCount: number;
  onPress?: () => void;
};

export function GroupRow({ name, itemCount, onPress }: GroupRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: designTokens.surfaceBorder,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 8,
            backgroundColor: designTokens.accentMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="folder-outline" size={18} color={designTokens.accent} />
        </View>
        <Text style={{ color: designTokens.textPrimary, fontSize: 16, fontWeight: '500' }}>
          {name}
        </Text>
      </View>
      <Text style={{ color: designTokens.textTertiary, fontSize: 13 }}>{itemCount}</Text>
    </Pressable>
  );
}
