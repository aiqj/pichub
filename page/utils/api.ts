import axios from 'axios';

// 根据环境确定API基础URL
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

console.log('API_HOST 配置:', API_HOST);

const api = axios.create({
  baseURL: API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
  // 禁用跨域请求携带凭证，解决CORS问题
  withCredentials: false 
});

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  (config) => {
    // A只在客户端执行
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        // 调试信息
        console.log(`请求拦截: 添加Authorization到 ${config.url}`);
      } else {
        console.log(`请求拦截: 无token可用于 ${config.url}`);
      }
    }
    return config;
  },
  (error) => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    // 调试信息
    console.log(`响应成功: ${response.config.url}`, response.status);
    return response;
  },
  (error) => {
    // 调试信息
    console.error('API响应错误:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    
    // 仅标记401错误，但不自动重定向
    if (typeof window !== 'undefined' && error.response && error.response.status === 401) {
      console.warn('收到401错误，认证可能已过期');
      error.isAuthError = true;
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
};

export default api; 