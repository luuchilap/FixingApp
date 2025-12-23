import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Picker } from '@react-native-picker/picker';
import { Card } from '../ui/Card';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SKILLS, SkillValue } from '../../constants/skills';

export interface JobFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
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
  const [keyword, setKeyword] = React.useState(filters.keyword || '');
  const [category, setCategory] = React.useState<SkillValue | ''>(filters.category || '');
  const [minPrice, setMinPrice] = React.useState(filters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = React.useState(filters.maxPrice?.toString() || '');

  // Update local state when filters prop changes
  React.useEffect(() => {
    setKeyword(filters.keyword || '');
    setCategory((filters.category as SkillValue) || '');
    setMinPrice(filters.minPrice?.toString() || '');
    setMaxPrice(filters.maxPrice?.toString() || '');
  }, [filters]);

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

    onFilterChange(newFilters);
  };

  const hasActiveFilters = keyword.trim() || category || minPrice.trim() || maxPrice.trim();

  return (
    <Card variant="default" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lọc công việc</Text>
        {hasActiveFilters && (
          <TouchableOpacity onPress={onClear} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Xóa bộ lọc</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.form}>
        <Input
          label="Từ khóa tìm kiếm"
          placeholder="Tìm theo tiêu đề hoặc mô tả..."
          value={keyword}
          onChangeText={setKeyword}
          containerStyle={styles.inputContainer}
        />

        <View style={styles.pickerContainer}>
          <Text style={styles.label}>
            Kỹ năng yêu cầu
          </Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={category}
              onValueChange={(value) => setCategory(value)}
              style={styles.picker}
              enabled={true}
            >
              <Picker.Item label="-- Tất cả kỹ năng --" value="" />
              {SKILLS.map((skill) => (
                <Picker.Item
                  key={skill.value}
                  label={skill.label}
                  value={skill.value}
                />
              ))}
            </Picker>
          </View>
        </View>

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

        <Button
          variant="primary"
          onPress={handleApply}
          style={styles.applyButton}
        >
          Lọc kết quả
        </Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: spacing[4],
    marginBottom: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
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
  form: {
    gap: spacing[3],
  },
  inputContainer: {
    marginBottom: 0,
  },
  pickerContainer: {
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.white,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  priceInput: {
    flex: 1,
  },
  applyButton: {
    marginTop: spacing[2],
  },
});

