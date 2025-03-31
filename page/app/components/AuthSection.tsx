'use client';

import { useState } from 'react';

interface AuthSectionProps {
  onAuthenticate: (token: string) => void;
}

export const AuthSection: React.FC<AuthSectionProps> = ({ onAuthenticate }) => {
  const [token, setToken] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAuthenticate(token);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onAuthenticate(token);
    }
  };

  return (
    <section className="bg-white rounded-xl shadow-lg p-8 border-2 border-[#f8bbd0] w-full max-w-[700px] mb-8 relative">
      {/* 装饰圆点 */}
      <div className="absolute -top-[10px] left-[20px] w-[30px] h-[30px] bg-[#f06292] rounded-full -z-10 opacity-30"></div>
      <div className="absolute -bottom-[15px] right-[40px] w-[40px] h-[40px] bg-[#66bb6a] rounded-full -z-10 opacity-20"></div>
      
      <h2 className="text-[#f06292] font-semibold text-center relative inline-block left-1/2 transform -translate-x-1/2 pb-[10px] mb-[25px]">
        API 授权
        <span className="absolute bottom-0 left-1/4 w-1/2 h-[3px] bg-[#f06292] rounded-lg"></span>
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap md:flex-nowrap gap-2">
            <input
              type="password"
              className="flex-1 p-3 border border-[#f8bbd0] rounded-lg text-[#5d4037] focus:outline-none focus:ring-2 focus:ring-[#f06292]"
              placeholder="请输入 API Token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              type="submit"
              className="bg-[#f06292] hover:bg-[#ec407a] text-white px-6 py-3 rounded-lg font-medium transition-all shadow-md hover:shadow-lg relative overflow-hidden"
            >
              授权
            </button>
          </div>
          
          <div className="text-[#8d6e63] text-center mt-2">
            <p><i className="fas fa-info-circle mr-1"></i> 需要API Token才能上传图片</p>
          </div>
        </div>
      </form>
    </section>
  );
}; 