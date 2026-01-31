import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import { autocomplete, getPlaceDetails, geocode, LocationSuggestion } from '../../services/trackasiaApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

export interface AddressAutocompleteProps {
  value: string;
  onChange: (address: string, latitude?: number, longitude?: number) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  label?: string;
  onFocus?: () => void;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'Nhập địa chỉ...',
  required = false,
  error,
  label,
  onFocus: onFocusProp,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const isSelectingRef = useRef(false); // Prevent re-triggering autocomplete after selection

  // Sync input value with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced autocomplete
  useEffect(() => {
    // Don't trigger if we just selected a suggestion
    if (isSelectingRef.current) {
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!inputValue || inputValue.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await autocomplete(inputValue, 5);
        setSuggestions(results);
        setShowSuggestions(results.length > 0 && !isSelectingRef.current);
      } catch (error) {
        console.error('Autocomplete error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [inputValue]);

  const handleSelect = async (suggestion: LocationSuggestion) => {
    // Set flag to prevent re-triggering autocomplete
    isSelectingRef.current = true;
    
    const address = suggestion.fullAddress || suggestion.address;
    
    // Close suggestions immediately
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Update input value immediately
    setInputValue(address);
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Update parent component with address immediately
    onChange(address);
    
    // Get coordinates in background
    try {
      if (suggestion.placeId) {
        try {
          const placeDetails = await getPlaceDetails(suggestion.placeId);
          onChange(address, placeDetails.latitude, placeDetails.longitude);
        } catch (error) {
          console.error('Place details error:', error);
          // Fallback to geocoding
          try {
            const geocodeResult = await geocode(address);
            onChange(address, geocodeResult.latitude, geocodeResult.longitude);
          } catch (geocodeError) {
            console.error('Geocoding error:', geocodeError);
          }
        }
      } else {
        // If no place_id, try geocoding
        try {
          const geocodeResult = await geocode(address);
          onChange(address, geocodeResult.latitude, geocodeResult.longitude);
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
        }
      }
    } finally {
      // Reset flag after a short delay to allow input to update
      setTimeout(() => {
        isSelectingRef.current = false;
      }, 500);
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    onChange(text);
    isSelectingRef.current = false; // Reset when user types
  };

  const handleInputBlur = () => {
    // Delay hiding suggestions to allow tap on suggestion
    setTimeout(() => {
      if (!isSelectingRef.current) {
        setShowSuggestions(false);
      }
    }, 200);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
    // Call parent onFocus handler (for keyboard avoidance)
    onFocusProp?.();
  };

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, error && styles.inputError]}
          value={inputValue}
          onChangeText={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.text.tertiary}
        />
        {isLoading && (
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color={colors.primary[500]} />
          </View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {showSuggestions && suggestions.length > 0 && (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionAddress}>{item.address}</Text>
              {item.fullAddress !== item.address && (
                <Text style={styles.suggestionFullAddress}>{item.fullAddress}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
    zIndex: 1,
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
    position: 'relative',
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.white,
    color: colors.text.primary,
    fontSize: typography.fontSize.base,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    paddingRight: spacing[10],
  },
  inputError: {
    borderColor: colors.error[500],
  },
  loadingIndicator: {
    position: 'absolute',
    right: spacing[3],
    top: spacing[2],
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error[500],
    marginTop: spacing[1],
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.default,
    marginTop: spacing[1],
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  suggestionItem: {
    padding: spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  suggestionAddress: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  suggestionFullAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
});

