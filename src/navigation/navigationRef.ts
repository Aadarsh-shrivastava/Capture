import {createNavigationContainerRef} from '@react-navigation/native';

/** For navigating from outside a screen (e.g. tapping a toast). */
export const navigationRef = createNavigationContainerRef<Record<string, object | undefined>>();
