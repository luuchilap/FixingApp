import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import { getCurrentUser, updateUserProfile, UserProfile } from '../../services/usersApi';
import { getMyApplications, ApplicationWithJob } from '../../services/applicationsApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { MainStackParamList } from '../../navigation/MainStack';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Applications state (Workers only - Employers see their jobs in Jobs tab)
  const [myApplications, setMyApplications] = useState<ApplicationWithJob[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMoreApps, setLoadingMoreApps] = useState(false);
  const [appsPage, setAppsPage] = useState(1);
  const [appsHasMore, setAppsHasMore] = useState(true);
  const [appsTotalCount, setAppsTotalCount] = useState(0);

  const isEmployer = user?.role === 'EMPLOYER';
  const isWorker = user?.role === 'WORKER';

  useEffect(() => {
    loadProfile();
    loadUserItems(1, false);
  }, []);
  
  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadUserItems(1, false);
    }, [user?.role])
  );
  
  const loadUserItems = async (page = 1, append = false) => {
    if (!user) return;
    
    // Only load applications for workers (employers see their jobs in the Jobs tab)
    if (isWorker) {
      if (append) {
        setLoadingMoreApps(true);
      } else {
        setLoadingItems(true);
      }
      try {
        const response = await getMyApplications({ page, limit: 5 });
        if (append) {
          setMyApplications(prev => [...prev, ...response.data]);
        } else {
          setMyApplications(response.data);
        }
        setAppsPage(page);
        setAppsHasMore(response.pagination.hasMore);
        setAppsTotalCount(response.pagination.total);
      } catch {} finally {
        setLoadingItems(false);
        setLoadingMoreApps(false);
      }
    }
  };

  const handleLoadMoreApps = () => {
    if (!loadingMoreApps && appsHasMore) {
      loadUserItems(appsPage + 1, true);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadUserItems(1, false)]);
    setRefreshing(false);
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const userProfile = await getCurrentUser();
      setProfile(userProfile);
      setFormData({
        fullName: userProfile.fullName || '',
        address: userProfile.address || '',
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải hồ sơ';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
    setErrors({});
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setFormData({
        fullName: profile.fullName || '',
        address: profile.address || '',
      });
    }
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const updatedProfile = await updateUserProfile({
        fullName: formData.fullName.trim(),
        address: formData.address.trim() || undefined,
      });

      setProfile(updatedProfile);
      setEditing(false);
      
      // Refresh user in auth context
      if (refreshUser) {
        await refreshUser();
      }

      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật hồ sơ';
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // Use window.confirm for web platform
      const confirmed = window.confirm('Bạn có chắc chắn muốn đăng xuất?');
      if (confirmed) {
        try {
          await logout();
        } catch {
          window.alert('Không thể đăng xuất. Vui lòng thử lại.');
        }
      }
    } else {
      // Use Alert.alert for native platforms
      Alert.alert(
        'Đăng xuất',
        'Bạn có chắc chắn muốn đăng xuất?',
        [
          {
            text: 'Hủy',
            style: 'cancel',
          },
          {
            text: 'Đăng xuất',
            style: 'destructive',
            onPress: async () => {
              try {
                await logout();
              } catch {
                Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
              }
            },
          },
        ],
        { cancelable: true }
      );
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  const displayProfile = profile || user;
  const displayFullName = displayProfile?.fullName || 'Chưa có';
  const displayPhone = displayProfile?.phone || user?.phone || 'Chưa có';
  const displayAddress = displayProfile?.address || user?.address || '';
  const displayRole = displayProfile?.role || user?.role || 'Chưa có';

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      'EMPLOYER': 'Người thuê',
      'WORKER': 'Người làm việc',
      'ADMIN': 'Quản trị viên',
    };
    return roleMap[role] || role;
  };

  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'OPEN': 'Đang mở',
      'IN_PROGRESS': 'Đang thực hiện',
      'COMPLETED': 'Hoàn thành',
      'CANCELLED': 'Đã hủy',
      'APPLIED': 'Đã ứng tuyển',
      'ACCEPTED': 'Được chấp nhận',
      'REJECTED': 'Bị từ chối',
      'PENDING': 'Chờ xử lý',
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'OPEN': colors.success[500],
      'IN_PROGRESS': colors.warning[500],
      'COMPLETED': colors.primary[500],
      'CANCELLED': colors.error[500],
      'APPLIED': colors.primary[500],
      'ACCEPTED': colors.success[500],
      'REJECTED': colors.error[500],
      'PENDING': colors.warning[500],
    };
    return colorMap[status] || colors.neutral[500];
  };

  const handleJobPress = (jobId: number) => {
    navigation.navigate('JobDetail', { jobId });
  };

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={styles.title}>Hồ sơ cá nhân</Text>

      {/* Profile Info Card */}
      <Card variant="default" padding={4} style={styles.profileCard}>
        {editing ? (
          <>
            <Input
              label="Họ tên"
              value={formData.fullName}
              onChangeText={(text) => setFormData({ ...formData, fullName: text })}
              error={errors.fullName}
              required
            />

            <AddressAutocomplete
              label="Địa chỉ"
              value={formData.address}
              onChange={(addr) => setFormData({ ...formData, address: addr })}
              error={errors.address}
            />

            <View style={styles.editActions}>
              <Button
                title="Hủy"
                onPress={handleCancel}
                variant="outline"
                style={styles.cancelButton}
              />
              <Button
                title="Lưu"
                onPress={handleSave}
                loading={saving}
                style={styles.saveButton}
              />
            </View>
          </>
        ) : (
          <>
            <View style={styles.profileItem}>
              <Text style={styles.label}>Họ tên</Text>
              <Text style={styles.value}>{displayFullName}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.label}>Số điện thoại</Text>
              <Text style={styles.value}>{displayPhone}</Text>
            </View>

            <View style={styles.profileItem}>
              <Text style={styles.label}>Vai trò</Text>
              <Text style={styles.value}>{getRoleLabel(displayRole)}</Text>
            </View>

            {displayAddress && (
              <View style={styles.profileItem}>
                <Text style={styles.label}>Địa chỉ</Text>
                <Text style={styles.value}>{displayAddress}</Text>
              </View>
            )}

            <Button
              title="Chỉnh sửa thông tin"
              onPress={handleEdit}
              variant="outline"
              fullWidth
              style={styles.editButton}
            />
          </>
        )}
      </Card>

      {/* My Applications Section - Workers only */}
      {isWorker && (
        <Card variant="default" padding={4} style={styles.itemsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Công việc đã ứng tuyển</Text>
            {appsTotalCount > 0 && (
              <Text style={styles.countBadge}>{myApplications.length}/{appsTotalCount}</Text>
            )}
          </View>
          
          {loadingItems ? (
            <View style={styles.itemsLoading}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : myApplications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Chưa ứng tuyển công việc nào</Text>
              <Button
                title="Tìm công việc"
                onPress={() => navigation.navigate('MainTabs', { screen: 'Jobs' })}
                variant="primary"
                size="sm"
                style={styles.emptyButton}
              />
            </View>
          ) : (
            <View style={styles.itemsList}>
              {myApplications.map((application) => (
                <TouchableOpacity
                  key={application.id}
                  style={styles.jobItem}
                  onPress={() => application.job && handleJobPress(application.job.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.jobHeader}>
                    <Text style={styles.jobTitle} numberOfLines={2}>
                      {application.job?.title || 'Chưa có'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(application.status) }]}>
                      <Text style={styles.statusText}>{getStatusLabel(application.status)}</Text>
                    </View>
                  </View>
                  <Text style={styles.jobPrice}>
                    {application.job ? formatPrice(application.job.price) : 'Chưa có'}
                  </Text>
                  <Text style={styles.jobAddress} numberOfLines={1}>
                    {application.job?.address || 'Chưa có'}
                  </Text>
                  {application.job?.employerName && (
                    <Text style={styles.employerName}>
                      Nhà tuyển dụng: {application.job.employerName}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
              
              {/* Load More / End of list */}
              <View style={styles.paginationContainer}>
                {appsHasMore ? (
                  <TouchableOpacity
                    style={styles.loadMoreButton}
                    onPress={handleLoadMoreApps}
                    disabled={loadingMoreApps}
                  >
                    {loadingMoreApps ? (
                      <ActivityIndicator size="small" color={colors.text.inverse} />
                    ) : (
                      <Text style={styles.loadMoreText}>Tải thêm</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.endOfListText}>Đã hiển thị tất cả</Text>
                )}
              </View>
            </View>
          )}
        </Card>
      )}

      {/* Account Actions */}
      <Card variant="default" padding={4} style={styles.actionsCard}>
        <Text style={styles.sectionTitle}>Tài khoản</Text>
        <Button
          title="Đăng xuất"
          onPress={handleLogout}
          variant="danger"
          fullWidth
        />
      </Card>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
  },
  profileCard: {
    marginBottom: spacing[4],
  },
  profileItem: {
    marginBottom: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing[1],
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    fontWeight: typography.fontWeight.medium,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing[3],
    marginTop: spacing[4],
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  editButton: {
    marginTop: spacing[4],
  },
  actionsCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  },
  // Jobs/Applications styles
  itemsCard: {
    marginBottom: spacing[4],
  },
  itemsLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
    paddingVertical: spacing[4],
  },
  itemsList: {
    gap: spacing[3],
  },
  jobItem: {
    backgroundColor: colors.background.gray,
    borderRadius: borderRadius.md,
    padding: spacing[3],
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
    gap: spacing[2],
  },
  jobTitle: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.inverse,
  },
  jobPrice: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  jobAddress: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  employerName: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    marginBottom: spacing[3],
  },
  emptyButton: {
    minWidth: 150,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  countBadge: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    backgroundColor: colors.background.gray,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  paginationContainer: {
    alignItems: 'center',
    paddingTop: spacing[3],
  },
  loadMoreButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    minWidth: 100,
    alignItems: 'center',
  },
  loadMoreText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  endOfListText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  },
});
