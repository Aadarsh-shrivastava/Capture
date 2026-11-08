import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ModelGate } from '@/model';
import { AppShell } from '@/navigation/AppShell';
import { OnboardingFlow, useOnboardingPreview } from '@/onboarding';
import { DatabaseProvider } from '@/providers/DatabaseProvider';
import { getVaultConfig } from '@/vault';

export default function App() {
  // No vault yet = first run: onboarding creates it before the database (which lives inside it) opens.
  const [hasVault, setHasVault] = useState(() => getVaultConfig() !== null);
  const preview = useOnboardingPreview();
  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#111' }}>
        <ActivityIndicator color="#9a9a9a" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{flex: 1}}>
      {/* Known insets from the first frame, so nothing renders under the status bar and then jumps. */}
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <GluestackUIProvider mode="dark">
          {hasVault && !preview.preview ? (
            // The model downloads into the vault, so it's asked for once the vault exists.
            <ModelGate>
              <DatabaseProvider>
                <NavigationContainer>
                  <AppShell />
                </NavigationContainer>
              </DatabaseProvider>
            </ModelGate>
          ) : (
            <OnboardingFlow
              preview={preview.preview}
              onDone={() => {
                preview.setPreview(false);
                setHasVault(true);
              }}
            />
          )}
        </GluestackUIProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
