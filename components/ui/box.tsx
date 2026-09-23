import type { ComponentProps } from 'react';
import { View } from 'react-native';

export function Box(props: ComponentProps<typeof View>) {
  return <View {...props} />;
}
