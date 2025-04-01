import { NextApiRequest, NextApiResponse } from 'next';

// 获取API主机地址
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // 验证请求体
    if (!username || !password) {
      return res.status(400).json({ error: 'Missing required fields', message: '用户名和密码是必需的' });
    }

    // 转发请求到真实API
    const response = await fetch(`${API_HOST}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });

    // 获取API响应
    const data = await response.json();

    // 返回相同的状态码和响应数据
    return res.status(response.status).json(data);
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error', message: '服务器错误，请稍后重试' });
  }
} 