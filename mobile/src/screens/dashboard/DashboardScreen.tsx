import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAuth } from '../../hooks/useAuth';

export const DashboardScreen: React.FC = () => {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Trang chủ</Text>
      <Text style={styles.subtitle}>
        Xin chào, {user?.fullName || user?.phone}!
      </Text>
      <Text style={styles.roleText}>Vai trò: {user?.role === 'EMPLOYER' ? 'Nhà tuyển dụng' : user?.role === 'WORKER' ? 'Người lao động' : user?.role}</Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          Đây là trang chủ của bạn. Các tính năng chính của ứng dụng sẽ được hiển thị ở đây.
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#475569',
    marginBottom: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  infoBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});

