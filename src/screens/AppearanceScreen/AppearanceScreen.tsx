import {ScrollView, Switch, Text} from 'react-native';

import {ScreenShell} from '@/components/ScreenShell/ScreenShell';
import {CharacterPicker} from '@/mascot';
import {useAppearance} from '@/store/appearanceStore';
import {SettingsCard} from '@/ui/components/SettingsCard';
import {designTokens} from '@/ui/designTokens';

/** What shows on screen: companion, progress bar, tab bar. */
export function AppearanceScreen() {
  const appearance = useAppearance();
  return (
    <ScreenShell title="Appearance" leading="back">
      <ScrollView contentContainerStyle={{paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 10}}>
        <Text style={{color: designTokens.textSecondary, fontSize: 13, fontWeight: '600', marginTop: 4}}>Companion</Text>
        <CharacterPicker size={52} />
        <SettingsCard
          icon="stats-chart-outline"
          title="Progress bar"
          subtitle="“0 of 3 done” on Focus"
          trailing={<Switch value={appearance.progressBar} onValueChange={v => appearance.set('progressBar', v)} />}
        />
        <SettingsCard
          icon="albums-outline"
          title="Bottom tab bar"
          subtitle="Experimental · off = a small + Add"
          trailing={<Switch value={appearance.tabBar} onValueChange={v => appearance.set('tabBar', v)} />}
        />
      </ScrollView>
    </ScreenShell>
  );
}
