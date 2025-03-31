import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 密码加密不再需要，因为您的表结构中是明文密码
// 但为了安全起见，我仍然建议加密存储密码
export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// 验证密码
export async function verifyPassword(password, hashedPassword) {
  // 如果存储的是明文密码，直接比较
  if (process.env.STORE_PLAIN_PASSWORD === 'true') {
    return password === hashedPassword;
  }
  // 否则使用bcrypt比较
  return bcrypt.compare(password, hashedPassword);
}

// 生成JWT令牌
export function generateToken(user, env) {
  // 从用户对象中排除敏感信息
  const { password, ...userInfo } = user;
  
  return jwt.sign(
    userInfo,
    env.JWT_SECRET,
    { expiresIn: '7d' } // 令牌有效期7天
  );
}

// 验证JWT令牌
export function verifyToken(token, env) {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// 中间件：验证用户身份
export async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token, env);
  
  if (!decoded) {
    return null;
  }
  
  return decoded;
}

// 中间件：验证管理员身份
export async function requireAdmin(request, env) {
  const user = await authenticate(request, env);
  
  if (!user || user.role !== 'admin') {
    return jsonResponse({ error: 'Unauthorized' }, 403, request, env);
  }
  
  return user;
}
