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
        <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-6 text-center">
          <p className="text-gray-400">
            {searchQuery ? '没有找到匹配的用户' : '暂无用户'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-900/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    用户名
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    邮箱
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    角色
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    状态
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    注册时间
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/10 divide-y divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-700/30">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gray-700 rounded-full flex items-center justify-center">
                          {user.avatar ? (
                            <img className="h-10 w-10 rounded-full" src={user.avatar} alt="" />
                          ) : (
                            <span className="text-lg font-medium text-gray-300">{user.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-200">{user.username}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {user.email || '未设置'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'admin' 
                          ? 'bg-purple-900/50 text-purple-300' 
                          : 'bg-gray-800 text-gray-300'
                      }`}>
                        {user.role === 'admin' ? '管理员' : '用户'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.is_active 
                          ? 'bg-green-900/50 text-green-300' 
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {user.is_active ? '已激活' : '未激活'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                      {new Date(user.created_at || '').toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button
                        size="sm"
                        variant={user.is_active ? 'warning' : 'success'}
                        onClick={() => handleToggleUserActive(user)}
                        disabled={actionLoading}
                      >
                        {user.is_active ? '停用' : '激活'}
                      </Button>
                      <Button
                        size="sm"
                        variant="info"
                        onClick={() => openPasswordModal(user)}
                        disabled={actionLoading}
                      >
                        重置密码
                      </Button>
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => openDeleteModal(user)}
                        disabled={actionLoading || user.role === 'admin'}
                      >
                        删除
                      </Button>
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 border border-gray-700">
            {modalType === 'password' ? (
              <>
                <h3 className="text-xl font-semibold text-gray-200 mb-4">
                  修改 {selectedUser.username} 的密码
                </h3>
                
                {passwordError && (
                  <div className="mb-4 bg-red-900/30 border border-red-800 text-red-400 px-4 py-2 rounded-md text-sm">
                    {passwordError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <Input
                    type="password"
                    label="新密码"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    fullWidth
                    autoComplete="new-password"
                    name="new-password"
                  />
                  
                  <Input
                    type="password"
                    label="确认新密码"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    fullWidth
                    autoComplete="new-password"
                    name="confirm-new-password"
                  />
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <Button variant="secondary" onClick={closeModal}>
                    取消
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handlePasswordChange}
                    loading={actionLoading}
                  >
                    保存
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold text-gray-200 mb-4">
                  删除用户
                </h3>
                
                <p className="text-gray-300 mb-6">
                  您确定要删除用户 <span className="font-semibold text-red-400">{selectedUser.username}</span> 吗？此操作无法撤销，该用户的所有文件也将被删除。
                </p>
                
                <div className="flex justify-end space-x-3">
                  <Button variant="secondary" onClick={closeModal}>
                    取消
                  </Button>
                  <Button 
                    variant="danger" 
                    onClick={handleDeleteUser}
                    loading={actionLoading}
                  >
                    确认删除
                  </Button>
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