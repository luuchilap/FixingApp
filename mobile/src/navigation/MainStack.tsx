import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabs, MainTabsParamList } from './MainTabs';
import { SkillValue } from '../constants/skills';
import { JobDetailScreen } from '../screens/jobs/JobDetailScreen';
import { CreateJobScreen } from '../screens/jobs/CreateJobScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';
import { ChatScreen } from '../screens/chat/ChatScreen';

// MainStack can be used for modal screens or detailed views that need to be pushed on top of tabs
export type MainStackParamList = {
  MainTabs: undefined;
  JobDetail: { jobId: number };
  CreateJob: { skill?: SkillValue; address?: string } | undefined;
  ChatList: undefined;
  Chat: { conversationId: number };
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
      <Stack.Screen
        name="ChatList"
        component={ChatListScreen}
        options={{
          headerShown: true,
          title: 'Tin nhắn',
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
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: true,
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

