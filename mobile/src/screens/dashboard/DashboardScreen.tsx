import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import { SKILLS, SkillValue, SkillOption } from '../../constants/skills';
import { JobFilters as JobFiltersType } from '../../components/jobs/JobFilters';
import { geocode } from '../../services/trackasiaApi';

const getSkillIcon = (value: SkillValue): string => {
  switch (value) {
    case 'CLEANING':
      return '🧹';
    case 'HOUSEWORK':
      return '👩‍🍳';
    case 'PLUMBING':
      return '🚰';
    case 'ELECTRICAL':
      return '💡';
    case 'CARPENTRY':
      return '🪚';
    case 'PAINTING':
      return '🎨';
    case 'AC_REPAIR':
      return '❄️';
    case 'APPLIANCE_REPAIR':
      return '🔧';
    case 'MASONRY':
      return '🧱';
    case 'GARDENING':
      return '🌿';
    case 'ENTERTAINMENT':
      return '🎉';
    case 'DELIVERY':
      return '📦';
    case 'ERRANDS':
      return '🏃‍♂️';
    case 'MISC_TASKS':
      return '🤹';
    case 'OTHER':
    default:
      return '➕';
  }
};

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const displayName = user?.fullName || user?.phone || 'bạn';
  const roleLabel =
    user?.role === 'EMPLOYER'
      ? 'Nhà tuyển dụng'
      : user?.role === 'WORKER'
      ? 'Người lao động'
      : user?.role || 'Người dùng';

  const handleSkillPress = async (skill: SkillOption) => {
    if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng này.');
      return;
    }

    const userAddress = user.address?.trim();

    if (user.role === 'EMPLOYER') {
      // Nhà tuyển dụng: đi thẳng tới màn "Đăng công việc mới"
      navigation.navigate('CreateJob', {
        skill: skill.value,
        address: userAddress || undefined,
      });
      return;
    }

    // Người lao động: mở tab "Công việc" với bộ lọc được preset
    let presetFilters: JobFiltersType = {
      category: skill.value,
    };

    if (userAddress) {
      try {
        const { latitude, longitude } = await geocode(userAddress);
        presetFilters = {
          ...presetFilters,
          latitude,
          longitude,
          maxDistance: 5, // mặc định tìm trong bán kính 5km
          address: userAddress,
        };
      } catch {
        // Nếu geocode lỗi thì chỉ lọc theo kỹ năng
      }
    }

    navigation.navigate('Jobs', {
      presetFilters,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.greetingCard}>
        <Text style={styles.greetingText}>Chào bạn, {displayName}!</Text>
        <Text style={styles.greetingSubText}>Hạng tài khoản: {roleLabel}</Text>
        <Text style={styles.greetingHint}>Nhập địa chỉ để hiển thị dịch vụ phù hợp</Text>
      </View>

      <Text style={styles.sectionTitle}>Bạn muốn dùng dịch vụ nào?</Text>

      <View style={styles.skillsGrid}>
        {SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill.value}
            style={styles.skillItem}
            activeOpacity={0.8}
            onPress={() => handleSkillPress(skill)}
          >
            <View style={styles.skillIconWrapper}>
              <Text style={styles.skillIcon}>{getSkillIcon(skill.value)}</Text>
            </View>
            <Text style={styles.skillLabel} numberOfLines={2}>
              {skill.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  greetingCard: {
    backgroundColor: '#22c55e',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f9fafb',
    marginBottom: 6,
  },
  greetingSubText: {
    fontSize: 14,
    color: '#e5e7eb',
    marginBottom: 4,
  },
  greetingHint: {
    fontSize: 12,
    color: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 16,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  skillItem: {
    width: '30%',
    marginBottom: 20,
    alignItems: 'center',
  },
  skillIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  skillIcon: {
    fontSize: 32,
  },
  skillLabel: {
    fontSize: 12,
    textAlign: 'center',
    color: '#111827',
  },
});

