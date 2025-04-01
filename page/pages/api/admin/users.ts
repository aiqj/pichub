import { NextApiRequest, NextApiResponse } from 'next';

// 获取API主机地址
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 允许GET请求获取用户列表，POST请求用于其他操作
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从请求头中获取认证令牌
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized', message: '未授权，请先登录' });
    }

    // 构建请求头
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': authHeader
    };

    // 创建fetch配置
    const fetchOptions = {
      headers,
      credentials: 'omit' as RequestCredentials
    };

    let response;
    const endpoint = `${API_HOST}/api/admin/users`;
    
    if (req.method === 'GET') {
      // 获取用户列表
      response = await fetch(endpoint, {
        method: 'GET',
        ...fetchOptions
      });
    } else {
      // 处理其他操作（激活/停用用户，更新密码，删除用户）
      const { action, ...data } = req.body;
      
      // 根据action确定具体的API端点
      const actionEndpoint = action === 'activate' 
        ? `${endpoint}/activate`
        : action === 'update-password'
        ? `${endpoint}/update-password`
        : action === 'delete'
        ? `${endpoint}/delete`
        : endpoint;

      response = await fetch(actionEndpoint, {
        method: 'POST',
        ...fetchOptions,
        body: JSON.stringify(data)
      });
    }

    // 获取API响应
    const data = await response.json();

    // 返回相同的状态码和响应数据
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin users API error:', error);
    return res.status(500).json({ error: 'Server error', message: '服务器错误，请稍后重试' });
  }
} 