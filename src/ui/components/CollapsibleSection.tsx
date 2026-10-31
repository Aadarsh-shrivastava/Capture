import {Ionicons} from '@expo/vector-icons';
import {useState, type ReactNode} from 'react';
import {Text, View} from 'react-native';

import {Appear} from '@/motion';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

/** Section header that folds its content; shows the count when collapsed. */
export function CollapsibleSection({label, count, defaultOpen = true, children}: {label: string; count: number; defaultOpen?: boolean; children: ReactNode}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <View>
      <Pressable
        onPress={() => setOpen(value => !value)}
        accessibilityRole="button"
        accessibilityState={{expanded: open}}
        style={{flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 26, marginBottom: 10}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 14, fontWeight: '600'}}>{label}</Text>
        <Text style={{color: designTokens.textTertiary, fontSize: 13}}>{count}</Text>
        <View style={{flex: 1}} />
        <Ionicons name={open ? 'chevron-down' : 'chevron-forward'} size={16} color={designTokens.textTertiary} />
      </Pressable>
      {open ? <Appear from="down">{children}</Appear> : null}
    </View>
  );
}
