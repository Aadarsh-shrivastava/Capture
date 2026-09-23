import type { ComponentProps } from 'react';
import { Text as RNText } from 'react-native';

export function Text(props: ComponentProps<typeof RNText>) {
  return <RNText {...props} />;
}
