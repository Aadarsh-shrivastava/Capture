import {Ionicons} from '@expo/vector-icons';
import type {ReactNode} from 'react';
import {ActivityIndicator, Text, View, type ViewStyle} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {designTokens, radius} from '@/ui/designTokens';

type IconName = keyof typeof Ionicons.glyphMap;

type IconTileProps = {
  icon: IconName;
  size?: number;
  iconSize?: number;
  color?: string;
  background?: string;
  rounded?: number;
};

/** Rounded square icon container used by library cards and option rows. */
export function IconTile({
  icon,
  size = 44,
  iconSize,
  color = designTokens.textPrimary,
  background = designTokens.chip,
  rounded = radius.md,
}: IconTileProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Ionicons name={icon} size={iconSize ?? Math.round(size * 0.45)} color={color} />
    </View>
  );
}

type ButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({label, onPress, icon, loading, disabled, style}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({pressed}) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          height: 54,
          borderRadius: radius.md,
          backgroundColor: designTokens.white,
          opacity: inactive ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={designTokens.black} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={designTokens.black} /> : null}
          <Text style={{color: designTokens.black, fontSize: 16, fontWeight: '600'}}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

export function SecondaryButton({label, onPress, icon, loading, disabled, style}: ButtonProps) {
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      style={({pressed}) => [
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          height: 54,
          borderRadius: radius.md,
          backgroundColor: pressed ? designTokens.cardPressed : designTokens.card,
          opacity: inactive ? 0.45 : 1,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={designTokens.textPrimary} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={designTokens.textPrimary} /> : null}
          <Text style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '600'}}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

type PillButtonProps = {
  label: string;
  onPress: () => void;
  icon?: IconName;
};

/** Small pill action — e.g. "Type instead" under the voice orb. */
export function PillButton({label, onPress, icon}: PillButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        alignSelf: 'center',
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: radius.pill,
        backgroundColor: pressed ? designTokens.cardPressed : designTokens.card,
      })}>
      {icon ? <Ionicons name={icon} size={16} color={designTokens.textSecondary} /> : null}
      <Text style={{color: designTokens.textPrimary, fontSize: 14, fontWeight: '500'}}>{label}</Text>
    </Pressable>
  );
}

type SelectChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

/** Filter chip — white fill when active, as in the Library header. */
export function SelectChip({label, active, onPress}: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{selected: active}}
      style={{
        paddingHorizontal: 16,
        paddingVertical: 9,
        borderRadius: radius.pill,
        backgroundColor: active ? designTokens.white : designTokens.chip,
      }}>
      <Text
        style={{
          color: active ? designTokens.black : designTokens.textSecondary,
          fontSize: 14,
          fontWeight: active ? '600' : '500',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

type CircleCheckProps = {
  checked?: boolean;
  onPress?: () => void;
  size?: number;
};

/** Task completion circle. */
export function CircleCheck({checked = false, onPress, size = 22}: CircleCheckProps) {
  const body = (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: checked ? designTokens.white : designTokens.textTertiary,
        backgroundColor: checked ? designTokens.white : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {checked ? (
        <Ionicons name="checkmark" size={size * 0.6} color={designTokens.black} />
      ) : null}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="checkbox"
      accessibilityState={{checked}}>
      {body}
    </Pressable>
  );
}

type SquareCheckProps = {
  checked: boolean;
  size?: number;
};

/** Square checkbox used in the tag picker. */
export function SquareCheck({checked, size = 22}: SquareCheckProps) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.xs,
        borderWidth: 1.5,
        borderColor: checked ? designTokens.white : designTokens.textTertiary,
        backgroundColor: checked ? designTokens.white : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {checked ? <Ionicons name="checkmark" size={size * 0.65} color={designTokens.black} /> : null}
    </View>
  );
}

export function Divider({inset = 0}: {inset?: number}) {
  return (
    <View
      style={{
        height: 1,
        backgroundColor: designTokens.divider,
        marginLeft: inset,
      }}
    />
  );
}

type ListRowProps = {
  icon?: IconName;
  title: string;
  subtitle?: string;
  value?: string;
  chevron?: boolean;
  trailing?: ReactNode;
  onPress?: () => void;
};

/** Icon + label + value + chevron row — detail properties and option sheets. */
export function PropertyRow({
  icon,
  title,
  subtitle,
  value,
  chevron = true,
  trailing,
  onPress,
}: ListRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingVertical: 16,
        opacity: pressed ? 0.6 : 1,
      })}>
      {icon ? <Ionicons name={icon} size={20} color={designTokens.textSecondary} /> : null}

      <View style={{flex: 1}}>
        <Text style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '500'}}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 13, marginTop: 2}}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing ??
        (value ? (
          <Text
            numberOfLines={1}
            style={{color: designTokens.textSecondary, fontSize: 15, maxWidth: 160}}>
            {value}
          </Text>
        ) : null)}

      {chevron && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={designTokens.textTertiary} />
      ) : null}
    </Pressable>
  );
}

type OptionRowProps = {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

/** Card row with icon tile — the "Add quickly" sheet. */
export function OptionRow({icon, title, subtitle, onPress}: OptionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: radius.md,
        backgroundColor: pressed ? designTokens.cardPressed : designTokens.card,
      })}>
      <IconTile icon={icon} size={40} background={designTokens.chip} />
      <View style={{flex: 1}}>
        <Text style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '600'}}>{title}</Text>
        {subtitle ? (
          <Text style={{color: designTokens.textTertiary, fontSize: 13, marginTop: 2}}>{subtitle}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}
