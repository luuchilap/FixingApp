import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs, MainTabsParamList } from './MainTabs';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { CreateJobScreen } from '../screens/jobs/CreateJobScreen';

// MainStack can be used for modal screens or detailed views that need to be pushed on top of tabs
export type MainStackParamList = {
  MainTabs: undefined;
  JobDetail: { jobId: number };
  CreateJob: undefined;
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
      <Stack.Screen
        name="JobDetail"
        component={JobDetailScreen}
        options={{
          headerShown: true,
          title: 'Chi tiết công việc',
          headerStyle: {
            backgroundColor: '#0284c7',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
      <Stack.Screen
        name="CreateJob"
        component={CreateJobScreen}
        options={{
          headerShown: true,
          title: 'Đăng công việc',
          headerStyle: {
            backgroundColor: '#0284c7',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </Stack.Navigator>
  );
};

// Re-export MainTabsParamList for convenience
export type { MainTabsParamList };

