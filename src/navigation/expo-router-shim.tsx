import {
  CommonActions,
  StackActions,
  useFocusEffect as navigationUseFocusEffect,
  useNavigation,
  useRoute,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useCallback } from 'react';

type HrefObject = {
  pathname: string;
  params?: Record<string, string | undefined>;
};

type NavTarget = {
  screen: string;
  params?: Record<string, unknown>;
};

function parsePath(href: string): NavTarget {
  const [path, query = ''] = href.split('?');
  const params: Record<string, string> = {};
  if (query) {
    for (const part of query.split('&')) {
      const [k, v] = part.split('=');
      if (k) params[k] = decodeURIComponent(v ?? '');
    }
  }

  if (path === '/' || path === '/index' || path === '/(tabs)' || path === '/(tabs)/index') {
    return { screen: 'MainTabs', params: { screen: 'index', params } };
  }
  if (path.startsWith('/(tabs)/')) {
    let tab = path.replace('/(tabs)/', '');
    if (tab === 'items') tab = 'library';
    if (tab === 'home' || tab === 'today' || tab === 'focus') tab = 'index';
    if (tab === 'history') tab = 'timeline';
    if (tab === 'groups') return { screen: 'Groups', params };
    if (tab === 'timeline') return { screen: 'Timeline', params };
    return { screen: 'MainTabs', params: { screen: tab, params } };
  }
  if (path === '/library') return { screen: 'MainTabs', params: { screen: 'library', params } };
  if (path === '/library/list' || path === '/list') return { screen: 'LibraryList', params };
  if (path === '/groups') return { screen: 'Groups', params };
  if (path === '/timeline') return { screen: 'Timeline', params };
  if (path === '/create-item') return { screen: 'CreateItem', params };
  if (path === '/settings') return { screen: 'Settings', params };
  if (path === '/history') return { screen: 'History', params };
  if (path === '/habits') return { screen: 'Habits', params };
  if (path === '/routines') return { screen: 'Routines', params };
  if (path === '/profile') return { screen: 'Profile', params };
  if (path === '/home' || path === '/focus') return { screen: 'MainTabs', params: { screen: 'index', params } };

  const itemMatch = path.match(/^\/item\/([^/]+)$/);
  if (itemMatch) return { screen: 'ItemDetail', params: { id: itemMatch[1], ...params } };

  const groupMatch = path.match(/^\/group\/([^/]+)$/);
  if (groupMatch) return { screen: 'GroupDetail', params: { id: groupMatch[1], ...params } };

  return { screen: path.replace(/^\//, ''), params };
}

function resolveTarget(href: string | HrefObject): NavTarget {
  if (typeof href === 'string') {
    return parsePath(href);
  }
  const base = parsePath(href.pathname);
  const baseParams = (base.params ?? {}) as Record<string, unknown>;
  const nestedParams = (baseParams.params ?? {}) as Record<string, unknown>;
  if (baseParams.screen) {
    return {
      screen: base.screen,
      params: {
        ...baseParams,
        params: { ...nestedParams, ...(href.params ?? {}) },
      },
    };
  }
  return {
    screen: base.screen,
    params: { ...baseParams, ...(href.params ?? {}) },
  };
}

function getRootNavigation(navigation: NavigationProp<ParamListBase>) {
  let current: NavigationProp<ParamListBase> = navigation;
  while (current.getParent()) {
    current = current.getParent()!;
  }
  return current;
}

function navigateToTarget(
  navigation: NavigationProp<ParamListBase>,
  href: string | HrefObject,
  mode: 'push' | 'replace',
) {
  const { screen, params } = resolveTarget(href);
  const root = getRootNavigation(navigation);

  if (screen === 'MainTabs') {
    if (mode === 'replace') {
      root.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs', params: params as object }],
        }),
      );
      return;
    }
    root.navigate('MainTabs' as never, params as never);
    return;
  }

  if (mode === 'replace') {
    root.dispatch(StackActions.replace(screen, params));
    return;
  }

  root.navigate(screen as never, params as never);
}

export function useRouter() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();

  return {
    push: (href: string | HrefObject) => navigateToTarget(navigation, href, 'push'),
    replace: (href: string | HrefObject) => navigateToTarget(navigation, href, 'replace'),
    back: () => {
      if (navigation.canGoBack()) {
        navigation.goBack();
        return;
      }
      getRootNavigation(navigation).goBack();
    },
  };
}

export function useLocalSearchParams<
  T extends Record<string, string | undefined> = Record<string, string | undefined>,
>() {
  const route = useRoute<any>();
  const params = route.params ?? {};

  if (params.params && typeof params.params === 'object') {
    return { ...params, ...params.params } as T;
  }

  return params as T;
}

export function useFocusEffect(effect: () => void | (() => void)) {
  const wrapped = useCallback(effect, [effect]);
  navigationUseFocusEffect(wrapped);
}

export function Stack() {
  return null;
}

export function Tabs() {
  return null;
}

Stack.Screen = function StackScreen() {
  return null;
};

Tabs.Screen = function TabScreen() {
  return null;
};
