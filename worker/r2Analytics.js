// worker/r2Analytics.js

// 默认从环境变量获取
let CF_TOKEN = process.env.CF_TOKEN;
let CF_EMAIL = process.env.CF_EMAIL;
let CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
let BUCKET_NAME = process.env.R2_BUCKET;

const GRAPHQL_URL = 'https://api.cloudflare.com/client/v4/graphql';

// 设置配置的函数
function setConfig(config) {
  if (config) {
    CF_TOKEN = config.cfToken || CF_TOKEN;
    CF_EMAIL = config.cfEmail || CF_EMAIL;
    CF_ACCOUNT_ID = config.cfAccountId || CF_ACCOUNT_ID;
    BUCKET_NAME = config.bucketName || BUCKET_NAME;
  }
}

async function fetchR2Analytics(startDate, endDate, config) {
  // 如果提供了配置，则使用它
  if (config) {
    setConfig(config);
  }
  
  const query = `
  query {
    viewer {
      accounts(filter: { accountTag: "${CF_ACCOUNT_ID}" }) {
        storageStandard: r2StorageAdaptiveGroups(
          limit: 10000
          filter: {
            storageClass: "Standard"
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          max {
            payloadSize
            metadataSize
            objectCount
          }
          dimensions {
            datetime
            bucketName
          }
        }
        
        classAOpsStandard: r2OperationsAdaptiveGroups(
          limit: 10000
          filter: {
            storageClass: "Standard"
            actionType_in: [
              ListBuckets, PutBucket, ListObjects, PutObject, CopyObject,
              CompleteMultipartUpload, CreateMultipartUpload, UploadPart, UploadPartCopy,
              PutBucketEncryption, ListMultipartUploads, PutBucketCors,
              PutBucketLifecycleConfiguration, ListParts, PutBucketStorageClass,
              LifecycleStorageTierTransition
            ]
            actionStatus_in: [success, userError]
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          sum {
            requests
          }
          dimensions {
            datetime
          }
        }
        
        classBOpsStandard: r2OperationsAdaptiveGroups(
          limit: 10000
          filter: {
            storageClass: "Standard"
            actionType_in: [
              HeadBucket, HeadObject, GetObject, ReportUsageSummary,
              GetBucketEncryption, GetBucketLocation,
              GetBucketLifecycleConfiguration, GetBucketCors
            ]
            actionStatus_in: [success, userError]
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          sum {
            requests
          }
          dimensions {
            datetime
          }
        }

        storageIA: r2StorageAdaptiveGroups(
          limit: 10000
          filter: {
            storageClass: "InfrequentAccess"
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          max {
            payloadSize
            metadataSize
            objectCount
          }
          dimensions {
            datetime
            bucketName
          }
        }

        classAOpsIA: r2OperationsAdaptiveGroups(
          limit: 10000
          filter: {
            storageClass: "InfrequentAccess"
            actionType_in: [
              ListBuckets, PutBucket, ListObjects, PutObject, CopyObject,
              CompleteMultipartUpload, CreateMultipartUpload, UploadPart, UploadPartCopy,
              PutBucketEncryption, ListMultipartUploads, PutBucketCors,
              PutBucketLifecycleConfiguration, ListParts, PutBucketStorageClass,
              LifecycleStorageTierTransition
            ]
            actionStatus_in: [success, userError]
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          sum {
            requests
          }
          dimensions {
            datetime
          }
        }

        classBOpsIA: r2OperationsAdaptiveGroups(
          limit: 10000
          filter: {
            storageClass: "InfrequentAccess"
            actionType_in: [
              HeadBucket, HeadObject, GetObject, ReportUsageSummary,
              GetBucketEncryption, GetBucketLocation,
              GetBucketLifecycleConfiguration, GetBucketCors
            ]
            actionStatus_in: [success, userError]
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          sum {
            requests
          }
          dimensions {
            datetime
          }
        }

        dataRetrieval: r2OperationsAdaptiveGroups(
          limit: 10000
          filter: {
            actionType: "N/A"
            date_geq: "${startDate}"
            date_leq: "${endDate}"
          }
        ) {
          sum {
            requests
          }
          dimensions {
            datetime
          }
        }
      }
    }
  }`;

  try {
    const response = await fetch(GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-Key': CF_TOKEN,
        'X-Auth-Email': CF_EMAIL,
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      console.error(`Response body: ${errorText}`);
      throw new Error(`Error fetching data: ${response.statusText}`, { cause: errorText });
    }

    const data = await response.json();
    
    // 检查是否有错误
    if (data.errors) {
      console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2));
      throw new Error(`GraphQL error: ${data.errors[0].message}`, { cause: data.errors });
    }
    
    return data;
  } catch (error) {
    console.error("Failed to fetch R2 analytics:", error);
    throw error;
  }
}

// 处理 API 请求的函数
async function handleAnalyticsRequest(request, env) {
  try {
    const url = new URL(request.url);
    const startDate = url.searchParams.get('startDate') || getDefaultStartDate();
    const endDate = url.searchParams.get('endDate') || getDefaultEndDate();
    
    // 如果在 Worker 环境中运行，从 env 获取配置
    const config = env ? {
      cfToken: env.CF_TOKEN,
      cfEmail: env.CF_EMAIL,
      cfAccountId: env.CF_ACCOUNT_ID,
      bucketName: env.R2_BUCKET && env.R2_BUCKET.name
    } : null;
    
    const data = await fetchR2Analytics(startDate, endDate, config);
    
    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ 
      error: error.message,
      cause: error.cause
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

// 获取默认的开始日期（当月第一天）
function getDefaultStartDate() {
  const date = new Date();
  date.setDate(1); // 设置为当月第一天
  return date.toISOString().split('T')[0];
}

// 获取默认的结束日期（今天）
function getDefaultEndDate() {
  return new Date().toISOString().split('T')[0];
}

module.exports = {
  fetchR2Analytics,
  handleAnalyticsRequest,
  setConfig
};