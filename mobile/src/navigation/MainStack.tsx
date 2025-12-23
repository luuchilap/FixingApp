import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs, MainTabsParamList } from './MainTabs';

// MainStack can be used for modal screens or detailed views that need to be pushed on top of tabs
// For now, we'll use it to wrap the MainTabs
export type MainStackParamList = {
  MainTabs: undefined;
};

const Stack = createNativeStackNavigator<MainStackParamList>();

export const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="MainTabs" 
        component={MainTabs}
      />
    </Stack.Navigator>
  );
};

// Re-export MainTabsParamList for convenience
export type { MainTabsParamList };

