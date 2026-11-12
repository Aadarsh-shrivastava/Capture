import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GroupPage, GroupsListScreen } from '@/groups';
import { EditItemTypeScreen, ItemTypesScreen } from '@/itemTypes';
import { AppearanceScreen } from '@/screens/AppearanceScreen/AppearanceScreen';
import { ChatScreen } from '@/screens/ChatScreen/ChatScreen';
import { SearchScreen } from '@/search';
import { CreateItemScreen } from '@/screens/CreateItemScreen/CreateItemScreen';
import { FocusScreen } from '@/screens/FocusScreen/FocusScreen';
import { ItemDetailScreen } from '@/screens/ItemDetailScreen/ItemDetailScreen';
import { ListScreen } from '@/screens/ListScreen/ListScreen';
import { ProfileScreen } from '@/profile';
import { SettingsScreen } from '@/screens/SettingsScreen/SettingsScreen';
import { ThoughtsScreen } from '@/screens/ThoughtsScreen/ThoughtsScreen';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Focus is home: what to do right now. Thoughts (with the library on top) is pushed over it, with a back button. */}
      <Stack.Screen name="Focus" component={FocusScreen} />
      <Stack.Screen name="Thoughts" component={ThoughtsScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CreateItem" component={CreateItemScreen} />
      <Stack.Screen name="LibraryList" component={ListScreen} />
      <Stack.Screen name="Groups" component={GroupsListScreen} />
      <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
      <Stack.Screen name="GroupDetail" component={GroupPage} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Search" component={SearchScreen} />
      <Stack.Screen name="ItemTypes" component={ItemTypesScreen} />
      <Stack.Screen name="Appearance" component={AppearanceScreen} />
      <Stack.Screen name="EditItemType" component={EditItemTypeScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
