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

const parseTimestamp = (timestamp: string | number | null | undefined): Date | null => {
  if (!timestamp) return null;
  
  let numValue: number;
  if (typeof timestamp === 'string') {
    numValue = Number(timestamp);
    if (isNaN(numValue)) {
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
  if (!dateString) return '';
  const date = parseTimestamp(dateString);
  if (!date || isNaN(date.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  // If more than 1 day ago, show full date
  if (diffDays >= 1) {
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  
  // Less than 1 day
  if (diffMinutes < 1) {
    return `${diffSeconds} giây trước`;
  } else if (diffMinutes < 60) {
    return `${diffMinutes} phút trước`;
  } else {
    return `${diffHours} giờ trước`;
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

          {job.distance !== null && job.distance !== undefined && (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceIcon}>📍</Text>
              <Text style={styles.distanceText}>
                {job.distance < 1
                  ? `${(job.distance * 1000).toFixed(0)}m`
                  : `${job.distance.toFixed(1)}km`}
              </Text>
            </View>
          )}

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
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.primary[50],
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.full,
    marginBottom: spacing[1],
    gap: spacing[1],
  },
  distanceIcon: {
    fontSize: typography.fontSize.sm,
  },
  distanceText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary[700],
  },
  time: {
    fontSize: typography.fontSize.xs,
    color: colors.text.tertiary,
  },
});

