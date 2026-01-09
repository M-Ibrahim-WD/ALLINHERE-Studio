import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text } from './Text';
import { Card } from './Card';
import { Project } from '../types';
import { useThemeStore } from '../store/themeStore';

interface ProjectCardProps {
  project: Project;
  onPress: (project: Project) => void;
}

export const ProjectCard = ({ project, onPress }: ProjectCardProps) => {
  const { colors } = useThemeStore();

  return (
    <TouchableOpacity onPress={() => onPress(project)} activeOpacity={0.8}>
      <Card padding={0} style={styles.container}>
        <View style={[styles.thumbnail, { backgroundColor: colors.surface }]}>
          {project.thumbnail_url ? (
            <Image source={{ uri: project.thumbnail_url }} style={styles.image} />
          ) : (
            <View style={styles.placeholder}>
              <Text variant="h3" color={colors.textSecondary}>
                No Preview
              </Text>
            </View>
          )}
          <View style={styles.durationBadge}>
            <Text variant="caption" color="#FFFFFF">
              {formatDuration(project.duration)}
            </Text>
          </View>
        </View>
        <View style={styles.info}>
          <Text variant="h3" numberOfLines={1}>
            {project.name}
          </Text>
          <Text variant="caption" color={colors.textSecondary}>
            Last edited {new Date(project.last_edited_at).toLocaleDateString()}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );
};

const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    overflow: 'hidden',
  },
  thumbnail: {
    height: 150,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  info: {
    padding: 12,
  },
});
