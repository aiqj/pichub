'use client';
import { useState, useEffect } from 'react';
import AdminNotification from '../../components/AdminNotification';

interface User {
  id: number;
  username: string;
  email: string | null;
  avatar: string | null;
  is_active: number;
  role: string;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState({
    show: false,
    type: 'success' as 'success' | 'error' | 'warning' | 'info',
    message: ''
  });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      setError('获取用户列表失败，请刷新页面重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleActivateUser = async (userId: number, isActive: boolean) => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/admin/users/activate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId, isActive })
      });

      if (!response.ok) {
        throw new Error('操作失败');
      }

      const result = await response.json();
      setNotification({
        show: true,
        type: 'success',
        message: result.message || `用户状态已${isActive ? '激活' : '停用'}`
      });

      // 更新用户列表
      setUsers(users.map(user => 
        user.id === userId ? { ...user, is_active: isActive ? 1 : 0 } : user
      ));
    } catch (error) {
      console.error('更新用户状态失败:', error);
      setNotification({
        show: true,
        type: 'error',
        message: '操作失败，请重试'
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!editUser) return;
    if (!newPassword) {
      setNotification({
        show: true,
        type: 'error',
        message: '请输入新密码'
      });
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/admin/users/update-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: editUser.id, newPassword })
      });

      if (!response.ok) {
        throw new Error('修改密码失败');
      }

      setNotification({
        show: true,
        type: 'success',
        message: '密码已成功修改'
      });
      setEditUser(null);
      setNewPassword('');
    } catch (error) {
      console.error('修改密码失败:', error);
      setNotification({
        show: true,
        type: 'error',
        message: '修改密码失败，请重试'
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const token = localStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch('/api/admin/users/delete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId: userToDelete.id })
      });

      if (!response.ok) {
        throw new Error('删除用户失败');
      }

      setNotification({
        show: true,
        type: 'success',
        message: '用户已成功删除'
      });
      
      // 更新用户列表
      setUsers(users.filter(user => user.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('删除用户失败:', error);
      setNotification({
        show: true,
        type: 'error',
        message: '删除用户失败，请重试'
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <span className="ml-2">加载中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">用户管理</h1>
      
      {/* 用户列表 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  用户
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  邮箱
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  角色
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  注册时间
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar ? (
                          <img className="h-10 w-10 rounded-full" src={user.avatar} alt={user.username} />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <i className="fas fa-user text-gray-400"></i>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.username}</div>
                        <div className="text-sm text-gray-500">ID: {user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{user.email || '未设置'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role === 'admin' ? '管理员' : '普通用户'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? '已激活' : '未激活'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleActivateUser(user.id, !user.is_active)}
                        className={`${
                          user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.is_active ? '停用' : '激活'}
                      </button>
                      <button
                        onClick={() => setEditUser(user)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        修改密码
                      </button>
                      <button
                        onClick={() => {
                          setUserToDelete(user);
                          setShowDeleteModal(true);
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 修改密码对话框 */}
      {editUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">修改用户密码</h3>
            <p className="mb-4 text-gray-600">
              您正在为用户 <span className="font-medium text-gray-900">{editUser.username}</span> 修改密码
            </p>
            <div className="mb-4">
              <label htmlFor="new_password" className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
              <input
                type="password"
                id="new_password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="输入新密码"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setEditUser(null);
                  setNewPassword('');
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={handleUpdatePassword}
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除用户确认对话框 */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">确认删除</h3>
            <p className="mb-4 text-gray-600">
              您确定要删除用户 <span className="font-medium text-gray-900">{userToDelete.username}</span> 吗？此操作不可逆。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
              >
                取消
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                onClick={handleDeleteUser}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 通知组件 */}
      <AdminNotification
        show={notification.show}
        type={notification.type}
        message={notification.message}
        onClose={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
} 