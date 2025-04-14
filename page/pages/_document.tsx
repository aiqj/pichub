import Document, { Html, Head, Main, NextScript } from 'next/document';

class MyDocument extends Document {
  render() {
    return (
      <Html lang="zh">
        <Head>
          {/* DNS预解析和预连接 */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          
          {/* 字体加载优化 - 使用预加载 */}
          <link 
            href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
            rel="stylesheet"
            media="print"
          />
          <noscript>
            <link 
              href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
              rel="stylesheet"
            />
          </noscript>
          
          {/* 元数据和PWA支持 */}
          <meta name="application-name" content="PicHub" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="default" />
          <meta name="apple-mobile-web-app-title" content="PicHub" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="theme-color" content="#000000" />
        </Head>
        <body>
          {/* 主题初始化脚本 - 在DOM加载前执行，防止闪烁 */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // 首先尝试从localStorage获取主题设置
                  const storedTheme = localStorage.getItem('theme');
                  
                  // 如果已有明确的主题设置，使用它
                  if (storedTheme === 'dark' || storedTheme === 'light') {
                    if (storedTheme === 'dark') {
                      document.documentElement.classList.add('dark');
                    } else {
                      document.documentElement.classList.remove('dark');
                    }
                    return;
                  }
                  
                  // 否则检查系统主题偏好
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (prefersDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                })();
              `,
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument; 