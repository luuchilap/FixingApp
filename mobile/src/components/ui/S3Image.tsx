import React, { useState, useEffect, useRef } from 'react';
import {
  Image,
  ImageProps,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { colors, typography, spacing, borderRadius } from '../../constants/designTokens';

export interface S3ImageProps extends Omit<ImageProps, 'source'> {
  uri: string | undefined | null;
  fallbackText?: string;
  fallbackEmoji?: string;
  showLoadingIndicator?: boolean;
}

export const S3Image: React.FC<S3ImageProps> = ({
  uri,
  fallbackText,
  fallbackEmoji = '📷',
  showLoadingIndicator = true,
  style,
  ...imageProps
}) => {
  const [isLoading, setIsLoading] = useState(!!uri);
  const [hasError, setHasError] = useState(false);
  const loadingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset states when uri changes
  useEffect(() => {
    setHasError(false);
    setIsLoading(!!uri);

    // Safety timeout: dismiss loading after 10s even if onLoadEnd never fires
    if (uri) {
      loadingTimeout.current = setTimeout(() => {
        setIsLoading(false);
      }, 10000);
    }

    return () => {
      if (loadingTimeout.current) {
        clearTimeout(loadingTimeout.current);
      }
    };
  }, [uri]);

  // If no URI provided, show placeholder
  if (!uri) {
    return (
      <View style={[styles.placeholder, style]}>
        <Text style={styles.placeholderEmoji}>{fallbackEmoji}</Text>
        {fallbackText && (
          <Text style={styles.placeholderText}>{fallbackText}</Text>
        )}
      </View>
    );
  }

  // If there was an error loading the image, show error state
  if (hasError) {
    return (
      <View style={[styles.errorContainer, style]}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>Không tải được ảnh</Text>
      </View>
    );
  }

  return (
    <View style={style}>
      <Image
        {...imageProps}
        source={{
          uri,
          cache: Platform.OS === 'ios' ? 'default' : undefined,
        }}
        style={[styles.image, style]}
        onLoad={() => {
          if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
          setIsLoading(false);
        }}
        onError={(error) => {
          if (loadingTimeout.current) clearTimeout(loadingTimeout.current);
          console.warn('S3Image load error:', uri, error.nativeEvent.error);
          setIsLoading(false);
          setHasError(true);
        }}
      />
      {showLoadingIndicator && isLoading && (
        <View style={[styles.loadingOverlay, StyleSheet.absoluteFill]}>
          <ActivityIndicator size="small" color={colors.primary[500]} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  placeholderText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[1],
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: colors.error[50],
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  errorEmoji: {
    fontSize: 24,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error[600],
    marginTop: spacing[1],
    textAlign: 'center',
  },
  loadingOverlay: {
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
});
