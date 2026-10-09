import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabBar } from '@/components/BottomTabBar/BottomTabBar';
import { CreateItemScreen } from '@/screens/CreateItemScreen/CreateItemScreen';
import { FocusScreen } from '@/screens/FocusScreen/FocusScreen';
import { GroupDetailScreen } from '@/screens/GroupDetailScreen/GroupDetailScreen';
import { GroupsScreen } from '@/screens/GroupsScreen/GroupsScreen';
import { HabitsScreen } from '@/screens/HabitsScreen/HabitsScreen';
import { HistoryScreen } from '@/screens/HistoryScreen/HistoryScreen';
import { ItemDetailScreen } from '@/screens/ItemDetailScreen/ItemDetailScreen';
import { ItemsScreen } from '@/screens/ItemsScreen/ItemsScreen';
import { ListScreen } from '@/screens/ListScreen/ListScreen';
import { ProfileScreen } from '@/screens/ProfileScreen/ProfileScreen';
import { RoutinesScreen } from '@/screens/RoutinesScreen/RoutinesScreen';
import { SettingsScreen } from '@/screens/SettingsScreen/SettingsScreen';
import { TimelineScreen } from '@/screens/TimelineScreen/TimelineScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="index" component={FocusScreen} options={{ title: 'Focus' }} />
      <Tab.Screen name="groups" component={GroupsScreen} options={{ title: 'Groups' }} />
      <Tab.Screen name="library" component={ItemsScreen} options={{ title: 'Library' }} />
      <Tab.Screen name="timeline" component={TimelineScreen} options={{ title: 'Timeline' }} />
      <Tab.Screen name="profile" component={ProfileScreen} options={{ title: 'Profile', tabBarButton: () => null }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CreateItem" component={CreateItemScreen} options={{ presentation: 'modal' }} />
      <Stack.Screen name="LibraryList" component={ListScreen} />
      <Stack.Screen name="Groups" component={GroupsScreen} />
      <Stack.Screen name="Timeline" component={TimelineScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="GroupDetail" component={GroupDetailScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="Habits" component={HabitsScreen} />
      <Stack.Screen name="Routines" component={RoutinesScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
