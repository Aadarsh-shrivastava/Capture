import {useRouter} from 'expo-router';
import {Alert} from 'react-native';

import {OptionsSheet} from '@/components/sheets/OptionsSheet';
import {getItemTypeConfig} from '@/ui/itemTypeConfig';

import {answer} from './service';
import {useTypeCheckStore} from './store';

const EDIT = '__edit';

/** Global "Saved as Task. Was it…?" sheet — one tap moves the item and teaches the type. Dismiss = keep. */
export function TypeCheckSheet() {
  const router = useRouter();
  const question = useTypeCheckStore(state => state.question);
  const close = () => useTypeCheckStore.getState().set(null);
  if (!question) return null;
  return (
    <OptionsSheet
      visible
      onClose={close}
      title={`"${question.title}" saved as ${question.current}. Was it…`}
      value={null}
      options={[
        ...question.candidates.map(name => ({
          label: name,
          value: name,
          icon: getItemTypeConfig(name).icon,
        })),
        {
          label: `Keep as ${question.current}`,
          value: question.current,
          icon: 'checkmark-outline' as const,
        },
        // None of these: open the item's edit screen (changing the type there teaches it too).
        {
          label: 'Something else…',
          value: EDIT,
          icon: 'create-outline' as const,
        },
      ]}
      onSelect={type =>
        type === EDIT
          ? (close(),
            setTimeout(
              () => router.push(`/create-item?id=${question.itemId}`),
              300,
            ))
          : answer(type).catch(e =>
              Alert.alert(
                'Could not change type',
                e instanceof Error ? e.message : 'Try again',
              ),
            )
      }
    />
  );
}
