import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { colors, spacing, borderRadius, shadows, components } from '../../constants/designTokens';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'flat';

export interface CardProps extends Omit<TouchableOpacityProps, 'style'> {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: keyof typeof spacing;
  onPress?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 4,
  onPress,
  style,
  contentStyle,
  ...touchableProps
}) => {
  const cardStyle = [
    styles.card,
    styles[`card_${variant}`],
    { padding: spacing[padding] },
    style,
  ];

  const content = (
    <View style={[styles.content, contentStyle]}>{children}</View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.7}
        {...touchableProps}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: components.card.borderRadius,
    backgroundColor: colors.background.white,
  },
  card_default: {
    ...shadows.sm,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  card_elevated: {
    ...shadows.md,
  },
  card_outlined: {
    borderWidth: 1,
    borderColor: colors.border.default,
  },
  card_flat: {
    backgroundColor: colors.background.gray,
  },
  content: {
    // Content wrapper for additional styling if needed
  },
});

