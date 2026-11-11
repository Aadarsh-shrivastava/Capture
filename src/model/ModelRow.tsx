import {useEffect} from 'react';
import {ActivityIndicator, Alert, Text} from 'react-native';

import {SettingsCard} from '@/ui/components/SettingsCard';
import {designTokens} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';

import {MODEL_SIZE_MB} from './config';
import {useModelStore} from './store';

/** Settings row: download the on-device AI model on demand, or remove it to free space. */
export function ModelRow() {
  const {status, pct, error, check, download, remove} = useModelStore();
  useEffect(() => {
    check().catch(() => {});
  }, [check]);

  const confirmDownload = () =>
    Alert.alert('Download AI model?', `About ${MODEL_SIZE_MB} MB. Use Wi-Fi if you can.`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Download', onPress: () => download()},
    ]);
  const confirmRemove = () =>
    Alert.alert('Remove AI model?', "Capture can't sort anything without it: you'll be asked to download it again.", [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Remove', style: 'destructive', onPress: () => remove().catch(() => {})},
    ]);

  return (
    <SettingsCard
      icon="hardware-chip-outline"
      title="AI model"
      subtitle={
        status === 'ready'
          ? 'Sorts your captures privately on this phone'
          : status === 'downloading'
            ? `Downloading… ${pct}%`
            : error ?? `Not downloaded (~${MODEL_SIZE_MB} MB)`
      }
      trailing={
        status === 'downloading' ? (
          <ActivityIndicator color={designTokens.textSecondary} />
        ) : (
          <Pressable onPress={status === 'ready' ? confirmRemove : confirmDownload} hitSlop={8} accessibilityRole="button">
            <Text style={{color: designTokens.textSecondary, fontSize: 14, fontWeight: '600'}}>
              {status === 'ready' ? 'Remove' : 'Download'}
            </Text>
          </Pressable>
        )
      }
    />
  );
}
