declare module 'expo-router' {
  import type { ReactNode } from 'react';

  export function useRouter(): {
    push: (href: string | { pathname: string; params?: Record<string, string | undefined> }) => void;
    replace: (href: string | { pathname: string; params?: Record<string, string | undefined> }) => void;
    back: () => void;
  };

  export function useLocalSearchParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T;

  export function useFocusEffect(effect: () => void | (() => void)): void;

  export function Stack(): null;
  export function Tabs(): null;

  namespace Stack {
    function Screen(_props: Record<string, unknown>): null;
  }
  namespace Tabs {
    function Screen(_props: Record<string, unknown>): null;
  }
}
