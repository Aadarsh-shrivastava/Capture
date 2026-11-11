import {Text, View} from 'react-native';

import {useThemeStore} from '@/store/themeStore';
import {designTokens, PALETTE_LABELS, PALETTES, radius, type PaletteName} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

/** One swatch per theme, drawn in that theme's own colours; tapping one switches the app to it. */
export function ThemePicker() {
  const {themeName, setTheme} = useThemeStore();
  return (
    <View style={{flexDirection: 'row', gap: 10}}>
      {(Object.keys(PALETTES) as PaletteName[]).map(name => {
        const p = PALETTES[name];
        const active = name === themeName;
        return (
          <Pressable
            key={name}
            onPress={() => setTheme(name)}
            accessibilityRole="radio"
            accessibilityState={{selected: active}}
            style={{flex: 1, alignItems: 'center', gap: 8, padding: 12, borderRadius: radius.lg, backgroundColor: p.black, borderWidth: 2, borderColor: active ? designTokens.textPrimary : designTokens.surfaceBorder}}>
            <View style={{width: '100%', height: 36, borderRadius: radius.sm, backgroundColor: p.card, borderWidth: 1, borderColor: p.surfaceBorder, justifyContent: 'center', paddingHorizontal: 8}}>
              <View style={{width: '60%', height: 6, borderRadius: 3, backgroundColor: p.textPrimary}} />
            </View>
            <Text style={{color: p.textPrimary, fontSize: 13, fontWeight: '600'}}>{PALETTE_LABELS[name]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
