import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { Job } from '../../types/jobs';
import { colors, spacing, typography, borderRadius } from '../../constants/designTokens';
import { SKILLS } from '../../constants/skills';

export interface JobCardProps {
  job: Job;
  onPress: (job: Job) => void;
}

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

const getStatusColor = (status: Job['status']): string => {
  const colorMap: Record<string, string> = {
    'CHUA_LAM': colors.success[500],
    'DANG_BAN_GIAO': colors.warning[500],
    'OPEN': colors.success[500],
    'IN_PROGRESS': colors.primary[500],
    'COMPLETED': colors.success[600],
    'CANCELLED': colors.error[500],
  };
  return colorMap[status] || colors.neutral[500];
};

const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
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

export const JobCard: React.FC<JobCardProps> = ({ job, onPress }) => {
  const primaryImage = job.images?.find(img => img.type === 'IMAGE' || !img.type)?.url;
  const statusColor = getStatusColor(job.status);

  return (
    <Card
      variant="default"
      onPress={() => onPress(job)}
      style={styles.card}
      padding={4}
    >
      <View style={styles.content}>
        {/* Image */}
        {primaryImage ? (
          <Image source={{ uri: primaryImage }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>📷</Text>
          </View>
        )}

        {/* Job Info */}
        <View style={styles.info}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={2}>
              {job.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusText}>{getStatusLabel(job.status)}</Text>
            </View>
          </View>

          <Text style={styles.price}>{formatPrice(job.price)}</Text>

          <View style={styles.meta}>
            <Text style={styles.skill}>{getSkillLabel(job.requiredSkill)}</Text>
            <Text style={styles.separator}>•</Text>
            <Text style={styles.location} numberOfLines={1}>
              {job.address}
            </Text>
          </View>

          <Text style={styles.time}>{formatDate(job.createdAt)}</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing[3],
  },
  content: {
    flexDirection: 'row',
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[200],
  },
  imagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    backgroundColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePlaceholderText: {
    fontSize: 32,
  },
  info: {
    flex: 1,
    marginLeft: spacing[3],
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  title: {
    flex: 1,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    marginRight: spacing[2],
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
  price: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary[500],
    marginBottom: spacing[1],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  skill: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  separator: {
    fontSize: typography.fontSize.sm,
    color: colors.text.tertiary,
    marginHorizontal: spacing[1],
  },
  location: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});

