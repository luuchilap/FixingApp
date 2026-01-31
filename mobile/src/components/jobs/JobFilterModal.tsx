import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SKILLS, SkillValue } from '../../constants/skills';

export interface JobFilters {
  keyword?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface JobFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: JobFilters) => void;
  initialFilters?: JobFilters;
}

export const JobFilterModal: React.FC<JobFilterModalProps> = ({
  visible,
  onClose,
  onApply,
  initialFilters = {},
}) => {
  const [keyword, setKeyword] = useState(initialFilters.keyword || '');
  const [category, setCategory] = useState<SkillValue | ''>(initialFilters.category || '');
  const [minPrice, setMinPrice] = useState(initialFilters.minPrice?.toString() || '');
  const [maxPrice, setMaxPrice] = useState(initialFilters.maxPrice?.toString() || '');

  // Reset form when modal opens with new initialFilters
  useEffect(() => {
    if (visible) {
      setKeyword(initialFilters.keyword || '');
      setCategory((initialFilters.category as SkillValue) || '');
      setMinPrice(initialFilters.minPrice?.toString() || '');
      setMaxPrice(initialFilters.maxPrice?.toString() || '');
    }
  }, [visible, initialFilters]);

  const handleApply = () => {
    const filters: JobFilters = {};
    
    if (keyword.trim()) {
      filters.keyword = keyword.trim();
    }
    
    if (category) {
      filters.category = category;
    }
    
    if (minPrice.trim()) {
      const min = parseInt(minPrice.trim(), 10);
      if (!isNaN(min) && min > 0) {
        filters.minPrice = min;
      }
    }
    
    if (maxPrice.trim()) {
      const max = parseInt(maxPrice.trim(), 10);
      if (!isNaN(max) && max > 0) {
        filters.maxPrice = max;
      }
    }

    onApply(filters);
    onClose();
  };

  const handleClear = () => {
    setKeyword('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    onApply({});
    onClose();
  };

  const hasActiveFilters = keyword.trim() || category || minPrice.trim() || maxPrice.trim();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Lọc công việc</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
              </View>
            </ScrollView>

            <View style={styles.footer}>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onPress={handleClear}
                  style={styles.clearButton}
                >
                  Xóa bộ lọc
                </Button>
              )}
              <View style={styles.buttonRow}>
                <Button
                  variant="outline"
                  onPress={onClose}
                  style={styles.cancelButton}
                >
                  Hủy
                </Button>
                <Button
                  variant="primary"
                  onPress={handleApply}
                  style={styles.applyButton}
                >
                  Áp dụng
                </Button>
              </View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background.white,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? spacing[6] : spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: typography.fontSize.xl,
    color: colors.text.secondary,
  },
  scrollContent: {
    flex: 1,
  },
  form: {
    padding: spacing[4],
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  priceRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  priceInput: {
    flex: 1,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    gap: spacing[3],
  },
  clearButton: {
    marginBottom: spacing[2],
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  cancelButton: {
    flex: 1,
  },
  applyButton: {
    flex: 1,
  },
});


