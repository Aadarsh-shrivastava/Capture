import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer, type NavigationState } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initialWindowMetrics, SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { ModelGate } from '@/model';
import { AppShell } from '@/navigation/AppShell';
import { navigationRef } from '@/navigation/navigationRef';
import { OnboardingFlow, useOnboardingPreview } from '@/onboarding';
import { DatabaseProvider } from '@/providers/DatabaseProvider';
import { isLightTheme, useThemeStore } from '@/store/themeStore';
import { getVaultConfig } from '@/vault';

export default function App() {
  // No vault yet = first run: onboarding creates it before the database (which lives inside it) opens.
  const [hasVault, setHasVault] = useState(() => getVaultConfig() !== null);
  const preview = useOnboardingPreview();
  // Colours are read at render: a theme change remounts the app (key) and puts you back where you were (navState).
  const themeName = useThemeStore((s) => s.themeName);
  const navState = useRef<NavigationState | undefined>(undefined);
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
        <StatusBar barStyle={isLightTheme(themeName) ? 'dark-content' : 'light-content'} />
        <GluestackUIProvider mode={isLightTheme(themeName) ? 'light' : 'dark'}>
          {hasVault && !preview.preview ? (
            // The model downloads into the vault, so it's asked for once the vault exists.
            <ModelGate key={themeName}>
              <DatabaseProvider>
                <NavigationContainer ref={navigationRef} initialState={navState.current} onStateChange={(state) => (navState.current = state)}>
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
