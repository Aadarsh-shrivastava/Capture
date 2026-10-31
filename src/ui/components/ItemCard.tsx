import {Text, View} from 'react-native';

import {Pressable} from '@/ui/HapticPressable';
import {IconTile} from '@/ui/components/Primitives';
import {designTokens, radius} from '@/ui/designTokens';
import {formatRelativeDay} from '@/ui/formatDateTime';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

type ItemCardProps = {
  title: string;
  typeName: string;
  createdAt: string;
  /** Extra meta shown after the date, e.g. a due label. */
  meta?: string | null;
  onPress?: () => void;
  onLongPress?: () => void;
};

/** Rounded card row for item lists — icon tile, title, meta line. */
export function ItemCard({title, typeName, createdAt, meta, onPress, onLongPress}: ItemCardProps) {
  const config = getItemTypeConfig(typeName);
  const metaLine = [config.label, meta || formatRelativeDay(createdAt)].filter(Boolean).join(' · ');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        borderRadius: radius.lg,
        backgroundColor: pressed ? designTokens.cardPressed : designTokens.card,
      })}>
      <IconTile icon={config.icon} size={40} />

      <View style={{flex: 1}}>
        <Text
          numberOfLines={2}
          style={{color: designTokens.textPrimary, fontSize: 16, fontWeight: '500'}}>
          {title}
        </Text>
        <Text style={{color: designTokens.textTertiary, fontSize: 13, marginTop: 3}}>
          {metaLine}
        </Text>
      </View>
    </Pressable>
  );
}

type TypeGridCardProps = {
  typeName: string;
  count: number;
  onPress: () => void;
};

/** Small square card for the Library grid. */
/** "3 items" / "1 item"; empty for 0. */
export function itemCountLabel(count: number): string {
  return count > 0 ? `${count} ${count === 1 ? 'item' : 'items'}` : '';
}

export function TypeGridCard({typeName, count, onPress}: TypeGridCardProps) {
  const config = getItemTypeConfig(typeName);

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({pressed}) => ({
        flex: 1,
        aspectRatio: 1,
        padding: 12,
        borderRadius: radius.lg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: pressed ? designTokens.cardPressed : designTokens.card,
      })}>
      <IconTile icon={config.icon} size={36} />
      <View style={{alignItems: 'center', gap: 2}}>
        <Text numberOfLines={1} style={{color: designTokens.white, fontSize: 15, fontWeight: '700'}}>
          {config.plural}
        </Text>
        <Text style={{color: designTokens.textTertiary, fontSize: 12, minHeight: 15}}>{itemCountLabel(count)}</Text>
      </View>
    </Pressable>
  );
}
