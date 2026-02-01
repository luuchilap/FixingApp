import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../../hooks/useAuth';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import {
  getMyApplications,
  getJobApplications,
  ApplicationWithJob,
  ApplicationWithWorker,
} from '../../services/applicationsApi';
import { colors, spacing, typography } from '../../constants/designTokens';
import { MainStackParamList } from '../../navigation/MainStack';

type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

export const ApplicationsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { user } = useAuth();
  const [applications, setApplications] = useState<
    (ApplicationWithJob | ApplicationWithWorker)[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      setError(null);
      let apps: (ApplicationWithJob | ApplicationWithWorker)[];

      if (user?.role === 'WORKER') {
        // Workers see their own applications
        apps = await getMyApplications();
      } else {
        // For employers, we'd need a jobId - this screen shows all applications
        // For now, show empty or redirect to job detail
        apps = [];
      }

      setApplications(apps);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load applications';
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadApplications();
  }, [loadApplications]);

  const handleApplicationPress = (application: ApplicationWithJob | ApplicationWithWorker) => {
    // Navigate to job detail if it's a worker view
    if ('job' in application && application.job) {
      navigation.navigate('JobDetail', { jobId: application.job.id });
    }
  };

  const renderApplicationItem = ({
    item,
  }: {
    item: ApplicationWithJob | ApplicationWithWorker;
  }) => (
    <ApplicationCard
      application={item}
      onPress={handleApplicationPress}
      showActions={false}
    />
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {user?.role === 'WORKER'
          ? 'Bạn chưa ứng tuyển công việc nào.'
          : 'Không có ứng viên nào.'}
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

  if (error && applications.length === 0) {
    return (
      <View style={styles.container}>
        {renderError()}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        renderItem={renderApplicationItem}
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

