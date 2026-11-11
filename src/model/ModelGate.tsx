import {useEffect, type ReactNode} from 'react';
import {ActivityIndicator, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Mascot} from '@/mascot';
import {PrimaryButton} from '@/ui/components/Primitives';
import {designTokens} from '@/ui/designTokens';

import {MODEL_SIZE_MB} from './config';
import {useModelStore} from './store';

/** The app needs the on-device model to sort anything: until it's on the phone, this screen is all there is. */
export function ModelGate({children}: {children: ReactNode}) {
  const insets = useSafeAreaInsets();
  const {status, pct, error, check, download} = useModelStore();

  useEffect(() => {
    check().catch(() => {});
  }, [check]);

  if (status === 'ready') return <>{children}</>;

  const downloading = status === 'downloading';
  return (
    <View style={{flex: 1, backgroundColor: designTokens.black, paddingTop: insets.top + 48, paddingBottom: insets.bottom + 16, paddingHorizontal: 24}}>
      {status === 'unknown' ? (
        <ActivityIndicator color={designTokens.textSecondary} style={{flex: 1}} />
      ) : (
        <>
          <View style={{flex: 1, alignItems: 'center', gap: 8}}>
            <Mascot pose="thinking" width={120} style={{marginBottom: 16}} />
            <Text style={{color: designTokens.textPrimary, fontSize: 28, fontWeight: '700', textAlign: 'center'}}>One last thing</Text>
            <Text style={{color: designTokens.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center'}}>
              Capture sorts your thoughts with an AI model that runs on this phone, so nothing leaves it. It's about {MODEL_SIZE_MB} MB:
              use Wi-Fi if you can, and keep the app open until it's done.
            </Text>
            {downloading ? (
              <View style={{alignSelf: 'stretch', marginTop: 32, gap: 8}}>
                <View style={{height: 6, borderRadius: 3, backgroundColor: designTokens.chip, overflow: 'hidden'}}>
                  <View style={{width: `${pct}%`, height: '100%', backgroundColor: designTokens.textPrimary}} />
                </View>
                <Text style={{color: designTokens.textTertiary, fontSize: 13, textAlign: 'center'}}>Downloading… {pct}%</Text>
              </View>
            ) : null}
            {error && !downloading ? (
              <Text style={{color: designTokens.textSecondary, fontSize: 13, lineHeight: 18, textAlign: 'center', marginTop: 24}}>{error}</Text>
            ) : null}
          </View>
          <PrimaryButton
            label={error ? 'Try again' : 'Download model'}
            icon="download-outline"
            loading={downloading}
            onPress={() => download().catch(() => {})}
          />
        </>
      )}
    </View>
  );
}
