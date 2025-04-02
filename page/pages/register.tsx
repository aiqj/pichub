import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import { authApi } from '../utils/api';

// 标记此页面不使用布局
Register.noLayout = true;

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      console.error('注册错误:', err);
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-gray-800/30 backdrop-blur-sm p-8 rounded-xl border border-gray-700 shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            创建您的PicHub账号
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            开始您的图片管理之旅
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-400 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-900/30 border border-green-800 text-green-400 px-4 py-3 rounded-md text-sm">
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
            
            <Input
              id="password"
              name="password"
              type="password"
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
            
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
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
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
                已有账号？立即登录
              </Link>
            </div>
          </div>
        </form>
        
        <div className="mt-4 text-center text-xs text-gray-500">
          <p>注册即表示您同意我们的服务条款和隐私政策</p>
          <p className="mt-2">注册后需要管理员激活账号才能登录</p>
        </div>
      </div>
    </div>
  );
}

export default Register; 