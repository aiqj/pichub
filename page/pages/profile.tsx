import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { authApi } from '../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 错误状态
  const [errors, setErrors] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // 初始化表单数据
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
      
      // 设置头像预览
      if (user.avatar) {
        setAvatarPreview(user.avatar);
      }
    }
  }, [user]);

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.match(/image\/(jpeg|png|jpg|gif)/)) {
      toast.error('请上传有效的图片文件 (JPEG, PNG, JPG, GIF)');
      return;
    }

    // 验证文件大小 (限制为2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('图片大小不能超过2MB');
      return;
    }

    // 创建文件预览
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatarPreview(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // 清除对应字段的错误
    if (errors[name as keyof typeof errors]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {
      email: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    };
    let isValid = true;

    // 验证邮箱
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
      isValid = false;
    }

    // 如果要修改密码，则需要验证当前密码
    if (formData.newPassword && !formData.currentPassword) {
      newErrors.currentPassword = '修改密码需要输入当前密码';
      isValid = false;
    }

    // 验证新密码
    if (formData.newPassword && formData.newPassword.length < 6) {
      newErrors.newPassword = '新密码至少需要6个字符';
      isValid = false;
    }

    // 验证确认密码
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 准备要更新的数据
      const updateData: any = {};
      
      // 只有当邮箱与原邮箱不同时才更新
      if (formData.email && formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      
      // 如果有新密码，添加密码信息
      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }
      
      // 如果有新头像预览且与原头像不同，添加头像信息
      if (avatarPreview && avatarPreview !== user?.avatar) {
        updateData.avatar = avatarPreview;
      }
      
      // 如果没有任何要更新的信息，直接返回
      if (Object.keys(updateData).length === 0) {
        toast.info('没有变更需要保存');
        setIsLoading(false);
        return;
      }

      // 使用authApi.updateProfile方法更新用户资料
      const response = await authApi.updateProfile(updateData);
      
      if (response.data && response.data.success) {
        // 更新本地用户数据
        const updatedUserData = response.data.user || {};
        updateUserData(updatedUserData);
        
        // 更新表单数据以反映新的用户信息
        setFormData({
          ...formData,
          email: updatedUserData.email || formData.email,
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // 如果更新了头像，确保头像预览也更新
        if (updatedUserData.avatar) {
          setAvatarPreview(updatedUserData.avatar);
        }
        
        toast.success('个人资料更新成功');
      } else {
        toast.error(response.data?.message || '更新失败，请重试');
      }
    } catch (error: any) {
      // 根据错误类型显示适当的错误信息
      if (error.response?.data?.message) {
        if (error.response.data.message.includes('password')) {
          setErrors({
            ...errors,
            currentPassword: '当前密码不正确',
          });
          toast.error('当前密码不正确');
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error('更新个人资料失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex justify-center py-8">
        <div className="w-full max-w-5xl px-4">
          <h1 className="hidden text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500 mb-8">个人资料</h1>
          
          <div className="bg-white/80 dark:bg-gray-800/40 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden theme-transition">
            <div className="bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/40 dark:to-purple-900/40 px-6 py-4 border-b border-gray-200 dark:border-gray-700 theme-transition">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white theme-transition">账户信息</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* 左侧：头像 */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative group">
                    <div
                      className="w-40 h-40 rounded-full cursor-pointer overflow-hidden border-4 border-indigo-500/50 p-1 bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:opacity-90 transition-all shadow-lg group-hover:shadow-indigo-500/30 theme-transition"
                      onClick={handleAvatarClick}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="用户头像"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400 theme-transition">
                          <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <p className="text-sm mt-2">点击上传头像</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="hidden"
                      accept="image/jpeg,image/png,image/jpg,image/gif"
                      onChange={handleAvatarChange}
                    />
                    <div className="absolute bottom-1 right-1 bg-indigo-600 rounded-full p-3 shadow-lg group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-400 theme-transition">{user?.username || "用户"}</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm theme-transition">{user?.role === 'admin' ? '管理员' : '普通用户'}</p>
                  </div>
                </div>
                
                {/* 右侧：表单内容 */}
                <div className="md:col-span-2 space-y-6">
                  {/* 基本信息部分 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-300 border-b border-gray-200 dark:border-gray-700 pb-2 theme-transition">基本信息</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 用户名（不可修改，只显示） */}
                      <div>
                        <label htmlFor="username" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                          用户名
                        </label>
                        <input
                          type="text"
                          id="username"
                          value={user?.username || ''}
                          className="w-full px-4 py-2 rounded-md bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-not-allowed theme-transition"
                          disabled
                        />
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 theme-transition">用户名不可修改</p>
                      </div>

                      {/* 邮箱 */}
                      <div>
                        <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                          邮箱
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-700/50 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent theme-transition"
                          placeholder="your@email.com"
                        />
                        {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400 theme-transition">{errors.email}</p>}
                      </div>
                    </div>
                  </div>
                  
                  {/* 修改密码部分 */}
                  <div className="space-y-4 pt-4">
                    <h3 className="text-lg font-medium text-indigo-600 dark:text-indigo-300 border-b border-gray-200 dark:border-gray-700 pb-2 theme-transition">修改密码</h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm theme-transition">如需修改密码，请填写以下信息</p>

                    <div className="space-y-4">
                      {/* 当前密码 */}
                      <div>
                        <label htmlFor="currentPassword" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                          当前密码
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            id="currentPassword"
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-700/50 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent theme-transition"
                            placeholder="••••••••"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                          >
                            {showCurrentPassword ? (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                        </div>
                        {errors.currentPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400 theme-transition">{errors.currentPassword}</p>}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* 新密码 */}
                        <div>
                          <label htmlFor="newPassword" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                            新密码
                          </label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              id="newPassword"
                              name="newPassword"
                              value={formData.newPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-700/50 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent theme-transition"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                            >
                              {showNewPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.newPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400 theme-transition">{errors.newPassword}</p>}
                        </div>

                        {/* 确认新密码 */}
                        <div>
                          <label htmlFor="confirmPassword" className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                            确认新密码
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              id="confirmPassword"
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleInputChange}
                              className="w-full px-4 py-2 rounded-md bg-white dark:bg-gray-700/50 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent theme-transition"
                              placeholder="••••••••"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 focus:outline-none"
                            >
                              {showConfirmPassword ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                </svg>
                              ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          {errors.confirmPassword && <p className="mt-1 text-xs text-red-600 dark:text-red-400 theme-transition">{errors.confirmPassword}</p>}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 提交按钮 */}
              <div className="mt-8 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end theme-transition">
                <button
                  type="submit"
                  className={`px-8 py-3 rounded-md font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all transform hover:scale-105 ${
                    isLoading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      保存中...
                    </span>
                  ) : (
                    '保存更改'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProfilePage; 