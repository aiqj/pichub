import React, { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';

// 通知类型定义
type NotificationType = 'info' | 'success' | 'warning' | 'error';

// 标记此页面不使用布局
Login.noLayout = true;

// 定义样式
const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom right, #18181b, #27272a, #18181b)',
    padding: '3rem 1rem',
  },
  notificationsContainer: {
    position: 'fixed' as CSSProperties['position'],
    top: '1rem',
    right: '1rem',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    gap: '0.5rem'
  },
  notification: {
    padding: '0.75rem 1rem',
    borderRadius: '0.375rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    maxWidth: '28rem',
    backdropFilter: 'blur(4px)',
    border: '1px solid'
  },
  notificationError: {
    backgroundColor: 'rgba(127, 29, 29, 0.3)',
    borderColor: '#991b1b',
    color: '#f87171'
  },
  notificationSuccess: {
    backgroundColor: 'rgba(20, 83, 45, 0.3)',
    borderColor: '#166534',
    color: '#4ade80'
  },
  notificationWarning: {
    backgroundColor: 'rgba(120, 53, 15, 0.3)',
    borderColor: '#92400e',
    color: '#fbbf24'
  },
  notificationInfo: {
    backgroundColor: 'rgba(30, 58, 138, 0.3)',
    borderColor: '#1e40af',
    color: '#60a5fa'
  },
  formContainer: {
    maxWidth: '28rem',
    width: '100%',
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    gap: '2rem',
    backgroundColor: 'rgba(39, 39, 42, 0.3)',
    backdropFilter: 'blur(4px)',
    padding: '2rem',
    borderRadius: '0.75rem',
    border: '1px solid #3f3f46',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
  },
  header: {
    marginTop: '1.5rem',
    textAlign: 'center' as CSSProperties['textAlign']
  },
  title: {
    fontSize: '1.875rem',
    fontWeight: '800',
    background: 'linear-gradient(to right, #c084fc, #a855f7)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  subtitle: {
    marginTop: '0.5rem',
    fontSize: '0.875rem',
    color: '#a1a1aa'
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    gap: '1.5rem'
  },
  formFields: {
    display: 'flex',
    flexDirection: 'column' as CSSProperties['flexDirection'],
    gap: '1rem'
  },
  registerLink: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  registerLinkText: {
    fontSize: '0.875rem'
  },
  link: {
    color: '#c084fc',
    transition: 'color 0.2s'
  },
  linkHover: {
    color: '#d8b4fe'
  },
  divider: {
    position: 'relative' as CSSProperties['position'],
    marginTop: '1.5rem'
  },
  dividerLine: {
    position: 'absolute' as CSSProperties['position'],
    inset: 0,
    display: 'flex',
    alignItems: 'center'
  },
  dividerHr: {
    width: '100%',
    borderTop: '1px solid #3f3f46'
  },
  dividerText: {
    position: 'relative' as CSSProperties['position'],
    display: 'flex',
    justifyContent: 'center',
    fontSize: '0.875rem'
  },
  dividerTextInner: {
    padding: '0 0.5rem',
    backgroundColor: 'rgba(39, 39, 42, 0.3)',
    color: '#a1a1aa'
  },
  footerText: {
    marginTop: '1.5rem',
    textAlign: 'center' as CSSProperties['textAlign'],
    fontSize: '0.75rem',
    color: '#71717a'
  },
  debugInfo: {
    marginTop: '1rem'
  },
  debugToggle: {
    cursor: 'pointer',
    color: '#71717a',
    fontSize: '0.75rem'
  },
  debugContent: {
    marginTop: '0.5rem',
    fontSize: '0.75rem',
    whiteSpace: 'pre-wrap',
    overflowX: 'auto' as CSSProperties['overflowX'],
    backgroundColor: 'rgba(24, 24, 27, 0.5)',
    padding: '0.75rem',
    borderRadius: '0.25rem',
    color: '#a1a1aa'
  }
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notifications, setNotifications] = useState<Array<{id: string, message: string, type: NotificationType}>>([]);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebug, setShowDebug] = useState(false);
  const [isHovering, setIsHovering] = useState<{[key: string]: boolean}>({});
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();
  
  // API配置
  const apiEndpoint = process.env.NEXT_PUBLIC_API_HOST || '';
  
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
  
  // 加载时检查认证状态并设置调试信息
  useEffect(() => {
    // 如果已登录，重定向到首页
    if (isAuthenticated && typeof window !== 'undefined') {
      router.push('/');
    }
    
    // 设置调试信息
    const info = `
      API端点: ${apiEndpoint}
      是否已认证: ${isAuthenticated}
      本地Token: ${typeof window !== 'undefined' ? localStorage.getItem('token') ? '存在' : '不存在' : 'SSR模式'}
      本地User数据: ${typeof window !== 'undefined' ? localStorage.getItem('user') ? '存在' : '不存在' : 'SSR模式'}
      环境: ${process.env.NODE_ENV}
    `;
    setDebugInfo(info);
    
    console.log('============ 登录页调试信息 ============');
    console.log('API端点:', apiEndpoint);
    console.log('是否已认证:', isAuthenticated);
    if (typeof window !== 'undefined') {
      console.log('本地Token:', localStorage.getItem('token'));
      try {
        const savedUser = localStorage.getItem('user');
        console.log('本地User数据:', savedUser ? JSON.parse(savedUser) : null);
      } catch (e) {
        console.error('解析用户数据失败:', e);
      }
    }
    console.log('环境:', process.env.NODE_ENV);
    console.log('========================================');
  }, [apiEndpoint, isAuthenticated, router]);

  const showNotification = (message: string, type: NotificationType = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 5秒后自动移除通知
    const timeoutId = setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 5000);
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
      console.log('开始登录请求...', { username });
      
      const response = await fetch(`${apiEndpoint}/api/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      console.log('登录响应:', data);
      
      if (!response.ok) {
        if (data.error === 'Account not activated') {
          showNotification(data.message || '账号未激活，请联系管理员', 'error');
        } else if (data.error === 'Invalid credentials') {
          showNotification('用户名或密码错误', 'error');
        } else {
          showNotification(data.error || '登录失败', 'error');
        }
        return;
      }
      
      if (!data.token || !data.user) {
        showNotification('服务器响应格式错误，请联系管理员', 'error');
        console.error('登录响应缺少token或user字段:', data);
        return;
      }
      
      // 保存登录信息并更新认证状态
      console.log('登录成功，保存认证信息');
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      login(data.token, data.user);
      
      showNotification('验证成功，正在进入系统...', 'success');
      
      // 登录成功，跳转到主页
      setTimeout(() => {
        router.push('/');
      }, 1000);
    } catch (error: any) {
      console.error('Login error:', error);
      showNotification(`登录请求失败: ${error.message}`, 'error');
    }
  };

  // 处理链接悬停
  const handleMouseEnter = (item: string) => {
    setIsHovering(prev => ({ ...prev, [item]: true }));
  };

  const handleMouseLeave = (item: string) => {
    setIsHovering(prev => ({ ...prev, [item]: false }));
  };

  return (
    <div style={styles.container}>
      {/* 通知组件 */}
      <div style={styles.notificationsContainer}>
        {notifications.map(notification => {
          let notificationStyle;
          switch(notification.type) {
            case 'error':
              notificationStyle = styles.notificationError;
              break;
            case 'success':
              notificationStyle = styles.notificationSuccess;
              break;
            case 'warning':
              notificationStyle = styles.notificationWarning;
              break;
            default:
              notificationStyle = styles.notificationInfo;
          }
          
          return (
            <div 
              key={notification.id}
              style={{...styles.notification, ...notificationStyle}}
            >
              {notification.message}
            </div>
          );
        })}
      </div>

      <div style={styles.formContainer}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            PicHub
          </h2>
          <p style={styles.subtitle}>
            高效、安全的图片管理平台
          </p>
        </div>
        
        <form style={styles.form} onSubmit={handleLogin}>
          <div style={styles.formFields}>
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
            
            <Input
              id="password"
              name="password"
              type="password"
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
          
          <div style={styles.registerLink}>
            <div style={styles.registerLinkText}>
              <Link 
                href="/register" 
                style={{ 
                  ...styles.link, 
                  ...(isHovering['register'] ? styles.linkHover : {}) 
                }}
                onMouseEnter={() => handleMouseEnter('register')}
                onMouseLeave={() => handleMouseLeave('register')}
              >
                没有账号？立即注册
              </Link>
            </div>
          </div>
        </form>
        
        {/* 调试信息，仅在开发环境显示 */}
        {process.env.NODE_ENV === 'development' && (
          <div style={styles.debugInfo}>
            <details>
              <summary 
                style={styles.debugToggle}
                onClick={() => setShowDebug(!showDebug)}
              >
                调试信息
              </summary>
              {showDebug && (
                <pre style={styles.debugContent}>
                  {debugInfo}
                </pre>
              )}
            </details>
          </div>
        )}
        
        <div style={styles.divider}>
          <div style={styles.dividerLine}>
            <div style={styles.dividerHr}></div>
          </div>
          <div style={styles.dividerText}>
            <span style={styles.dividerTextInner}>科幻风格体验</span>
          </div>
        </div>
          
        <div style={styles.footerText}>
          <p>登录即表示您同意我们的服务条款和隐私政策</p>
        </div>
      </div>
    </div>
  );
} 