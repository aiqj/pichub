import axios from 'axios';

// 根据环境确定API基础URL
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

const api = axios.create({
  baseURL: API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: false
});

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      // 登录和注册接口不需要token
      if (token && !config.url?.includes('/api/login') && !config.url?.includes('/api/register')) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        error.isAuthError = true;
        
        // 清除本地存储的认证信息
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
    return Promise.reject(error);
  }
);

// 一个包装器函数，自动处理路径是否需要添加/api前缀
const apiWrapper = (path: string) => {
  // 如果path已经包含/api，或者使用了外部API（以http开头），则不添加/api前缀
  if (path.startsWith('/api') || path.startsWith('http')) {
    return path;
  }
  return `/api${path}`;
};

// 认证相关API
export const authApi = {
  register: (data: { username: string; password: string; email: string }) => {
    return api.post('/api/register', data);
  },
  login: (data: { username: string; password: string }) => {
    return api.post('/api/login', data);
  },
  getUserInfo: () => {
    return api.get('/api/user');
  },
  updateProfile: (data: { email?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => {
    return api.put('/api/user', data);
  },
};

// 文件相关API
export const fileApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  },
  getUserFiles: () => {
    return api.get('/api/files');
  },
  deleteFile: (fileId: number) => {
    return api.delete('/api/files', {
      data: { fileId }
    });
  }
};

// 统计相关API
export const statsApi = {
  getR2Stats: () => {
    return api.get('/api/analytics');
  },
};

// 管理员相关API
export const adminApi = {
  getAllUsers: () => {
    return api.get('/api/admin/users');
  },
  activateUser: (userId: number, isActive: boolean) => {
    return api.post('/api/admin/users/activate', {
      action: 'activate',
      userId,
      isActive
    });
  },
  getAllFiles: () => {
    return api.get('/api/admin/files');
  },
  updateUserPassword: (userId: number, newPassword: string) => {
    return api.post('/api/admin/users/update-password', {
      action: 'update-password',
      userId,
      newPassword
    });
  },
  deleteUser: (userId: number) => {
    return api.post('/api/admin/users/delete', {
      action: 'delete',
      userId
    });
  },
  getLogs: (params?: {
    limit?: number;
    offset?: number;
    action_type?: string;
    user_id?: number;
    start_date?: string;
    end_date?: string;
    is_system?: boolean;
    sort?: 'asc' | 'desc';
  }) => {
    return api.get('/api/admin/logs', { params });
  },
  getUserStats: () => {
    return api.get('/api/admin/users/stats');
  },
};

export default api; 