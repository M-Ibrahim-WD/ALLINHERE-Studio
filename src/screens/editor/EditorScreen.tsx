import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from '../../components/Text';
import { useThemeStore } from '../../store/themeStore';
import { useEditorStore } from '../../store/editorStore';

export const EditorScreen = () => {
  const { colors } = useThemeStore();
  const { currentProject } = useEditorStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h2">Editor</Text>
      {currentProject ? (
        <View style={styles.detailsContainer}>
          <Text>Project Name: {currentProject.name}</Text>
          <Text>Aspect Ratio: {currentProject.aspectRatio}</Text>
        </View>
      ) : (
        <Text>No project loaded.</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
});
