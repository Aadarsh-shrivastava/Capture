import {View} from 'react-native';

import {Sheet} from '@/components/Sheet/Sheet';
import {OptionRow} from '@/ui/components/Primitives';

type AddQuicklySheetProps = {
  visible: boolean;
  onClose: () => void;
  onVoice: () => void;
  onType: () => void;
  onManual: () => void;
};

/** Entry-point sheet offering the three capture routes. */
export function AddQuicklySheet({visible, onClose, onVoice, onType, onManual}: AddQuicklySheetProps) {
  return (
    <Sheet visible={visible} onClose={onClose} title="Add quickly">
      <View style={{paddingHorizontal: 20, paddingBottom: 8, gap: 10}}>
        <OptionRow
          icon="mic-outline"
          title="Voice input"
          subtitle="Speak naturally"
          onPress={() => {
            onClose();
            onVoice();
          }}
        />
        <OptionRow
          icon="create-outline"
          title="Type"
          subtitle="Write it down"
          onPress={() => {
            onClose();
            onType();
          }}
        />
        <OptionRow
          icon="list-outline"
          title="Create manually"
          subtitle="Choose a type"
          onPress={() => {
            onClose();
            onManual();
          }}
        />
      </View>
    </Sheet>
  );
}
