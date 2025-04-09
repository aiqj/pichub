// worker/test-r2analytics.js
// 本地测试 r2Analytics.js

const fs = require('fs');
const path = require('path');
const toml = require('toml');
const { fetchR2Analytics, setConfig } = require('./r2Analytics.js');

// 从 wrangler.toml 文件读取配置
function loadWranglerConfig() {
  try {
    const wranglerPath = path.join(__dirname, '..', 'wrangler.toml');
    const wranglerContent = fs.readFileSync(wranglerPath, 'utf8');
    return toml.parse(wranglerContent);
  } catch (error) {
    console.error('Error loading wrangler.toml:', error);
    return {};
  }
}

// 测试函数
async function runTest() {
  try {
    console.log('Loading configuration from wrangler.toml...');
    
    const config = loadWranglerConfig();
    console.log('Config loaded:', Object.keys(config.vars || {}).join(', '));
    
    // 直接设置配置
    if (config.vars) {
      setConfig({
        cfToken: config.vars.CF_TOKEN,
        cfEmail: config.vars.CF_EMAIL,
        cfAccountId: config.vars.CF_ACCOUNT_ID,
        bucketName: config.r2_buckets && config.r2_buckets.length > 0 ? 
          config.r2_buckets[0].bucket_name : 'pichub'
      });
    }
    
    // 使用固定的测试日期（过去30天）
    const startDate = "2025-03-10";
    const endDate = "2025-04-09";
    
    console.log(`Testing fetchR2Analytics from ${startDate} to ${endDate}`);
    
    // 不传递配置，因为已经通过 setConfig 设置
    const result = await fetchR2Analytics(startDate, endDate);
    console.log(JSON.stringify(result, null, 2));
    
    console.log("Test completed successfully!");
  } catch (error) {
    console.error("Test failed:", error);
    
    // 尝试获取更多错误信息
    if (error.cause) {
      console.error("Error cause:", error.cause);
    }
  }
}

// 运行测试
runTest(); 