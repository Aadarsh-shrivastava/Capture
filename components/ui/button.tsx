import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonProps = ComponentProps<typeof Pressable> & {
  children?: ReactNode;
};

export function Button({ children, style, ...rest }: ButtonProps) {
  return (
    <Pressable style={style} {...rest}>
      {children}
    </Pressable>
  );
}

export function ButtonText(props: ComponentProps<typeof Text>) {
  return <Text {...props} />;
}

type ButtonIconProps = {
  as: React.ComponentType<{ width?: number; height?: number; color?: string }>;
  color?: string;
  width?: number;
  height?: number;
};

export function ButtonIcon({ as: Icon, color, width = 16, height = 16 }: ButtonIconProps) {
  return (
    <View style={{ marginLeft: 6 }}>
      <Icon width={width} height={height} color={color} />
    </View>
  );
}
