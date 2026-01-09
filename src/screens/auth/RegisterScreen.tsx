import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

export const RegisterScreen = () => {
  const { t } = useTranslation();
  const { signUp } = useAuthStore();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  const handleRegister = async () => {
    try {
      await signUp(email, password, fullName);
      Alert.alert(t('common.success'), t('auth.accountCreated'));
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        placeholder={t('auth.fullName')}
        placeholderTextColor={colors.placeholder}
        value={fullName}
        onChangeText={setFullName}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
      <TextInput
        placeholder={t('auth.email')}
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        autoCapitalize="none"
      />
      <TextInput
        placeholder={t('auth.password')}
        placeholderTextColor={colors.placeholder}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
      />
      <Button title={t('auth.signUp')} onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
});
