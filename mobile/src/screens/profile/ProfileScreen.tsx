import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { getCurrentUser, updateUserProfile, UserProfile } from '../../services/usersApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

export const ProfileScreen: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProfile();
  }, []);

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
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      console.error('Error loading profile:', error);
      Alert.alert('Error', errorMessage);
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
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Lỗi', errorMessage);
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
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
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Lỗi', 'Không thể đăng xuất. Vui lòng thử lại.');
            }
          },
        },
      ],
      { cancelable: true }
    );
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
  const displayFullName = displayProfile?.fullName || 'N/A';
  const displayPhone = displayProfile?.phone || user?.phone || 'N/A';
  const displayAddress = displayProfile?.address || user?.address || '';
  const displayRole = displayProfile?.role || user?.role || 'N/A';

  const getRoleLabel = (role: string): string => {
    const roleMap: Record<string, string> = {
      'EMPLOYER': 'Người thuê',
      'WORKER': 'Người làm việc',
      'ADMIN': 'Quản trị viên',
    };
    return roleMap[role] || role;
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

            <Input
              label="Địa chỉ"
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
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
});
