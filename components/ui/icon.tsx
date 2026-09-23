import { Ionicons } from '@expo/vector-icons';

type IconProps = {
  width?: number;
  height?: number;
  color?: string;
};

function makeIonIcon(name: keyof typeof Ionicons.glyphMap) {
  return function IonIcon({ width = 20, height = 20, color = '#fff' }: IconProps) {
    return <Ionicons name={name} size={Math.max(width, height)} color={color} />;
  };
}

export const CloseIcon = makeIonIcon('close');
export const ArrowRightIcon = makeIonIcon('arrow-forward');
export const CalendarDaysIcon = makeIonIcon('calendar-outline');
