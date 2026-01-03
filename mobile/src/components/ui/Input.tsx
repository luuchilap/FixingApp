import React from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { colors, spacing, typography, borderRadius, components } from '../../constants/designTokens';

export type InputSize = 'sm' | 'md' | 'lg';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  size?: InputSize;
  fullWidth?: boolean;
  containerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  size = 'md',
  fullWidth = true,
  containerStyle,
  leftIcon,
  rightIcon,
  style,
  ...textInputProps
}) => {
  const hasError = !!error;
  const showHelperText = error || helperText;

  return (
    <View style={[fullWidth && styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {textInputProps.required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputWrapper}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            styles[`input_${size}`],
            hasError && styles.input_error,
            leftIcon && styles.input_withLeftIcon,
            rightIcon && styles.input_withRightIcon,
            style,
          ]}
          placeholderTextColor={colors.text.tertiary}
          {...textInputProps}
        />
        
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      
      {showHelperText && (
        <Text style={[styles.helperText, hasError && styles.helperText_error]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  required: {
    color: colors.error[500],
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.white,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    paddingHorizontal: components.input.padding.horizontal,
  },
  input_sm: {
    height: components.input.height.sm,
    fontSize: typography.fontSize.sm,
    paddingHorizontal: spacing[2],
  },
  input_md: {
    height: components.input.height.md,
    fontSize: typography.fontSize.base,
  },
  input_lg: {
    height: components.input.height.lg,
    fontSize: typography.fontSize.lg,
  },
  input_error: {
    borderColor: colors.error[500],
  },
  input_withLeftIcon: {
    paddingLeft: spacing[10],
  },
  input_withRightIcon: {
    paddingRight: spacing[10],
  },
  leftIcon: {
    position: 'absolute',
    left: spacing[3],
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: spacing[3],
    zIndex: 1,
  },
  helperText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  helperText_error: {
    color: colors.error[500],
  },
});

