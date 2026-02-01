import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { validatePhone, validatePassword } from '../../utils/validation';
import { SKILLS, SkillValue } from '../../constants/skills';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { Select } from '../ui/Select';

interface RegisterWorkerFormProps {
  onSuccess?: () => void;
  onNavigateToLogin?: () => void;
}

export const RegisterWorkerForm: React.FC<RegisterWorkerFormProps> = ({ onSuccess, onNavigateToLogin }) => {
  const { register, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [skill, setSkill] = useState<SkillValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!phone || !password || !fullName || !skill || skill === '') {
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
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
      await register({
        phone,
        password,
        fullName,
        address: address || undefined,
        skill: skill as SkillValue,
        role: 'WORKER',
      });
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Đăng ký thất bại';
      setError(errorMessage);
      Alert.alert('Đăng ký thất bại', errorMessage);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Đăng ký Người lao động</Text>
      <Text style={styles.subtitle}>
        Tạo tài khoản người lao động để tìm công việc phù hợp với kỹ năng của bạn.
      </Text>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Số điện thoại <Text style={styles.required}>*</Text>
          </Text>
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
          <Text style={styles.label}>
            Mật khẩu <Text style={styles.required}>*</Text>
          </Text>
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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Họ và tên <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nhập họ và tên của bạn"
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputGroup}>
          <AddressAutocomplete
            label="Địa chỉ"
            value={address}
            onChange={(addr) => setAddress(addr)}
            placeholder="Nhập địa chỉ của bạn (không bắt buộc)"
          />
        </View>

        <View style={styles.inputGroup}>
          <Select
            label="Kỹ năng chính *"
            placeholder="-- Chọn kỹ năng --"
            value={skill || ''}
            onChange={(value) => setSkill(value as SkillValue || null)}
            options={SKILLS.map((skillOption) => ({
              label: skillOption.label,
              value: skillOption.value,
            }))}
            disabled={isLoading}
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
            <Text style={styles.buttonText}>Tạo tài khoản người lao động</Text>
          )}
        </TouchableOpacity>

        {onNavigateToLogin && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={onNavigateToLogin}
            disabled={isLoading}
          >
            <Text style={styles.backButtonText}>Quay lại Đăng nhập</Text>
          </TouchableOpacity>
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
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
  required: {
    color: '#dc2626',
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
  backButton: {
    marginTop: 16,
    padding: 12,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '500',
  },
});

