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
import { getJobById } from '../../services/jobsApi';
import {
  applyToJob,
  getJobApplications,
  getMyApplications,
  acceptApplication,
  rejectApplication,
  ApplicationWithWorker,
  ApplicationWithJob,
} from '../../services/applicationsApi';
import { createConversation, getConversations } from '../../services/messagesApi';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
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

const parseTimestamp = (timestamp: string | number | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  let numValue: number;
  if (typeof timestamp === 'string') {
    // Try to parse as number first
    numValue = Number(timestamp);
    if (isNaN(numValue)) {
      // If not a number, try to parse as date string
      const date = new Date(timestamp);
      return isNaN(date.getTime()) ? null : date;
    }
  } else {
    numValue = timestamp;
  }
  
  // If timestamp is in seconds (less than year 2001 in ms), convert to ms
  if (numValue < 100000000000) {
    return new Date(numValue * 1000);
  }
  return new Date(numValue);
};

const formatDate = (dateString: string | number | null | undefined): string => {
  if (!dateString) return 'Chưa xác định';
  const date = parseTimestamp(dateString);
  if (!date || isNaN(date.getTime())) return 'Chưa xác định';
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
  const [applications, setApplications] = useState<ApplicationWithWorker[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  
  // Track worker's application status for this job
  const [myApplication, setMyApplication] = useState<ApplicationWithJob | null>(null);
  const [checkingApplication, setCheckingApplication] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  // Get the accepted worker from applications
  const acceptedApplication = applications.find(app => app.status === 'ACCEPTED');

  const handleMessageWorker = async () => {
    if (!job || !acceptedApplication?.workerId) return;

    setStartingChat(true);
    try {
      // Check if conversation already exists
      const conversations = await getConversations();
      const existingConversation = conversations.find(
        conv => conv.jobId === job.id && conv.workerId === acceptedApplication.workerId
      );

      if (existingConversation) {
        navigation.navigate('Chat', { conversationId: existingConversation.id });
      } else {
        // Create new conversation
        const newConversation = await createConversation({
          jobId: job.id,
          workerId: acceptedApplication.workerId,
        });
        navigation.navigate('Chat', { conversationId: newConversation.id });
      }
    } catch {
      Alert.alert('Lỗi', 'Không thể mở cuộc hội thoại. Vui lòng thử lại.');
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    loadJob();
    if (user?.role === 'EMPLOYER') {
      loadApplications();
    }
    if (user?.role === 'WORKER') {
      checkMyApplication();
    }
  }, [jobId, user?.role]);

  const loadJob = async () => {
    try {
      setError(null);
      const jobData = await getJobById(jobId);
      setJob(jobData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải chi tiết công việc';
      setError(errorMessage);
      Alert.alert('Lỗi', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const loadApplications = async () => {
    if (user?.role !== 'EMPLOYER') return;

    try {
      setLoadingApplications(true);
      const apps = await getJobApplications(jobId);
      setApplications(apps);
    } catch {} finally {
      setLoadingApplications(false);
    }
  };

  const checkMyApplication = async () => {
    if (user?.role !== 'WORKER') return;

    try {
      setCheckingApplication(true);
      const myApplications = await getMyApplications();
      const applicationForThisJob = myApplications.find(app => app.jobId === jobId);
      setMyApplication(applicationForThisJob || null);
    } catch {} finally {
      setCheckingApplication(false);
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
              const application = await applyToJob(job.id);
              // Update local state to show "Đã ứng tuyển"
              setMyApplication({
                id: application.id,
                jobId: application.jobId,
                workerId: application.workerId,
                status: application.status,
                appliedAt: application.appliedAt,
                job: {
                  id: job.id,
                  title: job.title,
                  price: job.price,
                  address: job.address,
                  status: job.status,
                },
              });
              Alert.alert('Thành công', 'Bạn đã ứng tuyển thành công!');
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : 'Không thể ứng tuyển';
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setApplying(false);
            }
          },
        },
      ]
    );
  };

  const handleAccept = async (application: ApplicationWithWorker) => {
    if (!job) return;

    Alert.alert(
      'Chấp nhận ứng viên',
      `Bạn có chắc chắn muốn chấp nhận ${application.worker?.fullName || 'ứng viên này'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Chấp nhận',
          onPress: async () => {
            try {
              setProcessingAction(true);
              await acceptApplication(job.id, application.workerId);
              Alert.alert('Thành công', 'Đã chấp nhận ứng viên!');
              await loadJob();
              await loadApplications();
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : 'Không thể chấp nhận đơn ứng tuyển';
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setProcessingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async (application: ApplicationWithWorker) => {
    if (!job) return;

    Alert.alert(
      'Từ chối ứng viên',
      `Bạn có chắc chắn muốn từ chối ${application.worker?.fullName || 'ứng viên này'}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Từ chối',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingAction(true);
              await rejectApplication(job.id, application.workerId);
              Alert.alert('Thành công', 'Đã từ chối ứng viên.');
              await loadApplications();
            } catch (err: unknown) {
              const errorMessage =
                err instanceof Error ? err.message : 'Không thể từ chối đơn ứng tuyển';
              Alert.alert('Lỗi', errorMessage);
            } finally {
              setProcessingAction(false);
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
        <Text style={styles.errorText}>{error || 'Không tìm thấy công việc'}</Text>
        <Button title="Quay lại" onPress={() => navigation.goBack()} variant="outline" />
      </View>
    );
  }

  const isEmployer = user?.role === 'EMPLOYER';
  const isWorker = user?.role === 'WORKER';
  const hasApplied = myApplication !== null;
  const canApply = isWorker && job.status === 'CHUA_LAM' && !job.acceptedWorkerId && !hasApplied;
  
  const getApplicationStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      'APPLIED': 'Đã ứng tuyển',
      'ACCEPTED': 'Được chấp nhận',
      'REJECTED': 'Bị từ chối',
      'PENDING': 'Chờ xử lý',
    };
    return statusMap[status] || status;
  };

  const getApplicationStatusColor = (status: string): string => {
    const colorMap: Record<string, string> = {
      'APPLIED': colors.primary[500],
      'ACCEPTED': colors.success[500],
      'REJECTED': colors.error[500],
      'PENDING': colors.warning[500],
    };
    return colorMap[status] || colors.neutral[500];
  };

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

      {/* Applications Section (Employer only) */}
      {isEmployer && job.employerId === user?.id && (
        <Card variant="default" padding={4} style={styles.applicationsCard}>
          <Text style={styles.sectionTitle}>Danh sách ứng viên ({applications.length})</Text>
          {loadingApplications ? (
            <View style={styles.loadingApplications}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : applications.length > 0 ? (
            <View style={styles.applicationsList}>
              {applications.map((application) => (
                <ApplicationCard
                  key={application.id}
                  application={application}
                  showActions={true}
                  onAccept={handleAccept}
                  onReject={handleReject}
                />
              ))}
            </View>
          ) : (
            <Text style={styles.noApplicationsText}>Chưa có ứng viên nào ứng tuyển.</Text>
          )}
        </Card>
      )}

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

      {/* Show application status for worker who has applied */}
      {isWorker && hasApplied && myApplication && (
        <View style={styles.actions}>
          <View style={[styles.applicationStatusCard, { borderColor: getApplicationStatusColor(myApplication.status) }]}>
            <View style={[styles.applicationStatusBadge, { backgroundColor: getApplicationStatusColor(myApplication.status) }]}>
              <Text style={styles.applicationStatusText}>
                {getApplicationStatusLabel(myApplication.status)}
              </Text>
            </View>
            <Text style={styles.applicationStatusNote}>
              {myApplication.status === 'APPLIED' && 'Đơn ứng tuyển của bạn đang chờ xem xét.'}
              {myApplication.status === 'ACCEPTED' && 'Chúc mừng! Bạn đã được chấp nhận cho công việc này.'}
              {myApplication.status === 'REJECTED' && 'Rất tiếc, đơn ứng tuyển của bạn đã bị từ chối.'}
              {myApplication.status === 'PENDING' && 'Đơn ứng tuyển của bạn đang được xử lý.'}
            </Text>
          </View>
        </View>
      )}

      {isEmployer && job.employerId === user?.id && (
        <View style={styles.actions}>
          {job.status === 'DANG_BAN_GIAO' && acceptedApplication && (
            <Button
              title="💬 Nhắn tin cho ứng viên"
              onPress={handleMessageWorker}
              loading={startingChat}
              fullWidth
              size="lg"
              variant="primary"
              style={styles.messageButton}
            />
          )}
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
  messageButton: {
    marginBottom: spacing[3],
  },
  applicationsCard: {
    margin: spacing[4],
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  },
  loadingApplications: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    padding: spacing[4],
  },
  applicationsList: {
    gap: spacing[2],
  },
  noApplicationsText: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    textAlign: 'center',
    padding: spacing[4],
  },
  applicationStatusCard: {
    backgroundColor: colors.background.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing[4],
    alignItems: 'center',
    gap: spacing[3],
  },
  applicationStatusBadge: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    borderRadius: borderRadius.full,
  },
  applicationStatusText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
  },
  applicationStatusNote: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

