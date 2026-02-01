import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { JobCard } from '../../components/jobs/JobCard';
import { JobFilters, JobFilters as JobFiltersType } from '../../components/jobs/JobFilters';
import { Job } from '../../types/jobs';
import { listJobs, getMyJobs } from '../../services/jobsApi';
import { colors, spacing, typography } from '../../constants/designTokens';
import { MainStackParamList } from '../../navigation/MainStack';
import { calculateDistance } from '../../utils/distance';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const JobsListScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<JobFiltersType>({});

  const loadJobs = useCallback(async () => {
    try {
      setError(null);
      let jobsData: Job[];

      if (user?.role === 'EMPLOYER') {
        // Employers see their own jobs with filters
        // Note: getMyJobs doesn't support filters, so we'll filter client-side
        const allJobs = await getMyJobs();
        
        // Apply client-side filtering for employers
        let filtered = allJobs.filter((job) => {
          if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            const matchesKeyword = 
              job.title.toLowerCase().includes(keyword) ||
              job.description.toLowerCase().includes(keyword);
            if (!matchesKeyword) return false;
          }
          if (filters.category && job.requiredSkill !== filters.category) {
            return false;
          }
          if (filters.minPrice && job.price < filters.minPrice) {
            return false;
          }
          if (filters.maxPrice && job.price > filters.maxPrice) {
            return false;
          }
          return true;
        });
        
        // Apply location filtering if provided
        if (filters.latitude && filters.longitude && filters.maxDistance) {
          const userLat = filters.latitude;
          const userLon = filters.longitude;
          const maxDist = filters.maxDistance;
          
          // Calculate distance for each job and filter
          filtered = filtered
            .map((job) => {
              if (job.latitude != null && job.longitude != null) {
                const jobLat = typeof job.latitude === 'string' ? parseFloat(job.latitude) : job.latitude;
                const jobLon = typeof job.longitude === 'string' ? parseFloat(job.longitude) : job.longitude;
                
                if (!isNaN(jobLat) && !isNaN(jobLon) && isFinite(jobLat) && isFinite(jobLon)) {
                  const distance = calculateDistance(userLat, userLon, jobLat, jobLon);
                  return { ...job, distance };
                }
              }
              return { ...job, distance: null };
            })
            .filter((job) => {
              // Only include jobs with valid distance within maxDistance
              return job.distance != null && job.distance <= maxDist;
            })
            .sort((a, b) => {
              // Sort by distance
              const distA = a.distance || Infinity;
              const distB = b.distance || Infinity;
              return distA - distB;
            });
        }
        
        jobsData = filtered;
      } else {
        // Workers see all available jobs with filters
        const params: Parameters<typeof listJobs>[0] = {
          status: 'CHUA_LAM',
          ...filters,
        };
        jobsData = await listJobs(params);
      }

      setJobs(jobsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load jobs';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.role, filters]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadJobs();
  }, [loadJobs]);

  const handleJobPress = (job: Job) => {
    navigation.navigate('JobDetail', { jobId: job.id });
  };

  const renderJobItem = ({ item }: { item: Job }) => (
    <JobCard job={item} onPress={handleJobPress} />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {user?.role === 'EMPLOYER'
          ? 'Bạn chưa đăng công việc nào. Hãy tạo công việc mới!'
          : 'Không có công việc nào phù hợp.'}
      </Text>
    </View>
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Text style={styles.errorText}>{error}</Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (error && jobs.length === 0) {
    return (
      <View style={styles.container}>
        {renderError()}
      </View>
    );
  }

  const handleCreateJob = () => {
    navigation.navigate('CreateJob');
  };

  const handleFilterChange = (newFilters: JobFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <View style={styles.container}>
      {user?.role === 'EMPLOYER' && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateJob}
          >
            <Text style={styles.createButtonText}>+ Đăng công việc mới</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Filter Form - Always visible like web */}
      <JobFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        onClear={handleClearFilters}
      />

      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary[500]]}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.white,
  },
  header: {
    padding: spacing[4],
    paddingBottom: spacing[2],
    backgroundColor: colors.background.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  createButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.text.inverse,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  listContent: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
  },
  errorText: {
    fontSize: typography.fontSize.base,
    color: colors.error[500],
    textAlign: 'center',
  },
});

