import React from 'react';
import { View, TextInput, TextInputProps, StyleSheet, StyleProp, TextStyle } from 'react-native';
import { Text } from './Text';
import { useThemeStore } from '../store/themeStore';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  style?: StyleProp<TextStyle>;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
}

export const Input = ({
  label,
  error,
  style,
  ...props
}: InputProps) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      {label && (
        <Text variant="label" style={styles.label}>
          {label}
        </Text>
      )}
      <TextInput
        style={[
          styles.input,
          {
            color: colors.text,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
          },
          style,
        ]}
        placeholderTextColor={colors.placeholder}
        {...props}
      />
      {error && (
        <Text variant="caption" color={colors.error} style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: {
    marginTop: 4,
  },
});
