import React, { useState, useEffect } from 'react';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { User } from '../../types';
import { adminApi } from '../../utils/api';

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'password' | 'delete'>('password');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // 加载用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await adminApi.getAllUsers();
        if (response.data && response.data.users) {
          setUsers(response.data.users);
        }
      } catch (err: any) {
        console.error('获取用户失败:', err);
        setError('获取用户列表失败，请刷新页面重试');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
  // 处理用户激活/停用
  const handleToggleUserActive = async (user: User) => {
    try {
      setActionLoading(true);
      const response = await adminApi.activateUser(user.id, !user.is_active);
      
      if (response.data.success) {
        // 更新本地状态
        setUsers((prevUsers) =>
          prevUsers.map((u) =>
            u.id === user.id ? { ...u, is_active: !user.is_active } : u
          )
        );
      } else {
        setError(response.data.message || '操作失败，请重试');
      }
    } catch (err: any) {
      console.error('激活/停用用户失败:', err);
      setError('操作失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 打开修改密码模态框
  const openPasswordModal = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setConfirmNewPassword('');
    setPasswordError('');
    setModalType('password');
    setIsModalOpen(true);
  };
  
  // 打开删除用户模态框
  const openDeleteModal = (user: User) => {
    setSelectedUser(user);
    setModalType('delete');
    setIsModalOpen(true);
  };
  
  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
  };
  
  // 处理密码修改
  const handlePasswordChange = async () => {
    if (!selectedUser) return;
    
    // 验证
    if (!newPassword || !confirmNewPassword) {
      setPasswordError('请填写所有字段');
      return;
    }
    
    if (newPassword !== confirmNewPassword) {
      setPasswordError('两次密码输入不一致');
      return;
    }
    
    if (newPassword.length < 6) {
      setPasswordError('密码长度至少为6个字符');
      return;
    }
    
    try {
      setActionLoading(true);
      const response = await adminApi.updateUserPassword(selectedUser.id, newPassword);
      
      if (response.data.success) {
        closeModal();
        // 可以显示一个成功通知
      } else {
        setPasswordError(response.data.message || '修改密码失败，请重试');
      }
    } catch (err: any) {
      console.error('修改密码失败:', err);
      setPasswordError('修改密码失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 处理删除用户
  const handleDeleteUser = async () => {
    if (!selectedUser) return;
    
    try {
      setActionLoading(true);
      const response = await adminApi.deleteUser(selectedUser.id);
      
      if (response.data.success) {
        // 从列表中移除用户
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== selectedUser.id));
        closeModal();
        // 可以显示一个成功通知
      } else {
        setError(response.data.message || '删除用户失败，请重试');
      }
    } catch (err: any) {
      console.error('删除用户失败:', err);
      setError('删除用户失败，请重试');
    } finally {
      setActionLoading(false);
    }
  };
  
  // 过滤用户
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      user.username.toLowerCase().includes(query) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
  });
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          用户管理
        </h1>
        
        <div className="w-full md:w-auto">
          <Input
            type="text"
            placeholder="搜索用户..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
            autoComplete="off"
          />
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white/80 dark:bg-gray-800/30 border border-gray-200 dark:border-gray-700 rounded-lg p-6 text-center theme-transition">
          <p className="text-gray-600 dark:text-gray-400 theme-transition">
            {searchQuery ? '没有找到匹配的用户' : '暂无用户'}
          </p>
        </div>
      ) : (
        <div className="bg-white/80 dark:bg-gray-800/30 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden theme-transition">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 theme-transition">
              <thead className="bg-gray-100 dark:bg-gray-900/50 theme-transition">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    用户名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    邮箱
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    注册时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    角色
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider theme-transition">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700 theme-transition">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 theme-transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 overflow-hidden theme-transition">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.username} className="h-10 w-10 object-cover" />
                          ) : (
                            <span className="font-medium">{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-800 dark:text-white theme-transition">{user.username}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 theme-transition">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300 theme-transition">{user.email || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-700 dark:text-gray-300 theme-transition">
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 theme-transition">
                        {new Date(user.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      } theme-transition`}>
                        {user.is_active ? '已激活' : '已停用'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      } theme-transition`}>
                        {user.role === 'admin' ? '管理员' : '普通用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserActive(user)}
                            disabled={actionLoading}
                            className={`px-2 py-1 rounded text-xs ${
                              user.is_active 
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:hover:bg-amber-900/50' 
                                : 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50'
                            } transition theme-transition`}
                          >
                            {user.is_active ? '停用' : '激活'}
                          </button>
                        )}
                        <button
                          onClick={() => openPasswordModal(user)}
                          disabled={actionLoading}
                          className="bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 px-2 py-1 rounded text-xs transition theme-transition"
                        >
                          重置密码
                        </button>
                        {user.username !== 'admin' && (
                          <button
                            onClick={() => openDeleteModal(user)}
                            disabled={actionLoading}
                            className="bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 px-2 py-1 rounded text-xs transition theme-transition"
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 模态框 */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden theme-transition">
            {modalType === 'password' ? (
              <>
                <div className="bg-indigo-500 px-6 py-4">
                  <h3 className="text-white text-lg font-medium">重置密码</h3>
                  <p className="text-indigo-200 text-sm">用户: {selectedUser.username}</p>
                </div>
                <div className="p-6">
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                      新密码
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 theme-transition"
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
                  </div>
                  <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2 theme-transition">
                      确认新密码
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 theme-transition"
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
                  </div>
                  {passwordError && (
                    <div className="mb-4 text-sm text-red-600 dark:text-red-400 theme-transition">
                      {passwordError}
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={handlePasswordChange}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? '处理中...' : '确认'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-red-500 px-6 py-4">
                  <h3 className="text-white text-lg font-medium">删除用户</h3>
                  <p className="text-red-200 text-sm">此操作不可撤销</p>
                </div>
                <div className="p-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4 theme-transition">
                    您确定要删除用户 <span className="font-bold">{selectedUser.username}</span> 吗？该操作将永久删除该用户的所有数据，无法恢复。
                  </p>
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 theme-transition"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleDeleteUser}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {actionLoading ? '处理中...' : '确认删除'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsersPage; 