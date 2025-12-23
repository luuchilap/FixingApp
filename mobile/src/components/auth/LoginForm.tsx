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
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { login, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    // Validation
    if (!phone || !password) {
      setError('Please enter phone and password');
      return;
    }

    if (!validatePhone(phone)) {
      setError('Please enter a valid phone number (10 digits, starts with 0)');
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      await login({ phone, password });
      onSuccess?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      Alert.alert('Login Failed', errorMessage);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.subtitle}>
        Use the phone number and password you registered with.
      </Text>

      <View style={styles.sampleAccounts}>
        <Text style={styles.sampleTitle}>Sample Accounts for Testing</Text>
        <Text style={styles.sampleText}>
          <Text style={styles.sampleLabel}>Employer:</Text> 0901234567 / password123
        </Text>
        <Text style={styles.sampleText}>
          <Text style={styles.sampleLabel}>Worker:</Text> 0913456789 / password123
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
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
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
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
            <Text style={styles.buttonText}>Sign in</Text>
          )}
        </TouchableOpacity>
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
});

