import React, { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../types/navigation';
import { Text } from '../../components/Text';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { supabase, Tables } from '../../config/supabase';

export const CreateScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const { user } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('common.error'), 'Project name is required');
      return;
    }

    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from(Tables.PROJECTS)
        .insert({
          user_id: user.id,
          name,
          description,
          duration: 0,
          resolution: '1080p',
          fps: 30,
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        // Navigate to editor
        navigation.replace('Editor', { projectId: data.id });
      }
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="h2" style={styles.title}>{t('projects.newProject')}</Text>
      
      <Input
        label={t('projects.projectName')}
        value={name}
        onChangeText={setName}
        placeholder="My Awesome Video"
      />
      
      <Input
        label={t('projects.projectDescription')}
        value={description}
        onChangeText={setDescription}
        placeholder="Optional description"
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: 'top' }}
      />
      
      <Button
        title={t('common.create')}
        onPress={handleCreate}
        loading={loading}
        style={styles.button}
      />

      <Button
        title={t('common.cancel')}
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
  button: {
    marginTop: 16,
    marginBottom: 8,
  },
});
