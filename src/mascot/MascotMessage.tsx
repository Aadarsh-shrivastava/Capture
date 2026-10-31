import {Text, View} from 'react-native';

import {designTokens} from '@/ui/designTokens';

import type {MascotPose} from './frames';
import {Mascot} from './Mascot';

/** Empty/edge-state block: a pose with a short line under it. */
export function MascotMessage({pose, message, width = 110}: {pose: MascotPose; message: string; width?: number}) {
  return (
    <View style={{alignItems: 'center', paddingVertical: 24, gap: 6}}>
      <Mascot pose={pose} width={width} />
      <Text style={{color: designTokens.textTertiary, fontSize: 14, textAlign: 'center', lineHeight: 20}}>{message}</Text>
    </View>
  );
}
