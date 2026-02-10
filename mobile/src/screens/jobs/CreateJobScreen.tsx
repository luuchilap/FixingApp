import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
  TouchableOpacity,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import { Select } from '../../components/ui/Select';
import { createJob } from '../../services/jobsApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SKILLS, SkillValue } from '../../constants/skills';
import { MainStackParamList } from '../../navigation/MainStack';

type CreateJobScreenProps = NativeStackScreenProps<MainStackParamList, 'CreateJob'>;

interface ImageAsset {
  uri: string;
  type: string;
  name: string;
}

export const CreateJobScreen: React.FC<CreateJobScreenProps> = ({ navigation, route }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState(route.params?.address || '');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [requiredSkill, setRequiredSkill] = useState<SkillValue | ''>(route.params?.skill || '');
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Request image picker permissions
  const requestImagePickerPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Cần cấp quyền',
        'Chúng tôi cần quyền truy cập ảnh của bạn để tải ảnh công việc lên.'
      );
      return false;
    }
    return true;
  };

  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Đã đạt giới hạn', 'Bạn có thể tải lên tối đa 5 ảnh.');
      return;
    }

    const hasPermission = await requestImagePickerPermission();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const imageAsset: ImageAsset = {
          uri: asset.uri,
          type: 'image/jpeg',
          name: `image_${Date.now()}.jpg`,
        };
        setImages([...images, imageAsset]);
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Tiêu đề công việc là bắt buộc';
    }

    if (!description.trim()) {
      newErrors.description = 'Mô tả công việc là bắt buộc';
    }

    if (!price.trim()) {
      newErrors.price = 'Giá là bắt buộc';
    } else {
      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0) {
        newErrors.price = 'Giá phải là số lớn hơn 0';
      }
    }

    if (!address.trim()) {
      newErrors.address = 'Địa chỉ là bắt buộc';
    }

    if (!requiredSkill) {
      newErrors.requiredSkill = 'Kỹ năng yêu cầu là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Create FormData
      const formData = new FormData();

      // Add text fields
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', parseFloat(price).toString());
      formData.append('address', address.trim());
      formData.append('requiredSkill', requiredSkill as string);
      
      // Add coordinates if available
      if (latitude !== undefined && longitude !== undefined) {
        formData.append('latitude', latitude.toString());
        formData.append('longitude', longitude.toString());
      }

      // Add images
      images.forEach((image, index) => {
        formData.append('images', {
          uri: image.uri,
          type: image.type,
          name: image.name,
        } as any);
      });

      await createJob(formData);

      Alert.alert('Thành công', 'Công việc đã được đăng thành công!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo công việc';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Đăng công việc mới</Text>

      <View style={styles.form}>
        <Input
          label="Tiêu đề công việc"
          value={title}
          onChangeText={setTitle}
          placeholder="Ví dụ: Cần thợ sửa ống nước"
          error={errors.title}
          required
        />

        <Input
          label="Mô tả công việc"
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả chi tiết công việc cần làm..."
          multiline
          numberOfLines={4}
          style={styles.textArea}
          error={errors.description}
          required
        />

        <Input
          label="Giá (VNĐ)"
          value={price}
          onChangeText={setPrice}
          placeholder="1000000"
          keyboardType="numeric"
          error={errors.price}
          required
        />

        <AddressAutocomplete
          label="Địa chỉ"
          value={address}
          onChange={(addr, lat, lng) => {
            setAddress(addr);
            setLatitude(lat);
            setLongitude(lng);
          }}
          placeholder="Địa chỉ thực hiện công việc"
          error={errors.address}
          required
        />

        <View style={styles.selectGroup}>
          <Select
            label="Kỹ năng yêu cầu *"
            placeholder="-- Chọn kỹ năng --"
            value={requiredSkill}
            onChange={(value) => setRequiredSkill(value as SkillValue | '')}
            options={SKILLS.map((skill) => ({
              label: skill.label,
              value: skill.value,
            }))}
          />
          {errors.requiredSkill && (
            <Text style={styles.errorText}>{errors.requiredSkill}</Text>
          )}
        </View>

        {/* Image Picker Section */}
        <View style={styles.imageSection}>
          <Text style={styles.label}>Hình ảnh (tối đa 5 ảnh)</Text>
          <View style={styles.imageGrid}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => handleRemoveImage(index)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
            {images.length < 5 && (
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={handlePickImage}
              >
                <Text style={styles.addImageText}>+</Text>
                <Text style={styles.addImageLabel}>Thêm ảnh</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Button
          title="Đăng công việc"
          onPress={handleSubmit}
          loading={loading}
          fullWidth
          size="lg"
          style={styles.submitButton}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  content: {
    padding: spacing[4],
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  },
  form: {
    gap: spacing[4],
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
    paddingTop: spacing[3],
  },
  selectGroup: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  errorText: {
    color: colors.error[500],
    fontSize: typography.fontSize.sm,
    marginTop: spacing[1],
  },
  imageSection: {
    marginTop: spacing[2],
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[2],
  },
  imageWrapper: {
    position: 'relative',
    width: 100,
    height: 100,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[200],
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.error[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background.white,
  },
  removeImageText: {
    color: colors.text.inverse,
    fontSize: 18,
    fontWeight: typography.fontWeight.bold,
    lineHeight: 20,
  },
  addImageButton: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border.default,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.gray,
  },
  addImageText: {
    fontSize: 32,
    color: colors.text.tertiary,
    fontWeight: typography.fontWeight.bold,
  },
  addImageLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  submitButton: {
    marginTop: spacing[4],
  },
});

