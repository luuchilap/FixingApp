# Hướng dẫn phát triển Mobile App với React Native

Tài liệu này mô tả chi tiết cách phát triển ứng dụng mobile cho FixingApp sử dụng React Native, kết nối với backend API hiện có.

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Kiến trúc và công nghệ](#kiến-trúc-và-công-nghệ)
3. [Setup Project](#setup-project)
4. [Cấu trúc thư mục](#cấu-trúc-thư-mục)
5. [API Integration](#api-integration)
6. [Authentication](#authentication)
7. [Navigation](#navigation)
8. [State Management](#state-management)
9. [UI Components](#ui-components)
10. [Tính năng chính](#tính-năng-chính)
11. [Testing](#testing)
12. [Build và Deployment](#build-và-deployment)

---

## Tổng quan

### Mục tiêu

Phát triển ứng dụng mobile React Native cho FixingApp với các tính năng:
- **Employer (Người thuê)**: Đăng tin công việc, quản lý ứng viên, chấp nhận/từ chối, đánh giá worker
- **Worker (Người làm việc)**: Tìm kiếm công việc, ứng tuyển, quản lý chứng chỉ, xem đánh giá
- **Admin**: Quản lý hệ thống, duyệt chứng chỉ, xử lý khiếu nại

### Backend API

Backend hiện tại chạy tại: `http://localhost:3000` (development) hoặc production URL.

Tất cả API endpoints đã được document trong Swagger UI tại `/api-docs`.

### Cấu hình đã test

**✅ Cấu hình đã được kiểm tra và hoạt động tốt với Android Studio:**

- **Node.js**: Version hiện tại (LTS khuyến nghị)
- **Expo SDK**: 51.0.20
- **React**: 18.2.0
- **React Native**: 0.74.3
- **TypeScript**: 5.3.3
- **Android Studio**: Latest với Android SDK Platform 33+

**Project reference**: Xem cấu hình chi tiết trong `01-fe-react-native-todo/` (đã được gitignore)

---

## Kiến trúc và công nghệ

### Tech Stack đề xuất

```json
{
  "framework": "React Native (Expo hoặc React Native CLI)",
  "navigation": "@react-navigation/native",
  "stateManagement": "React Context API + AsyncStorage (hoặc Zustand/Redux Toolkit)",
  "httpClient": "axios",
  "storage": "@react-native-async-storage/async-storage",
  "forms": "react-hook-form",
  "ui": "react-native-paper hoặc NativeBase hoặc custom components",
  "imagePicker": "expo-image-picker hoặc react-native-image-picker",
  "notifications": "expo-notifications hoặc @react-native-firebase/messaging",
  "testing": "Jest + React Native Testing Library"
}
```

### Kiến trúc đề xuất

```
┌─────────────────────────────────────┐
│         React Native App            │
├─────────────────────────────────────┤
│  Navigation Layer (@react-navigation)│
├─────────────────────────────────────┤
│  State Management (Context/Store)    │
├─────────────────────────────────────┤
│  API Layer (axios + interceptors)   │
├─────────────────────────────────────┤
│  Storage Layer (AsyncStorage)       │
├─────────────────────────────────────┤
│  UI Components (Custom/UI Library)   │
└─────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│      Backend REST API (Express)      │
└─────────────────────────────────────┘
```

---

## Setup Project

### Yêu cầu hệ thống

**Node.js**: Version hiện tại (LTS khuyến nghị)
- Download tại: https://nodejs.org/
- Kiểm tra version: `node --version`
- Yêu cầu tối thiểu: Node.js 16.x trở lên

**Android Studio**: 
- Cài đặt Android Studio từ https://developer.android.com/studio
- Cài đặt Android SDK (API Level 33 trở lên)
- Cấu hình ANDROID_HOME environment variable

**Expo CLI** (tùy chọn, nhưng khuyến nghị):
```bash
npm install -g expo-cli
```

### Option 1: Expo (Khuyến nghị - Đã test với Android Studio)

**Bước 1: Tạo project mới**

```bash
# Tạo project với Expo và TypeScript
npx create-expo-app fixingapp-mobile --template blank-typescript

cd fixingapp-mobile
```

**Bước 2: Cài đặt dependencies cơ bản**

Project sẽ tự động có các dependencies sau (theo cấu hình đã test):
- `expo`: 51.0.20
- `react`: 18.2.0
- `react-native`: 0.74.3
- `typescript`: 5.3.3

```bash
# Cài đặt các dependencies cần thiết
npm install @react-navigation/native @react-navigation/stack @react-navigation/bottom-tabs
npm install react-native-screens react-native-safe-area-context
npm install @react-native-async-storage/async-storage
npm install axios
npm install react-hook-form
npm install expo-image-picker
npm install expo-notifications
```

**Bước 3: Cấu hình `package.json`**

Đảm bảo `package.json` có scripts sau:

```json
{
  "scripts": {
    "start": "expo start",
    "dev": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web"
  }
}
```

**Bước 4: Cấu hình `babel.config.js`**

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

**Bước 5: Cấu hình `tsconfig.json`**

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true
  }
}
```

**Bước 6: Cấu hình `app.json`**

```json
{
  "expo": {
    "name": "FixingApp",
    "slug": "fixingapp-mobile",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "supportsTablet": true
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

**Bước 7: Chạy project trên Android Studio**

1. Mở Android Studio
2. Mở AVD Manager và tạo/khởi động Android Emulator
3. Trong terminal, chạy:
```bash
npm start
# hoặc
npm run dev
# hoặc để tự động mở trên Android
npm run android
```

4. Expo sẽ tự động phát hiện emulator và load app

**Lưu ý**: Nếu gặp lỗi kết nối, đảm bảo:
- Android Emulator đang chạy
- `ANDROID_HOME` environment variable đã được set
- Port 8081 không bị chiếm dụng

### Option 2: React Native CLI (Cho production build)

```bash
# Tạo project
npx react-native init FixingAppMobile --template react-native-template-typescript

cd FixingAppMobile

# Cài đặt dependencies (tương tự như trên)
```

### Cấu hình môi trường

**Tạo file `.env`:**

```env
API_BASE_URL=http://localhost:3000
# Hoặc production URL
# API_BASE_URL=https://api.fixingapp.com
```

**Cài đặt `react-native-dotenv`:**

```bash
npm install react-native-dotenv
```

**Cập nhật `babel.config.js` để hỗ trợ dotenv:**

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module:react-native-dotenv', {
        moduleName: '@env',
        path: '.env',
      }],
    ],
  };
};
```

**Sử dụng trong code:**

```typescript
import { API_BASE_URL } from '@env';
```

### Cấu hình Android Studio

**1. Cài đặt Android SDK:**
- Mở Android Studio → Preferences → Appearance & Behavior → System Settings → Android SDK
- Cài đặt Android SDK Platform 33 (hoặc mới hơn)
- Cài đặt Android SDK Build-Tools

**2. Cấu hình Environment Variables (macOS/Linux):**

Thêm vào `~/.zshrc` hoặc `~/.bash_profile`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
```

Sau đó chạy:
```bash
source ~/.zshrc  # hoặc source ~/.bash_profile
```

**3. Tạo Android Virtual Device (AVD):**
- Mở Android Studio → Tools → Device Manager
- Click "Create Device"
- Chọn device (ví dụ: Pixel 5)
- Chọn system image (ví dụ: API 33)
- Finish

**4. Khởi động Emulator:**
- Trong Device Manager, click nút Play để khởi động emulator
- Hoặc từ command line: `emulator -avd <AVD_NAME>`

---

## Cấu trúc thư mục

```
fixingapp-mobile/
├── src/
│   ├── api/
│   │   ├── http.ts              # HTTP client với interceptors
│   │   ├── auth.ts               # Auth API calls
│   │   ├── jobs.ts               # Jobs API calls
│   │   ├── applications.ts       # Applications API calls
│   │   ├── certificates.ts       # Certificates API calls
│   │   ├── reviews.ts            # Reviews API calls
│   │   ├── complaints.ts         # Complaints API calls
│   │   ├── notifications.ts      # Notifications API calls
│   │   └── chat.ts               # Chat API calls
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── ErrorMessage.tsx
│   │   ├── jobs/
│   │   │   ├── JobCard.tsx
│   │   │   ├── JobDetail.tsx
│   │   │   └── JobForm.tsx
│   │   ├── applications/
│   │   │   └── ApplicationCard.tsx
│   │   └── chat/
│   │       └── ChatMessage.tsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RegisterEmployerScreen.tsx
│   │   │   └── RegisterWorkerScreen.tsx
│   │   ├── jobs/
│   │   │   ├── JobsListScreen.tsx
│   │   │   ├── JobDetailScreen.tsx
│   │   │   └── CreateJobScreen.tsx
│   │   ├── applications/
│   │   │   └── ApplicationsScreen.tsx
│   │   ├── profile/
│   │   │   └── ProfileScreen.tsx
│   │   └── chat/
│   │       └── ChatScreen.tsx
│   ├── navigation/
│   │   ├── AppNavigator.tsx      # Main navigation
│   │   ├── AuthNavigator.tsx     # Auth screens
│   │   └── TabNavigator.tsx      # Bottom tabs
│   ├── context/
│   │   ├── AuthContext.tsx       # Authentication state
│   │   └── NotificationContext.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useJobs.ts
│   │   └── useNotifications.ts
│   ├── types/
│   │   ├── auth.ts
│   │   ├── jobs.ts
│   │   ├── applications.ts
│   │   └── index.ts
│   ├── utils/
│   │   ├── storage.ts            # AsyncStorage helpers
│   │   ├── validation.ts        # Form validation
│   │   └── formatting.ts         # Date, price formatting
│   └── constants/
│       ├── colors.ts
│       ├── skills.ts
│       └── api.ts
├── App.tsx
├── app.json
└── package.json
```

---

## API Integration

### HTTP Client Setup

Tạo `src/api/http.ts`:

```typescript
import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '@env';

const TOKEN_KEY = 'fa_token';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor: Thêm token vào header
    this.client.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor: Xử lý lỗi
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token hết hạn hoặc không hợp lệ
          await AsyncStorage.removeItem(TOKEN_KEY);
          await AsyncStorage.removeItem('fa_user');
          // Có thể dispatch action để logout
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const response = await this.client.get(path, { params });
    return response.data;
  }

  async post<TReq, TRes>(path: string, data: TReq): Promise<TRes> {
    const response = await this.client.post(path, data);
    return response.data;
  }

  async put<TReq, TRes>(path: string, data: TReq): Promise<TRes> {
    const response = await this.client.put(path, data);
    return response.data;
  }

  async delete<T>(path: string): Promise<T> {
    const response = await this.client.delete(path);
    return response.data;
  }

  // Upload file với FormData
  async upload<TRes>(path: string, formData: FormData): Promise<TRes> {
    const response = await this.client.post(path, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### API Modules

**`src/api/auth.ts`:**

```typescript
import { apiClient } from './http';
import type { LoginRequest, RegisterEmployerRequest, RegisterWorkerRequest, AuthResponse } from '../types/auth';

export const authApi = {
  login: (payload: LoginRequest): Promise<AuthResponse> =>
    apiClient.post('/api/auth/login', payload),

  registerEmployer: (payload: RegisterEmployerRequest): Promise<AuthResponse> =>
    apiClient.post('/api/auth/register-employer', payload),

  registerWorker: (payload: RegisterWorkerRequest): Promise<AuthResponse> =>
    apiClient.post('/api/auth/register-worker', payload),

  logout: (): Promise<void> =>
    apiClient.post('/api/auth/logout', {}),
};
```

**`src/api/jobs.ts`:**

```typescript
import { apiClient } from './http';
import type { Job, JobsQuery } from '../types/jobs';

export const jobsApi = {
  // Lấy danh sách jobs (cho Worker)
  getJobs: (query?: JobsQuery): Promise<Job[]> => {
    const params: Record<string, unknown> = {};
    if (query?.q) params.keyword = query.q;
    if (query?.skill) params.category = query.skill;
    if (query?.minPrice) params.minPrice = query.minPrice;
    if (query?.maxPrice) params.maxPrice = query.maxPrice;
    return apiClient.get('/api/jobs', params);
  },

  // Lấy jobs của Employer
  getMyJobs: (): Promise<Job[]> =>
    apiClient.get('/api/jobs/my'),

  // Lấy chi tiết job
  getJob: (jobId: number): Promise<Job> =>
    apiClient.get(`/api/jobs/${jobId}`),

  // Tạo job mới
  createJob: (data: FormData | {
    title: string;
    description: string;
    price: number;
    address: string;
    requiredSkill?: string;
  }): Promise<Job> => {
    if (data instanceof FormData) {
      return apiClient.upload('/api/jobs', data);
    }
    return apiClient.post('/api/jobs', data);
  },

  // Cập nhật job
  updateJob: (jobId: number, data: Partial<Job>): Promise<Job> =>
    apiClient.put(`/api/jobs/${jobId}`, data),

  // Xóa job
  deleteJob: (jobId: number): Promise<void> =>
    apiClient.delete(`/api/jobs/${jobId}`),

  // Hoàn thành job
  completeJob: (jobId: number): Promise<Job> =>
    apiClient.post(`/api/jobs/${jobId}/complete`, {}),
};
```

**`src/api/applications.ts`:**

```typescript
import { apiClient } from './http';
import type { JobApplication } from '../types/applications';

export const applicationsApi = {
  // Worker: Ứng tuyển vào job
  applyToJob: (jobId: number): Promise<JobApplication> =>
    apiClient.post(`/api/jobs/${jobId}/apply`, {}),

  // Worker: Lấy danh sách applications của mình
  getMyApplications: (): Promise<JobApplication[]> =>
    apiClient.get('/api/applications/my'),

  // Employer: Lấy danh sách applications cho một job
  getJobApplications: (jobId: number): Promise<JobApplication[]> =>
    apiClient.get(`/api/jobs/${jobId}/applications`),

  // Employer: Chấp nhận application
  acceptApplication: (jobId: number, workerId: number): Promise<JobApplication> =>
    apiClient.post(`/api/jobs/${jobId}/accept/${workerId}`, {}),

  // Employer: Từ chối application
  rejectApplication: (jobId: number, workerId: number): Promise<JobApplication> =>
    apiClient.post(`/api/jobs/${jobId}/reject/${workerId}`, {}),
};
```

---

## Authentication

### Auth Context

Tạo `src/context/AuthContext.tsx`:

```typescript
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi } from '../api/auth';
import { apiClient } from '../api/http';
import type { AuthUser, LoginRequest, RegisterEmployerRequest, RegisterWorkerRequest, AuthResponse } from '../types/auth';

const TOKEN_KEY = 'fa_token';
const USER_KEY = 'fa_user';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  registerEmployer: (payload: RegisterEmployerRequest) => Promise<void>;
  registerWorker: (payload: RegisterWorkerRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo: Kiểm tra token và user từ storage
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      const userStr = await AsyncStorage.getItem(USER_KEY);

      if (token && userStr) {
        const parsedUser = JSON.parse(userStr) as AuthUser;
        setUser(parsedUser);
        // Refresh user từ server
        await refreshUser();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const persistAuth = async (token: string, userData: AuthUser) => {
    await AsyncStorage.setItem(TOKEN_KEY, token);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    setUser(userData);
  };

  const login = useCallback(async (payload: LoginRequest) => {
    const response: AuthResponse = await authApi.login(payload);
    await persistAuth(response.token, response.user);
  }, []);

  const registerEmployer = useCallback(async (payload: RegisterEmployerRequest) => {
    const response: AuthResponse = await authApi.registerEmployer(payload);
    await persistAuth(response.token, response.user);
  }, []);

  const registerWorker = useCallback(async (payload: RegisterWorkerRequest) => {
    const response: AuthResponse = await authApi.registerWorker(payload);
    await persistAuth(response.token, response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const userData = await apiClient.get<AuthUser>('/api/users/me');
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Refresh user error:', error);
      // Token có thể đã hết hạn
      await logout();
    }
  }, [logout]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        registerEmployer,
        registerWorker,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Auth Screens

**`src/screens/auth/LoginScreen.tsx`:**

```typescript
import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { useNavigation } from '@react-navigation/native';

export function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigation = useNavigation();

  const handleLogin = async () => {
    if (!phone || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      await login({ phone, password });
      // Navigation sẽ tự động chuyển dựa trên auth state
    } catch (error: any) {
      Alert.alert('Đăng nhập thất bại', error.response?.data?.message || 'Vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Đăng nhập</Text>

        <Input
          label="Số điện thoại"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Nhập số điện thoại"
        />

        <Input
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Nhập mật khẩu"
        />

        <Button
          title="Đăng nhập"
          onPress={handleLogin}
          loading={loading}
          style={styles.button}
        />

        <View style={styles.registerLinks}>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('RegisterEmployer' as never)}
          >
            Đăng ký Employer
          </Text>
          <Text
            style={styles.link}
            onPress={() => navigation.navigate('RegisterWorker' as never)}
          >
            Đăng ký Worker
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginTop: 20,
  },
  registerLinks: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  link: {
    color: '#007AFF',
    fontSize: 14,
  },
});
```

---

## Navigation

### Navigation Setup

**`src/navigation/AppNavigator.tsx`:**

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { TabNavigator } from './TabNavigator';
import { LoadingScreen } from '../screens/common/LoadingScreen';

const Stack = createStackNavigator();

export function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

**`src/navigation/TabNavigator.tsx`:**

```typescript
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { JobsListScreen } from '../screens/jobs/JobsListScreen';
import { CreateJobScreen } from '../screens/jobs/CreateJobScreen';
import { ApplicationsScreen } from '../screens/applications/ApplicationsScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { ChatListScreen } from '../screens/chat/ChatListScreen';

const Tab = createBottomTabNavigator();

export function TabNavigator() {
  const { user } = useAuth();
  const isEmployer = user?.role === 'EMPLOYER';
  const isWorker = user?.role === 'WORKER';

  return (
    <Tab.Navigator>
      {isWorker && (
        <Tab.Screen
          name="Jobs"
          component={JobsListScreen}
          options={{ title: 'Tìm việc' }}
        />
      )}

      {isEmployer && (
        <Tab.Screen
          name="CreateJob"
          component={CreateJobScreen}
          options={{ title: 'Đăng việc' }}
        />
      )}

      {isEmployer && (
        <Tab.Screen
          name="MyJobs"
          component={JobsListScreen}
          options={{ title: 'Việc của tôi' }}
        />
      )}

      <Tab.Screen
        name="Applications"
        component={ApplicationsScreen}
        options={{ title: 'Ứng tuyển' }}
      />

      <Tab.Screen
        name="Chat"
        component={ChatListScreen}
        options={{ title: 'Tin nhắn' }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Cá nhân' }}
      />
    </Tab.Navigator>
  );
}
```

---

## State Management

### Jobs Context (Optional)

Nếu cần quản lý state phức tạp, có thể tạo Context riêng:

**`src/context/JobsContext.tsx`:**

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { jobsApi } from '../api/jobs';
import type { Job } from '../types/jobs';

interface JobsContextValue {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  fetchJobs: (query?: any) => Promise<void>;
  refreshJobs: () => Promise<void>;
}

const JobsContext = createContext<JobsContextValue | undefined>(undefined);

export function JobsProvider({ children }: { children: React.ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async (query?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await jobsApi.getJobs(query);
      setJobs(data);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshJobs = useCallback(() => fetchJobs(), [fetchJobs]);

  return (
    <JobsContext.Provider value={{ jobs, loading, error, fetchJobs, refreshJobs }}>
      {children}
    </JobsContext.Provider>
  );
}

export function useJobs() {
  const context = useContext(JobsContext);
  if (!context) {
    throw new Error('useJobs must be used within JobsProvider');
  }
  return context;
}
```

---

## UI Components

### Common Components

**`src/components/common/Button.tsx`:**

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'outline';
  style?: ViewStyle;
}

export function Button({ title, onPress, loading, disabled, variant = 'primary', style }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        (disabled || loading) && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#34C759',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: '#fff',
  },
  outlineText: {
    color: '#007AFF',
  },
});
```

**`src/components/jobs/JobCard.tsx`:**

```typescript
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { Job } from '../../types/jobs';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const navigation = useNavigation();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('vi-VN');
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('JobDetail' as never, { jobId: job.id } as never)}
    >
      {job.images && job.images.length > 0 && (
        <Image source={{ uri: job.images[0].url }} style={styles.image} />
      )}

      <View style={styles.content}>
        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {job.description}
        </Text>

        <View style={styles.meta}>
          <Text style={styles.price}>{formatPrice(job.price)}</Text>
          <Text style={styles.date}>{formatDate(job.createdAt)}</Text>
        </View>

        {job.requiredSkill && (
          <View style={styles.skillTag}>
            <Text style={styles.skillText}>{job.requiredSkill}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  skillTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  skillText: {
    fontSize: 12,
    color: '#1976D2',
  },
});
```

---

## Tính năng chính

### 1. Jobs List Screen (Worker)

**`src/screens/jobs/JobsListScreen.tsx`:**

```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, RefreshControl } from 'react-native';
import { jobsApi } from '../../api/jobs';
import { JobCard } from '../../components/jobs/JobCard';
import { LoadingScreen } from '../common/LoadingScreen';
import { ErrorMessage } from '../../components/common/ErrorMessage';
import type { Job } from '../../types/jobs';

export function JobsListScreen() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setError(null);
      const data = await jobsApi.getJobs();
      setJobs(data);
    } catch (err: any) {
      setError(err.message || 'Không thể tải danh sách công việc');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadJobs();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadJobs} />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs}
        renderItem={({ item }) => <JobCard job={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
  },
});
```

### 2. Create Job Screen (Employer)

**`src/screens/jobs/CreateJobScreen.tsx`:**

```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { jobsApi } from '../../api/jobs';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { SKILLS } from '../../constants/skills';

export function CreateJobScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [address, setAddress] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || !address) {
      Alert.alert('Lỗi', 'Vui lòng điền đầy đủ thông tin');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('address', address);
      if (selectedSkill) {
        formData.append('requiredSkill', selectedSkill);
      }
      if (imageUri) {
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', {
          uri: imageUri,
          name: filename || 'image.jpg',
          type,
        } as any);
      }

      await jobsApi.createJob(formData);
      Alert.alert('Thành công', 'Đã tạo công việc thành công', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể tạo công việc');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView}>
        <Input
          label="Tiêu đề"
          value={title}
          onChangeText={setTitle}
          placeholder="Nhập tiêu đề công việc"
        />

        <Input
          label="Mô tả"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder="Nhập mô tả chi tiết"
        />

        <Input
          label="Giá (đ)"
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="Nhập giá"
        />

        <Input
          label="Địa chỉ"
          value={address}
          onChangeText={setAddress}
          placeholder="Nhập địa chỉ"
        />

        {/* Skill selector - có thể dùng Picker component */}

        <Button
          title="Chọn ảnh"
          onPress={pickImage}
          variant="outline"
          style={styles.imageButton}
        />

        {imageUri && (
          <Text style={styles.imageText}>Đã chọn ảnh</Text>
        )}

        <Button
          title="Đăng việc"
          onPress={handleSubmit}
          loading={loading}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  imageButton: {
    marginTop: 16,
  },
  imageText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  submitButton: {
    marginTop: 24,
  },
});
```

### 3. Applications Screen

**`src/screens/applications/ApplicationsScreen.tsx`:**

```typescript
import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { applicationsApi } from '../../api/applications';
import { ApplicationCard } from '../../components/applications/ApplicationCard';
import type { JobApplication } from '../../types/applications';

export function ApplicationsScreen() {
  const { user } = useAuth();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const data = await applicationsApi.getMyApplications();
      setApplications(data);
    } catch (error) {
      console.error('Load applications error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={applications}
        renderItem={({ item }) => <ApplicationCard application={item} />}
        keyExtractor={(item) => item.id.toString()}
        refreshing={loading}
        onRefresh={loadApplications}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});
```

---

## Testing

### Unit Tests với Jest

**`src/api/__tests__/jobs.test.ts`:**

```typescript
import { jobsApi } from '../jobs';
import { apiClient } from '../http';

jest.mock('../http');

describe('jobsApi', () => {
  it('should fetch jobs', async () => {
    const mockJobs = [{ id: 1, title: 'Test Job' }];
    (apiClient.get as jest.Mock).mockResolvedValue(mockJobs);

    const result = await jobsApi.getJobs();

    expect(result).toEqual(mockJobs);
    expect(apiClient.get).toHaveBeenCalledWith('/api/jobs', undefined);
  });
});
```

### Component Tests

**`src/components/jobs/__tests__/JobCard.test.tsx`:**

```typescript
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { JobCard } from '../JobCard';
import type { Job } from '../../../types/jobs';

const mockJob: Job = {
  id: 1,
  employerId: 1,
  title: 'Test Job',
  description: 'Test Description',
  price: 100000,
  address: 'Test Address',
  status: 'CHUA_LAM',
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('JobCard', () => {
  it('renders job information correctly', () => {
    const { getByText } = render(<JobCard job={mockJob} />);
    expect(getByText('Test Job')).toBeTruthy();
    expect(getByText('Test Description')).toBeTruthy();
  });
});
```

---

## Build và Deployment

### Development Build (Expo)

**Chạy trên Android Emulator:**

```bash
# Khởi động Expo dev server
npm start
# hoặc
npm run dev

# Trong terminal khác, hoặc nhấn 'a' trong Expo CLI để mở trên Android
npm run android
```

**Chạy trên thiết bị thật:**

1. Cài đặt Expo Go app từ Play Store (Android) hoặc App Store (iOS)
2. Chạy `npm start` để khởi động dev server
3. Quét QR code bằng Expo Go app

### Production Build với Expo

**Cài đặt EAS CLI:**

```bash
npm install -g eas-cli
eas login
```

**Cấu hình `eas.json`:**

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

**Build APK cho Android:**

```bash
# Build preview (APK)
eas build --platform android --profile preview

# Build production (AAB cho Play Store)
eas build --platform android --profile production
```

**Build cho iOS:**

```bash
eas build --platform ios --profile production
```

### React Native CLI Build (Nếu không dùng Expo)

**Android:**

```bash
cd android
./gradlew assembleRelease
# APK sẽ nằm tại: android/app/build/outputs/apk/release/app-release.apk
```

**iOS:**

```bash
cd ios
pod install
# Mở Xcode và build
```

### Environment Variables

**Với Expo:**

Sử dụng `expo-constants` để quản lý biến môi trường:

```bash
npm install expo-constants
```

```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000';
```

Cấu hình trong `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiBaseUrl": "http://localhost:3000"
    }
  }
}
```

**Với React Native CLI:**

Sử dụng `react-native-config`:

```bash
npm install react-native-config
```

---

## Troubleshooting

### Lỗi thường gặp với Android Studio

**1. "SDK location not found"**

Giải pháp:
```bash
# Tạo file local.properties trong thư mục android/
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties
```

**2. "Metro bundler can't connect to emulator"**

Giải pháp:
- Đảm bảo emulator đang chạy
- Kiểm tra port 8081: `lsof -i :8081`
- Nếu port bị chiếm: `kill -9 <PID>`
- Restart Metro: `npm start -- --reset-cache`

**3. "Unable to load script"**

Giải pháp:
```bash
# Clear cache và restart
npm start -- --reset-cache
# Hoặc
watchman watch-del-all
rm -rf node_modules
npm install
```

**4. "ANDROID_HOME not set"**

Giải pháp:
- Thêm vào `~/.zshrc` hoặc `~/.bash_profile`:
```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```
- Chạy `source ~/.zshrc`

**5. "Expo Go không kết nối được"**

Giải pháp:
- Đảm bảo điện thoại và máy tính cùng mạng WiFi
- Hoặc sử dụng tunnel: `npm start -- --tunnel`
- Kiểm tra firewall không chặn port 8081

**6. "Build failed với Gradle"**

Giải pháp:
```bash
cd android
./gradlew clean
./gradlew assembleDebug
```

**7. "TypeScript errors"**

Giải pháp:
- Kiểm tra `tsconfig.json` extends `expo/tsconfig.base`
- Clear TypeScript cache: `rm -rf node_modules/.cache`

### Kiểm tra cấu hình

**Kiểm tra Node.js version:**
```bash
node --version  # Nên là LTS version (16.x trở lên)
```

**Kiểm tra Android SDK:**
```bash
echo $ANDROID_HOME
adb version
```

**Kiểm tra Expo:**
```bash
npx expo --version
```

**Kiểm tra Java (cho Android build):**
```bash
java -version  # Phải là Java 17 hoặc 11
```

---

## Checklist triển khai

### Phase 1: Foundation
- [ ] Setup React Native project (Expo hoặc CLI)
- [ ] Cấu hình navigation
- [ ] Setup API client với interceptors
- [ ] Implement Authentication flow
- [ ] Setup AsyncStorage cho token/user

### Phase 2: Core Features
- [ ] Jobs List Screen (Worker)
- [ ] Job Detail Screen
- [ ] Create Job Screen (Employer)
- [ ] Applications Screen
- [ ] Profile Screen

### Phase 3: Advanced Features
- [ ] Chat/Messaging
- [ ] Notifications
- [ ] Certificates upload (Worker)
- [ ] Reviews và Ratings
- [ ] Complaints

### Phase 4: Polish
- [ ] Error handling và retry logic
- [ ] Loading states
- [ ] Pull-to-refresh
- [ ] Image caching
- [ ] Offline support (optional)

### Phase 5: Testing & Deployment
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests (optional)
- [ ] Build cho Android
- [ ] Build cho iOS
- [ ] Deploy lên App Store / Play Store

---

## Lưu ý quan trọng

### Cấu hình hệ thống

1. **Node.js Version**: Sử dụng Node.js LTS version hiện tại (đã test với v20.14.0, nhưng các version khác cũng hoạt động tốt)
2. **Expo SDK**: Version 51.0.20 (tương thích với React Native 0.74.3)
3. **Android Studio**: Đảm bảo đã cài đặt Android SDK Platform 33+ và Build Tools
4. **Environment Variables**: Cấu hình `ANDROID_HOME` đúng đường dẫn SDK

### Development

1. **API Base URL**: Đảm bảo cấu hình đúng API base URL cho từng môi trường
   - Development: `http://localhost:3000` hoặc `http://10.0.2.2:3000` (cho Android Emulator)
   - Production: URL thực tế của backend
2. **Metro Bundler**: Luôn chạy `npm start` trước khi mở app trên emulator
3. **Hot Reload**: Expo hỗ trợ Fast Refresh tự động, không cần restart app

### Security & Best Practices

1. **Token Management**: Token được lưu trong AsyncStorage, cần xử lý refresh token nếu backend hỗ trợ
2. **Image Upload**: Sử dụng FormData để upload ảnh, đảm bảo format đúng với backend
3. **Error Handling**: Xử lý lỗi network, timeout, và validation errors
4. **Performance**: Sử dụng FlatList cho danh sách dài, implement pagination nếu cần
5. **Security**: Không hardcode API keys, sử dụng environment variables hoặc `expo-constants`

### Android Studio Specific

1. **AVD Configuration**: Tạo AVD với API Level 33+ để tương thích tốt nhất
2. **Emulator Performance**: Nếu emulator chạy chậm, tăng RAM allocation trong AVD settings
3. **Network**: Khi test với backend local, Android Emulator sử dụng `10.0.2.2` thay vì `localhost`
4. **Build Cache**: Nếu gặp lỗi build, clear cache: `cd android && ./gradlew clean`

---

## Tài liệu tham khảo

- [React Native Documentation](https://reactnative.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Expo Documentation](https://docs.expo.dev/)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)
- Backend API Swagger: `http://localhost:3000/api-docs`

---

**Tài liệu này sẽ được cập nhật khi có thay đổi về API hoặc tính năng mới.**

