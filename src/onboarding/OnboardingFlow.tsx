import {Ionicons} from '@expo/vector-icons';
import {useState} from 'react';
import {Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Appear} from '@/motion';
import {CharacterPicker, Mascot} from '@/mascot';
import {Avatar, pickProfilePhoto, useProfileStore} from '@/profile';
import {PrimaryButton} from '@/ui/components/Primitives';
import {ThemePicker} from '@/ui/components/ThemePicker';
import {useThemeStore} from '@/store/themeStore';
import {designTokens, radius} from '@/ui/designTokens';
import {Pressable} from '@/ui/HapticPressable';
import {createVault, VAULT_LOCATIONS, type VaultLocation} from '@/vault';

type Step = 'welcome' | 'vault' | 'profile';
const STEPS: Step[] = ['welcome', 'vault', 'profile'];

const field = {
  backgroundColor: designTokens.field,
  borderRadius: radius.md,
  paddingHorizontal: 16,
  paddingVertical: 14,
  color: designTokens.textPrimary,
  fontSize: 16,
};

function Title({title, body}: {title: string; body: string}) {
  return (
    <View style={{gap: 8, marginBottom: 28, alignItems: 'center'}}>
      <Text style={{color: designTokens.textPrimary, fontSize: 28, fontWeight: '700', textAlign: 'center'}}>{title}</Text>
      <Text style={{color: designTokens.textSecondary, fontSize: 15, lineHeight: 22, textAlign: 'center'}}>{body}</Text>
    </View>
  );
}

/** First run: create the vault (where all data lives), then a basic profile. The model download follows (ModelGate). */
/** `preview`: replay for dev — the vault step just moves on instead of creating a vault. */
export function OnboardingFlow({onDone, preview = false}: {onDone: () => void; preview?: boolean}) {
  const insets = useSafeAreaInsets();
  const profile = useProfileStore();
  const [step, setStep] = useState<Step>('welcome');
  // Re-render on a theme pick so the colours update here; the app tree remounts, onboarding keeps its step.
  useThemeStore(s => s.themeName);
  const [vaultName, setVaultName] = useState('My Vault');
  const [location, setLocation] = useState<VaultLocation>('files');
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);

  async function makeVault() {
    setBusy(true);
    try {
      if (!preview) await createVault(vaultName, location);
      setStep('profile');
    } catch (err) {
      Alert.alert('Could not create the vault', err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function choosePhoto() {
    try {
      const photo = await pickProfilePhoto(profile.photo);
      if (photo) profile.update({name: profile.name, avatar: profile.avatar, photo});
    } catch (err) {
      Alert.alert('Could not use that photo', err instanceof Error ? err.message : String(err));
    }
  }

  function finish() {
    profile.update({name, avatar: profile.avatar, photo: profile.photo});
    onDone();
  }

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: designTokens.black}}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{flexDirection: 'row', justifyContent: 'center', gap: 6, paddingTop: insets.top + 16}}>
        {STEPS.map(s => (
          <View
            key={s}
            style={{width: s === step ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: s === step ? designTokens.textPrimary : designTokens.chip}}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={{flexGrow: 1, padding: 24, paddingTop: 48}} keyboardShouldPersistTaps="handled">
        <Appear key={step} from="up">
          {/* Profile step shows the avatar instead, so there's one figure per screen. */}
          {step !== 'profile' ? (
            <Mascot
              pose={step === 'welcome' ? 'neutral' : 'reading'}
              width={step === 'welcome' ? 200 : 120}
              style={{alignSelf: 'center', marginBottom: 16}}
            />
          ) : null}
          {step === 'welcome' ? (
            <Title
              title="Capture"
              body="Dump thoughts, tasks and notes in your own words. Capture sorts them out on your phone, with nothing sent anywhere."
            />
          ) : null}

          {step === 'vault' ? (
            <>
              <Title
                title="Create your vault"
                body="One folder holds everything: your items, the AI model and your photos. Name it and choose where it lives."
              />
              <TextInput value={vaultName} onChangeText={setVaultName} placeholder="Vault name" placeholderTextColor={designTokens.textTertiary} style={field} />
              <View style={{gap: 10, marginTop: 16}}>
                {VAULT_LOCATIONS.map(option => {
                  const active = option.value === location;
                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setLocation(option.value)}
                      accessibilityRole="radio"
                      accessibilityState={{selected: active}}
                      style={{
                        flexDirection: 'row',
                        gap: 12,
                        padding: 14,
                        borderRadius: radius.md,
                        backgroundColor: active ? designTokens.surfaceRaised : designTokens.card,
                      }}>
                      <Ionicons
                        name={active ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={active ? designTokens.textPrimary : designTokens.textTertiary}
                      />
                      <View style={{flex: 1, gap: 2}}>
                        <Text style={{color: designTokens.textPrimary, fontSize: 15, fontWeight: '600'}}>{option.label}</Text>
                        <Text style={{color: designTokens.textTertiary, fontSize: 13, lineHeight: 18}}>{option.hint}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : null}

          {step === 'profile' ? (
            <>
              <Pressable onPress={choosePhoto} style={{alignItems: 'center', gap: 8, marginBottom: 20}}>
                <Avatar size={112} />
                <Text style={{color: designTokens.textTertiary, fontSize: 13}}>{profile.photo ? 'Change photo' : 'Add a photo (optional)'}</Text>
              </Pressable>
              <Title title="About you" body="Pick a companion, a look, and add your name." />
              <View style={{marginBottom: 20}}>
                <CharacterPicker />
              </View>
              <View style={{marginBottom: 24}}>
                <ThemePicker />
              </View>
              <TextInput value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={designTokens.textTertiary} style={field} />
            </>
          ) : null}
        </Appear>
      </ScrollView>

      <View style={{paddingHorizontal: 24, paddingBottom: insets.bottom + 16, gap: 12}}>
        {step === 'welcome' ? <PrimaryButton label="Get started" onPress={() => setStep('vault')} /> : null}
        {step === 'vault' ? (
          <PrimaryButton label="Create vault" loading={busy} disabled={!vaultName.trim()} onPress={makeVault} />
        ) : null}
        {step === 'profile' ? <PrimaryButton label={name.trim() ? 'Finish' : 'Skip for now'} onPress={finish} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}
