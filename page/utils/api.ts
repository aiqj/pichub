import axios from 'axios';

// 根据环境确定API基础URL
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

console.log('API_HOST 配置:', API_HOST);

const api = axios.create({
  baseURL: API_HOST,
  headers: {
    'Content-Type': 'application/json',
  },
  // 允许跨域请求携带凭证
  withCredentials: true 
});

// 请求拦截器 - 添加token到请求头
api.interceptors.request.use(
  (config) => {
    // 只在客户端执行
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
      
      // 可选：清除认证信息（但不跳转）
      // localStorage.removeItem('token');
      // localStorage.removeItem('user');
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
    return axios.post('/api/register', data, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
  login: (data: { username: string; password: string }) => {
    return axios.post('/api/login', data, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
  getUserInfo: () => {
    // 模拟实现：从本地存储获取用户数据而不是调用API
    return new Promise((resolve, reject) => {
      try {
        if (typeof window !== 'undefined') {
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            const userData = JSON.parse(savedUser);
            resolve({ data: { user: userData } });
          } else {
            reject(new Error('未找到用户信息'));
          }
        } else {
          // 服务器端渲染时
          reject(new Error('不能在服务器端获取用户信息'));
        }
      } catch (e) {
        reject(e);
      }
    });
  },
  updateProfile: (data: { email?: string; avatar?: string; currentPassword?: string; newPassword?: string }) => {
    return axios.put('/api/user', data, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
};

// 文件相关API
export const fileApi = {
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('token');
    return axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      withCredentials: false
    });
  },
  getUserFiles: () => {
    // 使用Next.js API路由作为代理，解决跨域问题
    // 创建一个不带凭证的请求客户端
    return axios.get('/api/files', {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      // 关键修改：不包含凭证
      withCredentials: false
    });
  },
  deleteFile: (fileId: number) => {
    // 使用Next.js API路由作为代理，解决跨域问题
    return axios.delete('/api/files', {
      data: { fileId },
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      // 关键修改：不包含凭证
      withCredentials: false
    });
  },
  // 模拟上传成功，用于本地开发测试
  mockUpload: (file: File) => {
    return new Promise<{ data: { success: boolean; url: string; fileId: number } }>((resolve) => {
      setTimeout(() => {
        // 创建一个模拟响应
        resolve({
          data: {
            success: true,
            url: `https://picsum.photos/seed/${Math.floor(Math.random() * 1000)}/800/600`,
            fileId: Math.floor(Math.random() * 1000)
          }
        });
      }, 1500); // 模拟网络延迟
    });
  }
};

// 管理员相关API
export const adminApi = {
  getAllUsers: () => {
    return axios.get('/api/admin/users', {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
  activateUser: (userId: number, isActive: boolean) => {
    return axios.post('/api/admin/users', {
      action: 'activate',
      userId,
      isActive
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
  getAllFiles: () => {
    return axios.get('/api/admin/files', {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
  updateUserPassword: (userId: number, newPassword: string) => {
    return axios.post('/api/admin/users', {
      action: 'update-password',
      userId,
      newPassword
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
  deleteUser: (userId: number) => {
    return axios.post('/api/admin/users', {
      action: 'delete',
      userId
    }, {
      headers: {
        'Authorization': localStorage.getItem('token') ? `Bearer ${localStorage.getItem('token')}` : '',
        'Content-Type': 'application/json'
      },
      withCredentials: false
    });
  },
};

export default api; 