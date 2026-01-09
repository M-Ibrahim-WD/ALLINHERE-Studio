import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AuthService } from '../../services/auth.service';
import { useThemeStore } from '../../store/themeStore';

export const ForgotPasswordScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const [email, setEmail] = useState('');

  const handleResetPassword = async () => {
    try {
      await AuthService.resetPassword(email);
      Alert.alert(t('common.success'), t('auth.emailSent'));
    } catch (error) {
      Alert.alert(t('common.error'), (error as Error).message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TextInput
        placeholder={t('auth.email')}
        placeholderTextColor={colors.placeholder}
        value={email}
        onChangeText={setEmail}
        style={[styles.input, { color: colors.text, borderColor: colors.border }]}
        autoCapitalize="none"
      />
      <Button title={t('auth.resetPassword')} onPress={handleResetPassword} />
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
