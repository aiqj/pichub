import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../utils/api';

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 表单验证
    if (!username || !password || !confirmPassword) {
      setError('请填写所有必填字段');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6个字符');
      return;
    }

    if (email && !/\S+@\S+\.\S+/.test(email)) {
      setError('请输入有效的电子邮件地址');
      return;
    }

    try {
      setLoading(true);
      const response = await authApi.register({ username, password, email });
      
      if (response.data.success) {
        setSuccess(response.data.message || '注册成功，请联系管理员激活您的账号');
        // 5秒后跳转到登录页
        setTimeout(() => {
          router.push('/login');
        }, 5000);
      } else {
        setError(response.data.error || '注册失败，请稍后重试');
      }
    } catch (err: any) {
      // 清空加载状态
      setLoading(false);
      
      // 处理具体的错误响应
      if (err.response && err.response.data) {
        if (err.response.status === 409) {
          setError(err.response.data.error || '用户名或邮箱已存在');
        } else {
          setError(err.response.data.error || '注册失败，请稍后重试');
        }
      } else {
        setError('网络错误，请检查您的连接');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8 theme-transition">
      <div className="max-w-md w-full space-y-8 bg-white/80 dark:bg-gray-800/30 backdrop-blur-sm p-8 rounded-xl border border-gray-200 dark:border-gray-700 shadow-2xl theme-transition">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            创建您的PicHub账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400 theme-transition">
            开始您的图片管理之旅
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md text-sm theme-transition">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100/80 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md text-sm theme-transition">
              {success}
            </div>
          )}
          
          <div className="rounded-md space-y-4">
            <Input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              required
              placeholder="用户名"
              label="用户名"
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
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="电子邮件"
              label="电子邮件"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
              }
            />
            
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="密码"
                label="密码"
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
                style={{ top: '24px' }} /* 调整位置以适应带标签的输入框 */
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
            
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                placeholder="确认密码"
                label="确认密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
                onClick={toggleConfirmPasswordVisibility}
                tabIndex={-1}
                style={{ top: '24px' }} /* 调整位置以适应带标签的输入框 */
              >
                {showConfirmPassword ? (
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
              loading={loading}
            >
              注册
            </Button>
          </div>
          
          <div className="flex items-center justify-center">
            <div className="text-sm">
              <Link href="/login" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 theme-transition">
                已有账号？立即登录
              </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-500 dark:text-gray-500 theme-transition">
          <p>注册即表示您同意我们的服务条款和隐私政策</p>
          <p className="mt-2">注册后需要管理员激活账号才能登录</p>
        </div>
      </div>
    </div>
  );
}

export default Register;
Register.noLayout = true; 