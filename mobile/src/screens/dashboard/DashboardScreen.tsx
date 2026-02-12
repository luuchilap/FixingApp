import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useAuth } from '../../hooks/useAuth';
import { SKILLS, SkillOption } from '../../constants/skills';
import { JobFilters as JobFiltersType } from '../../components/jobs/JobFilters';
import { geocode } from '../../services/trackasiaApi';
import {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
} from '../../constants/designTokens';

const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_PADDING = spacing[4]; // 16
const GRID_GAP = spacing[3]; // 12
const NUM_COLUMNS = 4;
const ITEM_WIDTH =
  (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP * (NUM_COLUMNS - 1)) /
  NUM_COLUMNS;

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

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    return 'Chào buổi tối';
  };

  const handleSkillPress = async (skill: SkillOption) => {
    if (!user) {
      Alert.alert('Thông báo', 'Vui lòng đăng nhập để sử dụng tính năng này.');
      return;
    }

    const userAddress = user.address?.trim();

    if (user.role === 'EMPLOYER') {
      navigation.navigate('CreateJob', {
        skill: skill.value,
        address: userAddress || undefined,
      });
      return;
    }

    // Worker: open Jobs tab with preset filters
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
          maxDistance: 5,
          address: userAddress,
        };
      } catch {
        // If geocode fails, filter by skill only
      }
    }

    navigation.navigate('Jobs', { presetFilters });
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Greeting Card */}
      <View style={styles.greetingCard}>
        <View style={styles.greetingRow}>
          <View style={styles.avatarCircle}>
            <MaterialCommunityIcons name="account" size={24} color="#fff" />
          </View>
          <View style={styles.greetingTextWrapper}>
            <Text style={styles.greetingText}>
              {getGreeting()}, {displayName}!
            </Text>
            <Text style={styles.greetingSubText}>
              👑  {roleLabel}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addressBar} activeOpacity={0.8}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={18}
            color={colors.text.secondary}
          />
          <Text style={styles.addressText} numberOfLines={1}>
            {user?.address || 'Nhập địa chỉ tại đây'}
          </Text>
          <MaterialCommunityIcons
            name="chevron-right"
            size={20}
            color={colors.text.tertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Services Section */}
      <Text style={styles.sectionTitle}>Dịch vụ</Text>

      <View style={styles.skillsGrid}>
        {SKILLS.map((skill) => (
          <TouchableOpacity
            key={skill.value}
            style={styles.skillItem}
            activeOpacity={0.7}
            onPress={() => handleSkillPress(skill)}
          >
            <View
              style={[
                styles.skillIconWrapper,
                { backgroundColor: skill.color + '15' },
              ]}
            >
              <MaterialCommunityIcons
                name={skill.icon as any}
                size={28}
                color={skill.color}
              />
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
    backgroundColor: colors.background.gray,
  },
  content: {
    paddingBottom: spacing[8],
  },

  /* ── Greeting Card ─────────────────── */
  greetingCard: {
    backgroundColor: colors.success[500],
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
    borderBottomLeftRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.xl,
  },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  greetingTextWrapper: {
    flex: 1,
  },
  greetingText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    marginBottom: 2,
  },
  greetingSubText: {
    fontSize: typography.fontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  addressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[3],
  },
  addressText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginLeft: spacing[2],
  },

  /* ── Section ───────────────────────── */
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginTop: spacing[6],
    marginBottom: spacing[4],
    marginHorizontal: GRID_PADDING,
  },

  /* ── Skills Grid (4 columns) ───────── */
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_PADDING,
    gap: GRID_GAP,
  },
  skillItem: {
    width: ITEM_WIDTH,
    alignItems: 'center',
  },
  skillIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
    ...shadows.sm,
  },
  skillLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
    color: colors.text.primary,
    lineHeight: typography.fontSize.xs * typography.lineHeight.tight,
  },
});
