import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { ProjectCard } from '../../components/ProjectCard';
import { Text } from '../../components/Text';
import { Button } from '../../components/Button';
import { useThemeStore } from '../../store/themeStore';
import { supabase, Tables } from '../../config/supabase';
import { useAuthStore } from '../../store/authStore';
import { Project } from '../../types';

export const ProjectsScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(Tables.PROJECTS)
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProjects(data as Project[]);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectPress = (project: Project) => {
    navigation.navigate('Editor', { projectId: project.id });
  };

  const handleCreatePress = () => {
    // Navigate to Main tab navigator, then to Create screen
    // @ts-ignore - navigation typing is strict
    navigation.navigate('Main', { screen: 'Create' });
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text variant="h2">{t('projects.title')}</Text>
        <Button 
          title={t('projects.newProject')} 
          size="small" 
          onPress={handleCreatePress} 
        />
      </View>

      {projects.length === 0 ? (
        <View style={styles.center}>
          <Text variant="h3" color={colors.textSecondary} style={{ marginBottom: 16 }}>
            {t('projects.noProjects')}
          </Text>
          <Button 
            title={t('projects.createFirst')} 
            onPress={handleCreatePress} 
          />
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={({ item }) => (
            <ProjectCard project={item} onPress={handleProjectPress} />
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={loading}
          onRefresh={fetchProjects}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 32, // Add some top margin for status bar
  },
  list: {
    paddingBottom: 20,
  },
});
