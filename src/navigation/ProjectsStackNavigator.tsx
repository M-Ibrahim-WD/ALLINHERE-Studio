import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ProjectsStackParamList } from '../types/navigation';
import { ProjectsScreen } from '../screens/main/ProjectsScreen';
import { CreateProjectScreen } from '../screens/editor/CreateProjectScreen';
import { EditorScreen } from '../screens/editor/EditorScreen';

const Stack = createStackNavigator<ProjectsStackParamList>();

export const ProjectsStackNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Projects" component={ProjectsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="CreateProject" component={CreateProjectScreen} options={{ title: 'Create Project' }} />
      <Stack.Screen name="Editor" component={EditorScreen} />
    </Stack.Navigator>
  );
};
