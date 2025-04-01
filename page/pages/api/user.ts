import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';

// 模拟用户数据
const users = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    email: 'admin@example.com',
    role: 'admin',
    active: true
  },
  {
    id: 2,
    username: 'user',
    password: 'user123',
    email: 'user@example.com',
    role: 'user',
    active: true
  }
];

// JWT密钥（在生产环境中应该使用环境变量）
const JWT_SECRET = 'your-jwt-secret-key';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 从请求头获取令牌
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: '未提供认证令牌' });
  }
  
  const token = authHeader.substring(7); // 删除 'Bearer ' 前缀
  
  try {
    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number;
      username: string;
      role: string;
    };
    
    // 找到用户
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }
    
    // 返回用户信息（不包含密码）
    return res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('令牌验证错误:', error);
    return res.status(401).json({ success: false, error: '无效的令牌' });
  }
} 