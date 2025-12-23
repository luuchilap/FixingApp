import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { ApplicationWithWorker, ApplicationWithJob } from '../../services/applicationsApi';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';

export interface ApplicationCardProps {
  application: ApplicationWithWorker | ApplicationWithJob;
  onPress?: (application: ApplicationWithWorker | ApplicationWithJob) => void;
  onAccept?: (application: ApplicationWithWorker | ApplicationWithJob) => void;
  onReject?: (application: ApplicationWithWorker | ApplicationWithJob) => void;
  showActions?: boolean;
}

const getStatusLabel = (status: string): string => {
  const statusMap: Record<string, string> = {
    'APPLIED': 'Đã ứng tuyển',
    'PENDING': 'Chờ xử lý',
    'ACCEPTED': 'Đã chấp nhận',
    'REJECTED': 'Đã từ chối',
  };
  return statusMap[status] || status;
};

const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'APPLIED': colors.primary[500],
    'PENDING': colors.warning[500],
    'ACCEPTED': colors.success[500],
    'REJECTED': colors.error[500],
  };
  return colorMap[status] || colors.neutral[500];
};

const formatDate = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffHours < 1) {
    return 'Vừa xong';
  } else if (diffHours < 24) {
    return `${diffHours} giờ trước`;
  } else if (diffDays < 7) {
    return `${diffDays} ngày trước`;
  } else {
    return date.toLocaleDateString('vi-VN');
  }
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

export const ApplicationCard: React.FC<ApplicationCardProps> = ({
  application,
  onPress,
  onAccept,
  onReject,
  showActions = false,
}) => {
  const statusColor = getStatusColor(application.status);
  const isWorkerView = 'job' in application && application.job;
  const isEmployerView = 'worker' in application && application.worker;

  return (
    <Card
      variant="default"
      onPress={onPress}
      style={styles.card}
      padding={4}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {isWorkerView && application.job && (
              <>
                <Text style={styles.title} numberOfLines={2}>
                  {application.job.title}
                </Text>
                <Text style={styles.price}>{formatPrice(application.job.price)}</Text>
              </>
            )}
            {isEmployerView && application.worker && (
              <>
                <Text style={styles.title} numberOfLines={2}>
                  {application.worker.fullName}
                </Text>
                {application.worker.skill && (
                  <Text style={styles.skill}>{application.worker.skill}</Text>
                )}
              </>
            )}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusText}>{getStatusLabel(application.status)}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.details}>
          {isWorkerView && application.job && (
            <>
              <Text style={styles.label}>Địa chỉ: {application.job.address}</Text>
              <Text style={styles.label}>Trạng thái công việc: {application.job.status}</Text>
            </>
          )}
          {isEmployerView && application.worker && (
            <>
              <Text style={styles.label}>Số điện thoại: {application.worker.phone}</Text>
              {application.worker.address && (
                <Text style={styles.label}>Địa chỉ: {application.worker.address}</Text>
              )}
              {application.worker.avgRating && (
                <Text style={styles.label}>
                  Đánh giá: {application.worker.avgRating.toFixed(1)} ⭐
                </Text>
              )}
              {application.worker.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedText}>✓ Đã xác thực</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.time}>
            {application.appliedAt
              ? `Ứng tuyển: ${formatDate(application.appliedAt)}`
              : application.createdAt
              ? `Tạo: ${formatDate(new Date(application.createdAt).getTime())}`
              : ''}
          </Text>
        </View>

        {/* Actions */}
        {showActions && onAccept && onReject && application.status === 'APPLIED' && (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => onReject(application)}
            >
              <Text style={styles.rejectButtonText}>Từ chối</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => onAccept(application)}
            >
              <Text style={styles.acceptButtonText}>Chấp nhận</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  content: {
    gap: spacing[2],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[2],
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  },
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
  },
  skill: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing[1],
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
  details: {
    gap: spacing[1],
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success[100],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
    marginTop: spacing[1],
  },
  verifiedText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.success[700],
  },
  footer: {
    marginTop: spacing[1],
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
  },
  actionButton: {
    flex: 1,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  rejectButton: {
    backgroundColor: colors.error[50],
    borderWidth: 1,
    borderColor: colors.error[500],
  },
  rejectButtonText: {
    color: colors.error[500],
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  acceptButton: {
    backgroundColor: colors.success[500],
  },
  acceptButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});

