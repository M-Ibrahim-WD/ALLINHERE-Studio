import { NavigatorScreenParams } from '@react-navigation/native';
import { Project } from './index';

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type ProjectsStackParamList = {
  Projects: undefined;
  CreateProject: undefined;
  Editor: undefined; // No project ID is needed here for now as we use Zustand
};

export type MainTabParamList = {
  Home: undefined;
  ProjectsStack: NavigatorScreenParams<ProjectsStackParamList>;
  Create: undefined;
  Camera: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Editor: { projectId: string };
  Export: { projectId: string };
  Subscription: undefined;
  Settings: undefined;
  ProjectDetails: { project: Project };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
