import React from 'react';
import { View, ViewProps, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';

interface CardProps extends ViewProps {
  padding?: number;
}

export const Card = ({
  padding = 16,
  style,
  ...props
}: CardProps) => {
  const { colors } = useThemeStore();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          padding,
        },
        style,
      ]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
