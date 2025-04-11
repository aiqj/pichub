import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line } from 'recharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { statsApi } from '../utils/api';

// 扩展dayjs以支持时区
dayjs.extend(utc);
dayjs.extend(timezone);

// 存储数据接口
interface StorageData {
  dimensions: {
    bucketName: string;
    datetime: string;
  };
  max: {
    metadataSize: number;
    objectCount: number;
    payloadSize: number;
  };
}

// API响应数据接口
interface R2StatsResponse {
  data: {
    viewer: {
      accounts: Array<{
        storageStandard: StorageData[];
        [key: string]: any;
      }>;
    };
  };
  errors: any;
}

// 图表数据格式
interface ChartData {
  datetime: string;
  fullDatetime: string;
  objectCount: number;
  objectSize: number; // 重命名为对象大小 (metadataSize + payloadSize)
}

// 图表类型
type ChartType = 'area' | 'bar' | 'composed';

// 格式化工具函数
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 自定义Tooltip组件
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // 使用fullDatetime来显示更完整的时间信息
    const fullDatetime = payload[0]?.payload?.fullDatetime || label;
    
    return (
      <div className="bg-gray-800 p-3 border border-gray-700 rounded-md shadow-lg">
        <p className="text-gray-200 mb-1">{fullDatetime}</p>
        <p className="text-indigo-400">
          <span className="font-semibold">对象数量: </span>
          {payload[0]?.value}
        </p>
        <p className="text-purple-400">
          <span className="font-semibold">对象大小: </span>
          {formatBytes(payload[1]?.value)}
        </p>
      </div>
    );
  }

  return null;
};

// 图表组件
const StorageChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 使用statsApi调用接口获取真实数据
        const response = await statsApi.getR2Stats();
        const data = response.data as R2StatsResponse;
        
        // 检查数据格式是否正确
        if (!data || !data.data || !data.data.viewer || !data.data.viewer.accounts) {
          throw new Error('数据格式错误');
        }
        
        // 获取storageStandard数据
        const storageData: StorageData[] = [];
        data.data.viewer.accounts.forEach(account => {
          if (account.storageStandard && Array.isArray(account.storageStandard)) {
            storageData.push(...account.storageStandard);
          }
        });
        
        if (storageData.length === 0) {
          throw new Error('没有存储数据');
        }
        
        console.log(`获取到 ${storageData.length} 条存储数据`);
        
        // 处理数据：排序并转换为图表数据格式
        const processedData = storageData
          .map(item => {
            const beijingTime = dayjs(item.dimensions.datetime).tz('Asia/Shanghai');
            return {
              // 使用更精简的日期格式，减少x轴拥挤
              datetime: beijingTime.format('MM-DD'),
              // 对于tooltip显示更详细的时间
              fullDatetime: beijingTime.format('MM-DD HH:mm'),
              // 按日期分组的日期键
              dateKey: beijingTime.format('YYYY-MM-DD'),
              // 保存原始时间戳用于排序和找出最新记录
              timestamp: beijingTime.valueOf(),
              objectCount: item.max.objectCount,
              // 只保留对象大小，不再分开显示metadataSize和payloadSize
              objectSize: item.max.metadataSize + item.max.payloadSize,
              originalDatetime: item.dimensions.datetime, // 保存原始日期用于排序
            };
          })
          .sort((a, b) => 
            dayjs(a.originalDatetime).valueOf() - dayjs(b.originalDatetime).valueOf()
          );

        // 如果数据太多，按天聚合数据以减少x轴标签数量
        if (processedData.length > 15) {
          // 按日期分组
          const groupedByDay = processedData.reduce((acc, item) => {
            const day = item.dateKey;
            if (!acc[day]) {
              acc[day] = [];
            }
            acc[day].push(item);
            return acc;
          }, {} as Record<string, any[]>);
          
          // 从每组中取最新的一条数据（时间戳最大的记录）
          const aggregatedData = Object.keys(groupedByDay).map(day => {
            const dayData = groupedByDay[day];
            // 按时间戳排序，找出当天最新的数据点
            const latestItem = dayData.sort((a, b) => b.timestamp - a.timestamp)[0];
            
            return {
              datetime: latestItem.datetime,
              fullDatetime: latestItem.fullDatetime,
              objectCount: latestItem.objectCount,
              objectSize: latestItem.objectSize,
            };
          }).sort((a, b) => dayjs(a.fullDatetime, 'MM-DD HH:mm').valueOf() - dayjs(b.fullDatetime, 'MM-DD HH:mm').valueOf());
          
          setChartData(aggregatedData);
        } else {
          // 数据量不多，直接使用处理后的数据
          setChartData(processedData.map(({ datetime, fullDatetime, objectCount, objectSize }) => 
            ({ datetime, fullDatetime, objectCount, objectSize })
          ));
        }
      } catch (err) {
        console.error('获取存储数据失败:', err);
        setError(err instanceof Error ? err.message : '未知错误');
        setChartData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 根据选择的图表类型渲染不同的图表
  const renderChart = () => {
    // 如果数据正在加载，显示加载状态
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      );
    }
    
    // 如果数据为空，显示空状态
    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>暂无存储数据</p>
          {error && <p className="text-red-400 mt-2">{error}</p>}
        </div>
      );
    }
    
    // 所有图表通用的配置
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };
    
    // 所有坐标轴通用的配置
    const axisProps = {
      xAxis: <XAxis 
        dataKey="datetime" 
        tick={{ fill: '#9CA3AF' }} 
        axisLine={{ stroke: '#4B5563' }}
        minTickGap={30}
        interval="preserveStartEnd"
      />,
      leftYAxis: <YAxis 
        yAxisId="left" 
        tick={{ fill: '#9CA3AF' }} 
        axisLine={{ stroke: '#4B5563' }}
        width={80}
      />,
      rightYAxis: <YAxis 
        yAxisId="right" 
        orientation="right" 
        tick={{ fill: '#9CA3AF' }} 
        axisLine={{ stroke: '#4B5563' }}
        width={70}
        tickFormatter={(value) => formatBytes(value, 0)}
      />
    };
    
    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            {axisProps.xAxis}
            {axisProps.leftYAxis}
            {axisProps.rightYAxis}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#D1D5DB' }} />
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="objectCount" 
              name="对象数量" 
              stroke="#818CF8" 
              fill="#818CF8" 
              fillOpacity={0.3} 
              isAnimationActive={chartData.length < 500}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="objectSize" 
              name="对象大小" 
              stroke="#A855F7" 
              fill="#A855F7" 
              fillOpacity={0.3} 
              isAnimationActive={chartData.length < 500}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            {axisProps.xAxis}
            {axisProps.leftYAxis}
            {axisProps.rightYAxis}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#D1D5DB' }} />
            <Bar 
              yAxisId="left"
              dataKey="objectCount" 
              name="对象数量" 
              fill="#818CF8" 
              isAnimationActive={chartData.length < 500}
            />
            <Bar 
              yAxisId="right"
              dataKey="objectSize" 
              name="对象大小" 
              fill="#A855F7" 
              isAnimationActive={chartData.length < 500}
            />
          </BarChart>
        );
      
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            {axisProps.xAxis}
            {axisProps.leftYAxis}
            {axisProps.rightYAxis}
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ color: '#D1D5DB' }} />
            <Bar 
              yAxisId="left"
              dataKey="objectCount" 
              name="对象数量" 
              fill="#818CF8" 
              isAnimationActive={chartData.length < 500}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="objectSize" 
              name="对象大小" 
              stroke="#A855F7" 
              dot={chartData.length < 100 ? { stroke: '#A855F7', strokeWidth: 2, r: 2 } : false}
              activeDot={{ r: 6 }}
              isAnimationActive={chartData.length < 500}
            />
          </ComposedChart>
        );
        
      default:
        return null;
    }
  };

  // 获取当前数据的统计信息
  const getDataStats = () => {
    if (!chartData || chartData.length === 0) return null;
    
    const lastItem = chartData[chartData.length - 1];
    return {
      objectSize: formatBytes(lastItem.objectSize),
      objectCount: lastItem.objectCount,
      date: lastItem.fullDatetime
    };
  };
  
  const stats = getDataStats();

  return (
    <div className="bg-gray-800/30 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-xl mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          存储变化趋势
        </h2>
        
        {stats && (
          <div className="text-sm text-gray-300 flex flex-wrap gap-4">
            <span><span className="text-indigo-400 font-semibold">对象数量:</span> {stats.objectCount}</span>
            <span><span className="text-purple-400 font-semibold">对象大小:</span> {stats.objectSize}</span>
            <span><span className="text-gray-400">更新时间:</span> {stats.date}</span>
          </div>
        )}
        
        <div className="flex space-x-2">
          <button 
            onClick={() => setChartType('area')}
            className={`px-3 py-1 rounded-md ${chartType === 'area' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            面积图
          </button>
          <button 
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 rounded-md ${chartType === 'bar' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            柱状图
          </button>
          <button 
            onClick={() => setChartType('composed')}
            className={`px-3 py-1 rounded-md ${chartType === 'composed' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
          >
            组合图
          </button>
        </div>
      </div>
      
      <div className="bg-gray-900/50 rounded-lg p-4 border border-gray-700 h-96">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 text-sm text-gray-400">
        <p>* 图表显示存储变化趋势，按北京时间（GMT+8）排序</p>
        <p>* 对象大小 = 元数据大小 + 有效载荷大小</p>
        {!loading && error && (
          <p className="text-red-400">* 错误: {error}</p>
        )}
      </div>
    </div>
  );
};

export default StorageChart; 