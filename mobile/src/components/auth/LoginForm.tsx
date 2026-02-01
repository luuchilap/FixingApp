import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { validatePhone, validatePassword } from '../../utils/validation';

interface LoginFormProps {
  onSuccess?: () => void;
  onNavigateToRegister?: (role: 'EMPLOYER' | 'WORKER') => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onNavigateToRegister }) => {
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!phone || !password) {
      setError('Vui lòng nhập số điện thoại và mật khẩu');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10 chữ số, bắt đầu bằng 0)');
      return;
    }

    if (!validatePassword(password)) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      await login({ phone, password });
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setError(errorMessage);
      Alert.alert('Đăng nhập thất bại', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <Text style={styles.subtitle}>
        Sử dụng số điện thoại và mật khẩu bạn đã đăng ký.
      </Text>

      <View style={styles.sampleAccounts}>
        <Text style={styles.sampleTitle}>Tài khoản mẫu để thử nghiệm</Text>
        <Text style={styles.sampleText}>
          <Text style={styles.sampleLabel}>Nhà tuyển dụng:</Text> 0901234567 / password123
        </Text>
        <Text style={styles.sampleText}>
          <Text style={styles.sampleLabel}>Người lao động:</Text> 0913456789 / password123
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số điện thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="0901234567"
            keyboardType="phone-pad"
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mật khẩu</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Nhập mật khẩu của bạn"
            secureTextEntry
            autoCapitalize="none"
            editable={!isLoading}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Đăng nhập</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.registerSection}>
        <Text style={styles.registerText}>Chưa có tài khoản?</Text>
        <View style={styles.registerButtons}>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => onNavigateToRegister?.('EMPLOYER')}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>Đăng ký làm Nhà tuyển dụng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => onNavigateToRegister?.('WORKER')}
            disabled={isLoading}
          >
            <Text style={styles.registerButtonText}>Đăng ký làm Người lao động</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  sampleAccounts: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sampleTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sampleText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 4,
  },
  sampleLabel: {
    fontWeight: '600',
    color: '#334155',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#334155',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  error: {
    color: '#dc2626',
    fontSize: 14,
    marginTop: 4,
  },
  button: {
    backgroundColor: '#0284c7',
    borderRadius: 24,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerSection: {
    marginTop: 24,
    alignItems: 'center',
  },
  registerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 12,
  },
  registerButtons: {
    width: '100%',
    gap: 8,
  },
  registerButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  registerButtonText: {
    color: '#0284c7',
    fontSize: 14,
    fontWeight: '600',
  },
});

