import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius, components } from '../../constants/designTokens';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title?: string;
  children?: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle[] => {
    const baseStyle: ViewStyle[] = [
      styles.button,
      styles[`button_${size}`],
      styles[`button_${variant}`],
    ];

    if (fullWidth) {
      baseStyle.push(styles.button_fullWidth);
    }
    if (isDisabled) {
      baseStyle.push(styles.button_disabled);
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle[] => {
    const textStyles: TextStyle[] = [
      styles.text,
      styles[`text_${size}`],
      styles[`text_${variant}`],
    ];

    if (isDisabled) {
      textStyles.push(styles.text_disabled);
    }

    return textStyles;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'danger' ? colors.text.inverse : colors.primary[500]}
          size="small"
        />
      ) : (
        // Prefer children when provided (allows usage like <Button>Text</Button>),
        // otherwise fall back to the `title` prop for backwards compatibility.
        children ? (
          typeof children === 'string' ? (
            <Text style={[...getTextStyle(), textStyle]}>{children}</Text>
          ) : (
            // If children is a React element, render it directly.
            children
          )
        ) : (
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        )
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  
  // Sizes
  button_sm: {
    height: components.button.height.sm,
    paddingHorizontal: components.button.padding.sm.horizontal,
    paddingVertical: components.button.padding.sm.vertical,
  },
  button_md: {
    height: components.button.height.md,
    paddingHorizontal: components.button.padding.md.horizontal,
    paddingVertical: components.button.padding.md.vertical,
  },
  button_lg: {
    height: components.button.height.lg,
    paddingHorizontal: components.button.padding.lg.horizontal,
    paddingVertical: components.button.padding.lg.vertical,
  },
  
  // Variants
  button_primary: {
    backgroundColor: colors.primary[500],
  },
  button_secondary: {
    backgroundColor: colors.neutral[200],
  },
  button_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  button_danger: {
    backgroundColor: colors.error[500],
  },
  button_ghost: {
    backgroundColor: 'transparent',
  },
  
  // States
  button_disabled: {
    opacity: 0.6,
  },
  button_fullWidth: {
    width: '100%',
  },
  
  // Text styles
  text: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  text_sm: {
    fontSize: typography.fontSize.sm,
  },
  text_md: {
    fontSize: typography.fontSize.base,
  },
  text_lg: {
    fontSize: typography.fontSize.lg,
  },
  
  // Text variants
  text_primary: {
    color: colors.text.inverse,
  },
  text_secondary: {
    color: colors.text.primary,
  },
  text_outline: {
    color: colors.primary[500],
  },
  text_danger: {
    color: colors.text.inverse,
  },
  text_ghost: {
    color: colors.primary[500],
  },
  text_disabled: {
    opacity: 0.7,
  },
});

