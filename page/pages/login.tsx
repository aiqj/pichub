import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../utils/api';

// 通知类型定义
type NotificationType = 'info' | 'success' | 'warning' | 'error';

// 标记此页面不使用布局
Login.noLayout = true;

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: NotificationType}>>([]);
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  // API配置
  const apiEndpoint = process.env.NEXT_PUBLIC_API_HOST || '';
  
  // 检查是否存在保存的登录信息
  useEffect(() => {
    const savedUsername = localStorage.getItem('rememberedUsername');
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);
  
  // 防止重复渲染
  React.useEffect(() => {
    // 清理组件卸载时可能未完成的操作
    return () => {
      // 清除所有可能的定时器
      notifications.forEach(notification => {
        const timeoutId = parseInt(notification.id);
        if (!isNaN(timeoutId)) {
          clearTimeout(timeoutId);
        }
      });
    };
  }, [notifications]);
  
  // 加载时检查认证状态
  useEffect(() => {
    // 如果已登录，重定向到首页
    if (isAuthenticated && typeof window !== 'undefined') {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 5秒后自动移除通知
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
  };

  const handleRememberMeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRememberMe(e.target.checked);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      showNotification('请输入用户名和密码', 'warning');
      return;
    }
    
    if (!apiEndpoint) {
      showNotification('系统配置错误，请联系管理员', 'error');
      return;
    }
    
    try {
      showNotification('正在验证身份...', 'info');

      const response = await authApi.login({ username, password });
      const data = response.data;
      
      if (!data.token || !data.user) {
        showNotification('服务器响应格式错误，请联系管理员', 'error');
        return;
      }
      
      // 处理"记住我"功能
      if (rememberMe) {
        localStorage.setItem('rememberedUsername', username);
      } else {
        localStorage.removeItem('rememberedUsername');
      }
      
      // 保存登录信息并更新认证状态
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.token, data.user);
      
      showNotification('验证成功，正在进入系统...', 'success');
      
      // 登录成功，跳转到主页
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error: any) {
      // 处理不同类型的错误
      if (error.response) {
        const { status, data } = error.response;
        
        switch (status) {
          case 401:
            showNotification('用户名或密码错误', 'error');
            break;
          case 403:
            showNotification(data.message || '账号未激活，请联系管理员', 'error');
            break;
          case 500:
            showNotification('服务器错误，请稍后重试', 'error');
            break;
          default:
            showNotification(data.error || '登录失败，请重试', 'error');
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        showNotification('无法连接到服务器，请检查网络连接', 'error');
      } else {
        // 请求配置出错
        showNotification('请求配置错误，请重试', 'error');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 theme-transition">
      {/* 通知组件 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`px-4 py-3 rounded-md shadow-lg max-w-md backdrop-blur-sm border theme-transition ${
              notification.type === 'error' ? 'bg-red-100/80 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400' :
              notification.type === 'success' ? 'bg-green-100/80 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' :
              notification.type === 'warning' ? 'bg-amber-100/80 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400' :
              'bg-blue-100/80 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
            }`}
          >
            {notification.message}
          </div>
        ))}
      </div>

      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-800/30 backdrop-blur-sm p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl theme-transition">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            登录您的PicHub账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 theme-transition">
            继续您的图片管理之旅
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md space-y-4">
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              }
            />
            
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                }
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer focus:outline-none theme-transition"
                onClick={togglePasswordVisibility}
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                    <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          
          <div>
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={notifications.some(n => n.message === '正在验证身份...')}
            >
              登录
            </Button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={handleRememberMeChange}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded theme-transition"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300 theme-transition">
                记住我
              </label>
            </div>
            
            <div className="text-sm">
              <Link href="/register" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 theme-transition">
                没有账号？立即注册
              </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500 theme-transition">
          <p>登录即表示您同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
  );
} 