import { NextApiRequest, NextApiResponse } from 'next';

// 此API端点已弃用，请使用utils/api.ts中的authApi接口
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(410).json({
    success: false,
    error: '此API端点已弃用，请使用utils/api.ts中的authApi接口'
  });
} 