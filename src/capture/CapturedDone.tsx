import * as Haptics from 'expo-haptics';
import {useEffect} from 'react';
import {Text, View} from 'react-native';

import {Mascot} from '@/mascot';
import {Appear} from '@/motion';
import {designTokens} from '@/ui/designTokens';

/** How long the "Captured" moment stays before the capture screen closes itself. */
export const CAPTURED_DONE_MS = 1300;

/** The reassuring beat after a capture: happy mascot, big "Captured", and a word on what happens next. */
export function CapturedDone({count}: {count: number}) {
  useEffect(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  return (
    <View style={{flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 48}}>
      <Appear from="up" duration={320}>
        <Mascot pose="happy" width={150} />
      </Appear>
      <Appear from="up" duration={420} style={{alignItems: 'center', marginTop: 16, gap: 6}}>
        <Text style={{color: designTokens.textPrimary, fontSize: 34, fontWeight: '700'}}>Captured</Text>
        <Text style={{color: designTokens.textSecondary, fontSize: 15}}>
          {count === 1 ? '1 item' : `${count} items`} · sorting in the background
        </Text>
      </Appear>
    </View>
  );
}
