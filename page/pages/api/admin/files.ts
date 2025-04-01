import { NextApiRequest, NextApiResponse } from 'next';

// 获取API主机地址
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 允许GET请求获取文件列表
  if (req.method !== 'GET') {
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

    // 获取文件列表
    const response = await fetch(`${API_HOST}/api/admin/files`, {
      method: 'GET',
      ...fetchOptions
    });

    // 获取API响应
    const data = await response.json();

    // 返回相同的状态码和响应数据
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Admin files API error:', error);
    return res.status(500).json({ error: 'Server error', message: '服务器错误，请稍后重试' });
  }
} 