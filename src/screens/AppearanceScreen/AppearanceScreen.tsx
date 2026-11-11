import {ScrollView, Text} from 'react-native';

import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {CharacterPicker} from '@/mascot';
import {ThemePicker} from '@/ui/components/ThemePicker';
import {designTokens} from '@/ui/designTokens';

/** What shows on screen: companion and theme. */
export function AppearanceScreen() {
  return (
    <ScreenShell title="Appearance" leading="back">
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 10}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 4}}>Companion</Text>
        <CharacterPicker size={52} />
        <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 16}}>Theme</Text>
        <ThemePicker />
      </ScrollView>
    </ScreenShell>
  );
}
