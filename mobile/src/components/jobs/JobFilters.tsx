import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Card } from '../ui/Card';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SKILLS, SkillValue } from '../../constants/skills';
import { useAuth } from '../../hooks/useAuth';
import { geocode, reverseGeocode } from '../../services/trackasiaApi';

type DistanceOption = '1' | '3' | '5' | '';

const DISTANCE_OPTIONS: Array<{ value: DistanceOption; label: string }> = [
  { value: '1', label: '< 1km' },
  { value: '3', label: '1-3km' },
  { value: '5', label: '3-5km' },
];

export interface JobFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  latitude?: number;
  longitude?: number;
  maxDistance?: number;
}

interface JobFiltersProps {
  filters: JobFilters;
  onFilterChange: (filters: JobFilters) => void;
  onClear: () => void;
}

export const JobFilters: React.FC<JobFiltersProps> = ({
  filters,
  onFilterChange,
  onClear,
}) => {
  const { user } = useAuth();
  const scrollViewRef = React.useRef<ScrollView>(null);
  const [keyword, setKeyword] = React.useState(filters.keyword || '');
  const [category, setCategory] = React.useState<SkillValue | ''>(filters.category || '');
  const [minPrice, setMinPrice] = React.useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = React.useState(filters.maxPrice?.toString() || '');
  const [useLocation, setUseLocation] = React.useState(false);
  const [locationAddress, setLocationAddress] = React.useState('');
  const [locationLat, setLocationLat] = React.useState<number | undefined>(filters.latitude);
  const [locationLon, setLocationLon] = React.useState<number | undefined>(filters.longitude);
  const [distance, setDistance] = React.useState<DistanceOption>(
    filters.maxDistance ? filters.maxDistance.toString() as DistanceOption : ''
  );
  const [locationError, setLocationError] = React.useState<string | null>(null);
  const [isGettingLocation, setIsGettingLocation] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  // Get user's current location
  const handleGetLocation = async () => {
    setLocationError(null);
    setIsGettingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Không có quyền truy cập vị trí. Vui lòng cấp quyền trong cài đặt.');
        setIsGettingLocation(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const lat = location.coords.latitude;
      const lon = location.coords.longitude;

      setLocationLat(lat);
      setLocationLon(lon);
      setUseLocation(true);
      setLocationError(null);

      // Reverse geocode to get address
      try {
        const address = await reverseGeocode(lat, lon);
        setLocationAddress(address);
      } catch {}
    } catch {
      setLocationError('Không thể lấy vị trí. Vui lòng nhập địa chỉ thủ công.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Get user's registered address location
  const handleGetRegisteredLocation = async () => {
    setLocationError(null);

    if (!user) {
      setLocationError('Vui lòng đăng nhập để sử dụng tính năng này.');
      return;
    }

    if (!user.address || user.address.trim().length === 0) {
      setLocationError('Chưa đăng ký vị trí. Vui lòng cập nhật địa chỉ trong hồ sơ của bạn.');
      return;
    }

    setIsGettingLocation(true);
    try {
      const geocodeResult = await geocode(user.address);
      setLocationAddress(user.address);
      setLocationLat(geocodeResult.latitude);
      setLocationLon(geocodeResult.longitude);
      setUseLocation(true);
      setLocationError(null);
    } catch {
      setLocationError('Không thể lấy tọa độ từ địa chỉ đã đăng ký. Vui lòng nhập địa chỉ thủ công.');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleApply = () => {
    const newFilters: JobFilters = {};
    
    if (keyword.trim()) {
      newFilters.keyword = keyword.trim();
    }
    
    if (category) {
      newFilters.category = category;
    }
    
    if (minPrice.trim()) {
      const min = parseInt(minPrice.trim(), 10);
      if (!isNaN(min) && min > 0) {
        newFilters.minPrice = min;
      }
    }
    
    if (maxPrice.trim()) {
      const max = parseInt(maxPrice.trim(), 10);
      if (!isNaN(max) && max > 0) {
        newFilters.maxPrice = max;
      }
    }

    // Location-based filtering
    if (useLocation && locationLat && locationLon && distance) {
      newFilters.latitude = locationLat;
      newFilters.longitude = locationLon;
      newFilters.maxDistance = parseFloat(distance);
    }

    onFilterChange(newFilters);
  };

  // Reset location when distance is cleared
  React.useEffect(() => {
    if (!distance) {
      setUseLocation(false);
      setLocationAddress('');
      setLocationLat(undefined);
      setLocationLon(undefined);
    }
  }, [distance]);

  const hasActiveFilters = 
    keyword.trim() || 
    category || 
    minPrice.trim() || 
    maxPrice.trim() || 
    (useLocation && locationLat && locationLon && distance);

  // Enable LayoutAnimation on Android (run once)
  React.useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      // @ts-ignore
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((v) => !v);
  };

  return (
    <Card variant="default" style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={toggleExpanded} style={styles.headerTouchable} activeOpacity={0.8}>
          <Text style={styles.chevron}>{expanded ? '▾' : '▸'}</Text>
          <Text style={styles.title}>Lọc công việc</Text>
        </TouchableOpacity>

        {hasActiveFilters && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      {expanded && (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollView} 
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={true}
          >
            <View style={styles.form}>
            <Input
              label="Từ khóa tìm kiếm"
              placeholder="Tìm theo tiêu đề hoặc mô tả..."
              value={keyword}
              onChangeText={setKeyword}
              containerStyle={styles.inputContainer}
            />

            <Select
              label="Kỹ năng yêu cầu"
              placeholder="-- Tất cả kỹ năng --"
              value={category}
              onChange={(value) => setCategory(value as SkillValue | '')}
              options={SKILLS.map((skill) => ({
                label: skill.label,
                value: skill.value,
              }))}
            />

            <View style={styles.priceRow}>
              <View style={styles.priceInput}>
                <Input
                  label="Giá tối thiểu (VNĐ)"
                  placeholder="0"
                  value={minPrice}
                  onChangeText={setMinPrice}
                  keyboardType="numeric"
                  containerStyle={styles.inputContainer}
                />
              </View>
              <View style={styles.priceInput}>
                <Input
                  label="Giá tối đa (VNĐ)"
                  placeholder="0"
                  value={maxPrice}
                  onChangeText={setMaxPrice}
                  keyboardType="numeric"
                  containerStyle={styles.inputContainer}
                />
              </View>
            </View>

            {/* Location-based search */}
            <View style={styles.locationSection}>
              <View style={styles.locationHeader}>
                <Text style={styles.locationTitle}>Tìm kiếm công việc gần bạn</Text>
                <View style={styles.locationButtons}>
                  <TouchableOpacity
                    style={[styles.locationButton, isGettingLocation && styles.locationButtonDisabled]}
                    onPress={handleGetLocation}
                    disabled={isGettingLocation}
                  >
                    {isGettingLocation ? (
                      <ActivityIndicator size="small" color={colors.primary[600]} />
                    ) : (
                      <Text style={styles.locationButtonText}>📍 Hiện tại</Text>
                    )}
                  </TouchableOpacity>
                  {user && (
                    <TouchableOpacity
                      style={[styles.locationButton, styles.locationButtonSecondary, isGettingLocation && styles.locationButtonDisabled]}
                      onPress={handleGetRegisteredLocation}
                      disabled={isGettingLocation}
                    >
                      {isGettingLocation ? (
                        <ActivityIndicator size="small" color={colors.neutral[600]} />
                      ) : (
                        <Text style={[styles.locationButtonText, styles.locationButtonTextSecondary]}>🏠 Đã đăng ký</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {locationError && (
                <Text style={styles.locationError}>{locationError}</Text>
              )}

              <View style={styles.addressInputContainer}>
                <AddressAutocomplete
                  label="Hoặc nhập địa chỉ"
                  value={locationAddress}
                  onChange={(addr, lat, lng) => {
                    setLocationAddress(addr);
                    setLocationLat(lat);
                    setLocationLon(lng);
                    if (lat && lng) {
                      setUseLocation(true);
                      setLocationError(null);
                    }
                  }}
                  placeholder="Nhập địa chỉ để tìm kiếm..."
                />
              </View>

              {(useLocation && (locationLat || locationAddress)) && (
                <View style={styles.distanceContainer}>
                  <Select
                    label="Khoảng cách:"
                    placeholder="-- Chọn khoảng cách --"
                    value={distance}
                    onChange={(value) => setDistance(value as DistanceOption)}
                    options={DISTANCE_OPTIONS}
                  />
                  {locationLat && locationLon && (
                    <Text style={styles.coordinatesText}>
                      Vị trí: {locationLat.toFixed(6)}, {locationLon.toFixed(6)}
                    </Text>
                  )}
                </View>
              )}
            </View>

            <Button
              variant="primary"
              onPress={() => {
                handleApply();
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setExpanded(false);
              }}
              style={styles.applyButton}
              fullWidth
            >
              Lọc kết quả
            </Button>
          </View>
        </ScrollView>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    paddingHorizontal: spacing[1],
  },
  headerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  chevron: {
    fontSize: typography.fontSize.lg,
    color: colors.text.primary,
    marginRight: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  clearButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary[600],
    fontWeight: typography.fontWeight.medium,
  },
  scrollView: {
    maxHeight: 600,
  },
  form: {
    padding: spacing[4],
    gap: spacing[3],
  },
  inputContainer: {
    marginBottom: 0,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  priceInput: {
    flex: 1,
  },
  locationSection: {
    backgroundColor: colors.background.gray,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  locationTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    flex: 1,
  },
  locationButtons: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  locationButton: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary[600],
    backgroundColor: colors.background.white,
  },
  locationButtonSecondary: {
    borderColor: colors.neutral[600],
  },
  locationButtonDisabled: {
    opacity: 0.5,
  },
  locationButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary[600],
  },
  locationButtonTextSecondary: {
    color: colors.neutral[600],
  },
  locationError: {
    fontSize: typography.fontSize.xs,
    color: colors.error[500],
    marginBottom: spacing[2],
  },
  addressInputContainer: {
    marginBottom: spacing[2],
  },
  distanceContainer: {
    marginTop: spacing[2],
  },
  coordinatesText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  applyButton: {
    marginTop: spacing[2],
  },
});
