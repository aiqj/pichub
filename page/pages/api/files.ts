import { NextApiRequest, NextApiResponse } from 'next';

// 获取API主机地址
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // 允许GET请求获取文件列表，允许DELETE请求删除文件
  if (req.method !== 'GET' && req.method !== 'DELETE') {
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

    // 创建fetch配置，明确指定不使用带凭证的请求模式
    const fetchOptions = {
      headers,
      // 关键修改：不包含凭证
      credentials: 'omit' as RequestCredentials
    };

    let response;
    
    if (req.method === 'GET') {
      // 获取文件列表
      response = await fetch(`${API_HOST}/api/files`, {
        method: 'GET',
        ...fetchOptions
      });
    } else if (req.method === 'DELETE') {
      // 删除文件
      const { fileId } = req.body;
      if (!fileId) {
        return res.status(400).json({ error: 'Missing fileId', message: '缺少文件ID参数' });
      }

      response = await fetch(`${API_HOST}/api/files`, {
        method: 'DELETE',
        ...fetchOptions,
        body: JSON.stringify({ fileId })
      });
    }

    // 检查响应状态
    if (!response.ok) {
      const errorData = await response.json();
      return res.status(response.status).json(errorData);
    }

    // 获取API响应
    const data = await response.json();

    // 返回响应数据
    return res.status(200).json(data);
  } catch (error) {
    console.error('Files API error:', error);
    return res.status(500).json({ error: 'Server error', message: '服务器错误，请稍后重试' });
  }
} 