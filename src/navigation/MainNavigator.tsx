import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../types/navigation';
import { HomeScreen } from '../screens/main/HomeScreen';
import { CreateScreen } from '../screens/main/CreateScreen';
import { CameraScreen } from '../screens/main/CameraScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { useThemeStore } from '../store/themeStore';
import { ProjectsStackNavigator } from './ProjectsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainNavigator = () => {
  const { colors } = useThemeStore();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="ProjectsStack" component={ProjectsStackNavigator} options={{ title: 'Projects' }} />
      <Tab.Screen name="Create" component={CreateScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};
