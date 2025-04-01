import { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { IncomingForm } from 'formidable';
import { Readable } from 'stream';

// 获取API主机地址
const API_HOST = process.env.NEXT_PUBLIC_API_HOST || '';

// 禁用默认的bodyParser，以便我们可以手动处理表单数据
export const config = {
  api: {
    bodyParser: false,
  },
};

// 将文件转换为FormData用于向后端发送
async function fileToFormData(file: formidable.File): Promise<FormData> {
  const formData = new FormData();
  
  // 读取文件内容
  const fileContent = await fs.promises.readFile(file.filepath);
  
  // 创建File对象
  const fileObject = new File(
    [fileContent], 
    file.originalFilename || 'upload.file',
    { type: file.mimetype || 'application/octet-stream' }
  );
  
  formData.append('file', fileObject);
  return formData;
}

// 从ReadableStream创建FormData
async function streamToFormData(readStream: NodeJS.ReadableStream, filename: string, mimetype: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    
    readStream.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    readStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    readStream.on('error', (err) => {
      reject(err);
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 从请求头中获取认证令牌
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Unauthorized', message: '未授权，请先登录' });
    }
    
    // 解析表单数据（包括文件）
    const form = new IncomingForm();
    
    const { fields, files } = await new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        resolve({ fields, files });
      });
    });
    
    // 获取文件
    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded', message: '未上传文件' });
    }
    
    // 创建新的表单数据用于发送到后端
    const formData = new FormData();
    
    // 读取文件内容
    const fileBuffer = await fs.promises.readFile(file.filepath);
    
    // 创建blob对象并添加到FormData
    const blob = new Blob([fileBuffer], { type: file.mimetype || 'application/octet-stream' });
    formData.append('file', blob, file.originalFilename || 'upload.file');
    
    // 发送到后端API
    const fetchResponse = await fetch(`${API_HOST}/api/upload`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        // 注意：不要设置Content-Type，让fetch自动设置带有boundary的multipart/form-data
      },
      body: formData,
      credentials: 'omit'
    });
    
    // 读取响应
    const data = await fetchResponse.json();
    
    // 删除临时文件
    try {
      await fs.promises.unlink(file.filepath);
    } catch (e) {
      console.error('Failed to delete temp file:', e);
    }
    
    // 返回响应
    return res.status(fetchResponse.status).json(data);
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Server error', message: '服务器错误，请稍后重试' });
  }
} 