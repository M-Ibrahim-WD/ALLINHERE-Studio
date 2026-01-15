import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useThemeStore } from '../../store/themeStore';
import { useEditorStore } from '../../store/editorStore';
import { ProjectsStackParamList } from '../../types/navigation';
import { Project } from '../../types/editor';

type CreateProjectNavigationProp = NativeStackNavigationProp<ProjectsStackParamList, 'CreateProject'>;

const ASPECT_RATIOS: Project['aspectRatio'][] = ['16:9', '9:16', '1:1'];

export const CreateProjectScreen = () => {
  const { colors } = useThemeStore();
  const navigation = useNavigation<CreateProjectNavigationProp>();
  const createProject = useEditorStore((state) => state.createProject);

  const [name, setName] = useState('');
  const [aspectRatio, setAspectRatio] = useState<Project['aspectRatio']>('16:9');

  const handleCreate = () => {
    if (name.trim().length < 3) {
      Alert.alert('Error', 'Project name must be at least 3 characters long.');
      return;
    }

    createProject({ name, aspectRatio });
    navigation.navigate('Editor');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h2" style={styles.title}>New Project</Text>

      <Input
        label="Project Name"
        value={name}
        onChangeText={setName}
        placeholder="e.g., My Awesome Video"
      />

      <Text style={[styles.label, { color: colors.text }]}>Aspect Ratio</Text>
      <View style={styles.aspectRatioContainer}>
        {ASPECT_RATIOS.map((ratio) => (
          <Button
            key={ratio}
            title={ratio}
            onPress={() => setAspectRatio(ratio)}
            variant={aspectRatio === ratio ? 'primary' : 'outline'}
            style={styles.aspectRatioButton}
          />
        ))}
      </View>

      <Button
        title="Create Project"
        onPress={handleCreate}
        style={styles.button}
      />

      <Button
        title="Cancel"
        variant="ghost"
        onPress={() => navigation.goBack()}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  title: {
    marginBottom: 32,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  aspectRatioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  aspectRatioButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
});
