import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Job } from '../../types/jobs';
import { getJobById, applyToJob } from '../../services/jobsApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SKILLS } from '../../constants/skills';
import { MainStackParamList } from '../../navigation/MainStack';

type JobDetailScreenProps = NativeStackScreenProps<MainStackParamList, 'JobDetail'>;

const getSkillLabel = (skillValue: string): string => {
  const skill = SKILLS.find(s => s.value === skillValue);
  return skill?.label || skillValue;
};

const getStatusLabel = (status: Job['status']): string => {
  const statusMap: Record<string, string> = {
    'CHUA_LAM': 'Đang nhận đơn',
    'DANG_BAN_GIAO': 'Đang bàn giao',
    'OPEN': 'Mở',
    'IN_PROGRESS': 'Đang thực hiện',
    'COMPLETED': 'Đã hoàn thành',
    'CANCELLED': 'Đã hủy',
  };
  return statusMap[status] || status;
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const JobDetailScreen: React.FC<JobDetailScreenProps> = ({ route, navigation }) => {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJob();
  }, [jobId]);

  const loadJob = async () => {
    try {
      setError(null);
      const jobData = await getJobById(jobId);
      setJob(jobData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load job details';
      setError(errorMessage);
      console.error('Error loading job:', err);
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!job) return;

    Alert.alert(
      'Ứng tuyển',
      `Bạn có chắc chắn muốn ứng tuyển cho công việc "${job.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Ứng tuyển',
          onPress: async () => {
            try {
              setApplying(true);
              await applyToJob(job.id);
              Alert.alert('Thành công', 'Bạn đã ứng tuyển thành công!');
              // Reload job to get updated status
              await loadJob();
            } catch (err: unknown) {
              const errorMessage = err instanceof Error ? err.message : 'Failed to apply';
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setApplying(false);
            }
          },
        },
      ]
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

  if (error || !job) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Job not found'}</Text>
        <Button title="Quay lại" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const isEmployer = user?.role === 'EMPLOYER';
  const isWorker = user?.role === 'WORKER';
  const canApply = isWorker && job.status === 'CHUA_LAM' && !job.acceptedWorkerId;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Images */}
      {job.images && job.images.length > 0 && (
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: job.images[0].url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{job.title}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.price}>{formatPrice(job.price)}</Text>
        </View>
      </View>

      {/* Job Info Card */}
      <Card variant="default" padding={4} style={styles.infoCard}>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Kỹ năng yêu cầu</Text>
          <Text style={styles.value}>{getSkillLabel(job.requiredSkill)}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Địa chỉ</Text>
          <Text style={styles.value}>{job.address}</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.label}>Trạng thái</Text>
          <Text style={styles.value}>{getStatusLabel(job.status)}</Text>
        </View>

        {job.handoverDeadline && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Hạn bàn giao</Text>
            <Text style={styles.value}>{formatDate(job.handoverDeadline)}</Text>
          </View>
        )}

        <View style={styles.infoRow}>
          <Text style={styles.label}>Đăng lúc</Text>
          <Text style={styles.value}>{formatDate(job.createdAt)}</Text>
        </View>

        {job.employerName && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Người đăng</Text>
            <Text style={styles.value}>{job.employerName}</Text>
          </View>
        )}
      </Card>

      {/* Description Card */}
      <Card variant="default" padding={4} style={styles.descriptionCard}>
        <Text style={styles.descriptionTitle}>Mô tả công việc</Text>
        <Text style={styles.description}>{job.description}</Text>
      </Card>

      {/* Actions */}
      {canApply && (
        <View style={styles.actions}>
          <Button
            title="Ứng tuyển ngay"
            onPress={handleApply}
            loading={applying}
            fullWidth
            size="lg"
          />
        </View>
      )}

      {isEmployer && job.employerId === user?.id && (
        <View style={styles.actions}>
          <Text style={styles.employerNote}>
            Đây là công việc của bạn. Bạn có thể quản lý và xem danh sách ứng viên.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  content: {
    paddingBottom: spacing[6],
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
    gap: spacing[4],
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error[500],
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 250,
    backgroundColor: colors.neutral[200],
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  header: {
    padding: spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  },
  priceContainer: {
    marginTop: spacing[2],
  },
  price: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  infoCard: {
    margin: spacing[4],
    marginBottom: spacing[3],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[3],
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.secondary,
    flex: 1,
  },
  value: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    flex: 2,
    textAlign: 'right',
  },
  descriptionCard: {
    margin: spacing[4],
    marginTop: 0,
  },
  descriptionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed * typography.fontSize.base,
  },
  actions: {
    padding: spacing[4],
    paddingTop: spacing[2],
  },
  employerNote: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

