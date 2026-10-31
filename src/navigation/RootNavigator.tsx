import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { BottomTabBar } from '@/components/BottomTabBar/BottomTabBar';
import { GroupPage, GroupsListScreen } from '@/groups';
import { EditItemTypeScreen, ItemTypesScreen } from '@/itemTypes';
import { SearchScreen } from '@/search';
import { CreateItemScreen } from '@/screens/CreateItemScreen/CreateItemScreen';
import { FocusScreen } from '@/screens/FocusScreen/FocusScreen';
import { ItemDetailScreen } from '@/screens/ItemDetailScreen/ItemDetailScreen';
import { ItemsScreen } from '@/screens/ItemsScreen/ItemsScreen';
import { ListScreen } from '@/screens/ListScreen/ListScreen';
import { ProfileScreen } from '@/profile';
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
      <Tab.Screen name="library" component={ItemsScreen} options={{ title: 'Library' }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="CreateItem" component={CreateItemScreen} />
      <Stack.Screen name="LibraryList" component={ListScreen} />
      <Stack.Screen name="Groups" component={GroupsListScreen} />
      <Stack.Screen name="Timeline" component={TimelineScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="GroupDetail" component={GroupPage} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ItemTypes" component={ItemTypesScreen} />
      <Stack.Screen name="EditItemType" component={EditItemTypeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
