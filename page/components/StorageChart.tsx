import React, { useState, useEffect, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line, ReferenceLine, ReferenceArea } from 'recharts';
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

// 请求数据接口
interface RequestData {
  dimensions: {
    datetime: string;
  };
  sum: {
    requests: number;
  };
}

// API响应数据接口
interface R2StatsResponse {
  data: {
    viewer: {
      accounts: Array<{
        storageStandard: StorageData[];
        classAOpsStandard: RequestData[];
        classBOpsStandard: RequestData[];
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
  
  const k = 1000; // R2：统计所使用的存储单位是"字节"，但它采用的换算方式是"十进制"（1000），用于它的存储计费场景。
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// 颜色常量定义
const COLORS = {
  objectCount: '#6366F1', // 较鲜明的蓝紫色
  objectSize: '#EC4899'   // 明亮的粉色，与蓝紫色形成鲜明对比
};

// 自定义渲染图例的函数
const renderCustomizedLegend = (props: any, visibleSeries: any, handleLegendClick: Function) => {
  const { payload } = props;
  
  return (
    <div className="flex justify-center mb-4">
      {payload.map((entry: any, index: number) => {
        const isActive = visibleSeries[entry.dataKey];
        const style = {
          marginRight: 16,
          color: isActive ? entry.color : '#999',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center'
        };
        
        return (
          <div 
            key={`item-${index}`} 
            style={style}
            onClick={() => handleLegendClick(entry.dataKey)}
          >
            <span 
              style={{ 
                display: 'inline-block', 
                width: 12, 
                height: 12, 
                marginRight: 5, 
                backgroundColor: isActive ? entry.color : '#999', 
                borderRadius: 2 
              }} 
            />
            <span style={{ fontSize: '0.875rem' }}>{entry.value}</span>
          </div>
        );
      })}
    </div>
  );
};

// 图表组件
const StorageChart: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [chartType, setChartType] = useState<ChartType>('area');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  // 控制数据系列的显示/隐藏
  const [visibleSeries, setVisibleSeries] = useState({
    objectCount: true,
    objectSize: true
  });
  
  // A类和B类请求总数
  const [requestCounts, setRequestCounts] = useState({
    classA: 0,
    classB: 0
  });
  
  // 计算Y轴的域范围，考虑到当前显示的数据系列
  const yAxisDomains = useMemo(() => {
    if (!chartData || chartData.length === 0) {
      return {
        left: [0, 'auto'] as [number, string],
        right: [0, 'auto'] as [number, string]
      };
    }
    
    // 根据可见性决定是否计算该数据系列的最大值
    const maxObjectCount = visibleSeries.objectCount 
      ? Math.max(...chartData.map(item => item.objectCount || 0))
      : 0;
    const normalizedMaxCount = Math.ceil(maxObjectCount / 10) * 10;
    
    const maxObjectSize = visibleSeries.objectSize 
      ? Math.max(...chartData.map(item => item.objectSize || 0))
      : 0;
    
    return {
      left: [0, normalizedMaxCount || 10] as [number, number], // 确保至少有一些高度
      right: [0, maxObjectSize || 10] as [number, number]      // 确保至少有一些高度
    };
  }, [chartData, visibleSeries]);
  
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
        // 获取A类和B类请求数据
        let classARequests: RequestData[] = [];
        let classBRequests: RequestData[] = [];
        
        data.data.viewer.accounts.forEach(account => {
          if (account.storageStandard && Array.isArray(account.storageStandard)) {
            storageData.push(...account.storageStandard);
          }
          
          if (account.classAOpsStandard && Array.isArray(account.classAOpsStandard)) {
            classARequests.push(...account.classAOpsStandard);
          }
          
          if (account.classBOpsStandard && Array.isArray(account.classBOpsStandard)) {
            classBRequests.push(...account.classBOpsStandard);
          }
        });
        
        if (storageData.length === 0) {
          throw new Error('没有存储数据');
        }
        
        // 计算A类和B类请求总数
        const totalClassARequests = classARequests.reduce((sum, item) => sum + (item.sum.requests || 0), 0);
        const totalClassBRequests = classBRequests.reduce((sum, item) => sum + (item.sum.requests || 0), 0);
        
        setRequestCounts({
          classA: totalClassARequests,
          classB: totalClassBRequests
        });
        
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
        setError('无法获取存储数据，请稍后再试');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 图例点击事件处理
  const handleLegendClick = (dataKey: string) => {
    // 删除限制条件，允许自由点击图例
    setVisibleSeries(prev => ({
      ...prev,
      [dataKey]: !prev[dataKey as keyof typeof prev]
    }));
  };

  // 为每种图表类型定制的自定义工具提示组件，显示所有数据系列
  const CustomizedTooltip = ({ active, payload, label, coordinate }: any) => {
    if (active && payload && payload.length) {
      const fullDatetime = payload[0]?.payload?.fullDatetime || label;
      
      return (
        <div className="bg-gray-800 p-4 border border-gray-700 rounded-md shadow-lg">
          <p className="text-gray-200 font-medium mb-2">{fullDatetime}</p>
          <div className="space-y-2">
            {payload.find(p => p.dataKey === 'objectCount') && (
              <p style={{ color: visibleSeries.objectCount ? COLORS.objectCount : '#999' }} className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: visibleSeries.objectCount ? COLORS.objectCount : '#999' }}></span>
                <span className="font-semibold mr-2">对象数量:</span>
                {payload.find(p => p.dataKey === 'objectCount')?.value || '无数据'}
              </p>
            )}
            {payload.find(p => p.dataKey === 'objectSize') && (
              <p style={{ color: visibleSeries.objectSize ? COLORS.objectSize : '#999' }} className="flex items-center">
                <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: visibleSeries.objectSize ? COLORS.objectSize : '#999' }}></span>
                <span className="font-semibold mr-2">对象大小:</span>
                {formatBytes(payload.find(p => p.dataKey === 'objectSize')?.value || 0)}
              </p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 横向和纵向参考线
  const [activeTooltipIndex, setActiveTooltipIndex] = useState<number | null>(null);
  
  // 处理鼠标悬停事件的函数
  const handleMouseMove = (state: any) => {
    if (state && state.activeTooltipIndex !== undefined) {
      setActiveTooltipIndex(state.activeTooltipIndex);
    }
  };

  // 处理鼠标离开事件的函数
  const handleMouseLeave = () => {
    setActiveTooltipIndex(null);
  };

  // 渲染图表
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
      margin: { top: 20, right: 30, left: 10, bottom: 10 },
      onMouseMove: handleMouseMove,
      onMouseLeave: handleMouseLeave
    };
    
    // 图表的网格线配置
    const gridProps = {
      strokeDasharray: "3 3",
      stroke: "#374151",
      vertical: false  // 只显示水平网格线
    };
    
    // 坐标轴配置
    const axisProps = {
      xAxis: <XAxis 
        dataKey="datetime" 
        tick={{ fill: '#9CA3AF' }} 
        axisLine={{ stroke: '#4B5563' }}
        minTickGap={10}  // 减小最小刻度间隔，允许更多标签显示
        interval={0}     // 强制显示所有刻度，而不是"preserveStartEnd"
        tickLine={true}
        padding={{ left: 10, right: 10 }}
      />,
      leftYAxis: <YAxis 
        yAxisId="left" 
        tick={{ fill: '#9CA3AF' }} 
        axisLine={{ stroke: visibleSeries.objectCount ? COLORS.objectCount : '#999' }}
        tickLine={{ stroke: visibleSeries.objectCount ? COLORS.objectCount : '#999' }}
        width={60}
        domain={yAxisDomains.left}
        allowDecimals={false}
        label={{ 
          value: '对象数量', 
          angle: -90, 
          position: 'insideLeft', 
          offset: -5, 
          fill: visibleSeries.objectCount ? COLORS.objectCount : '#999', 
          style: { textAnchor: 'middle' } 
        }}
      />,
      rightYAxis: <YAxis 
        yAxisId="right" 
        orientation="right" 
        tick={{ fill: '#9CA3AF' }} 
        axisLine={{ stroke: visibleSeries.objectSize ? COLORS.objectSize : '#999' }}
        tickLine={{ stroke: visibleSeries.objectSize ? COLORS.objectSize : '#999' }}
        width={80}
        tickFormatter={(value) => formatBytes(value, 0)}
        domain={yAxisDomains.right}
        label={{ 
          value: '对象大小', 
          angle: 90, 
          position: 'insideRight', 
          offset: -5, 
          fill: visibleSeries.objectSize ? COLORS.objectSize : '#999', 
          style: { textAnchor: 'middle' } 
        }}
      />
    };
    
    // 自定义图例
    const legendProps = {
      content: (props: any) => renderCustomizedLegend(props, visibleSeries, handleLegendClick),
      verticalAlign: 'top' as const,
      align: 'center' as const,
      height: 36
    };

    // 水平参考线
    const getReferenceLines = () => {
      if (activeTooltipIndex === null || !chartData[activeTooltipIndex]) return null;
      
      const dataPoint = chartData[activeTooltipIndex];
      const lines = [];
      
      if (visibleSeries.objectCount) {
        lines.push(
          <ReferenceLine 
            key="refLineLeft" 
            y={dataPoint.objectCount} 
            yAxisId="left" 
            stroke={COLORS.objectCount} 
            strokeDasharray="3 3" 
            strokeWidth={1} 
            ifOverflow="extendDomain" 
          />
        );
      }
      
      if (visibleSeries.objectSize) {
        lines.push(
          <ReferenceLine 
            key="refLineRight" 
            y={dataPoint.objectSize} 
            yAxisId="right" 
            stroke={COLORS.objectSize} 
            strokeDasharray="3 3" 
            strokeWidth={1} 
            ifOverflow="extendDomain" 
          />
        );
      }
      
      return lines;
    };
    
    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <Legend {...legendProps} />
            {axisProps.xAxis}
            {axisProps.leftYAxis}
            {axisProps.rightYAxis}
            <Tooltip 
              content={<CustomizedTooltip />} 
              cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5' }}
              isAnimationActive={false}
            />
            {getReferenceLines()}
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.objectCount} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.objectCount} stopOpacity={0.2}/>
              </linearGradient>
              <linearGradient id="colorSize" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS.objectSize} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={COLORS.objectSize} stopOpacity={0.2}/>
              </linearGradient>
            </defs>
            <Area 
              yAxisId="left"
              type="monotone" 
              dataKey="objectCount" 
              name="对象数量" 
              stroke={visibleSeries.objectCount ? COLORS.objectCount : "#999"}
              strokeWidth={2}
              fillOpacity={visibleSeries.objectCount ? 1 : 0}
              fill="url(#colorCount)" 
              isAnimationActive={chartData.length < 500}
              dot={chartData.length < 30 ? { fill: COLORS.objectCount, strokeWidth: 2, r: 3 } : false}
              activeDot={{ r: 6, fill: COLORS.objectCount }}
              hide={!visibleSeries.objectCount}
            />
            <Area 
              yAxisId="right"
              type="monotone" 
              dataKey="objectSize" 
              name="对象大小" 
              stroke={visibleSeries.objectSize ? COLORS.objectSize : "#999"}
              strokeWidth={2}
              fillOpacity={visibleSeries.objectSize ? 1 : 0}
              fill="url(#colorSize)" 
              isAnimationActive={chartData.length < 500}
              dot={chartData.length < 30 ? { fill: COLORS.objectSize, strokeWidth: 2, r: 3 } : false}
              activeDot={{ r: 6, fill: COLORS.objectSize }}
              hide={!visibleSeries.objectSize}
            />
          </AreaChart>
        );
      
      case 'bar':
        return (
          <BarChart {...commonProps} barGap={10}>
            <CartesianGrid {...gridProps} />
            <Legend {...legendProps} />
            {axisProps.xAxis}
            {axisProps.leftYAxis}
            {axisProps.rightYAxis}
            <Tooltip 
              content={<CustomizedTooltip />} 
              cursor={{ fill: 'rgba(120, 120, 120, 0.2)', stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5' }}
              isAnimationActive={false}
            />
            {getReferenceLines()}
            <Bar 
              yAxisId="left"
              dataKey="objectCount" 
              name="对象数量" 
              fill={visibleSeries.objectCount ? COLORS.objectCount : "#999"}
              fillOpacity={visibleSeries.objectCount ? 1 : 0}
              isAnimationActive={chartData.length < 500}
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              hide={!visibleSeries.objectCount}
            />
            <Bar 
              yAxisId="right"
              dataKey="objectSize" 
              name="对象大小" 
              fill={visibleSeries.objectSize ? COLORS.objectSize : "#999"}
              fillOpacity={visibleSeries.objectSize ? 1 : 0}
              isAnimationActive={chartData.length < 500}
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              hide={!visibleSeries.objectSize}
            />
          </BarChart>
        );
      
      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            <CartesianGrid {...gridProps} />
            <Legend {...legendProps} />
            {axisProps.xAxis}
            {axisProps.leftYAxis}
            {axisProps.rightYAxis}
            <Tooltip 
              content={<CustomizedTooltip />} 
              cursor={{ stroke: '#666', strokeWidth: 1, strokeDasharray: '5 5' }}
              isAnimationActive={false}
            />
            {getReferenceLines()}
            <Bar 
              yAxisId="left"
              dataKey="objectCount" 
              name="对象数量" 
              fill={visibleSeries.objectCount ? COLORS.objectCount : "#999"}
              fillOpacity={visibleSeries.objectCount ? 1 : 0}
              isAnimationActive={chartData.length < 500}
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
              hide={!visibleSeries.objectCount}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="objectSize" 
              name="对象大小" 
              stroke={visibleSeries.objectSize ? COLORS.objectSize : "#999"}
              strokeOpacity={visibleSeries.objectSize ? 1 : 0}
              strokeWidth={2}
              dot={chartData.length < 30 ? { stroke: COLORS.objectSize, strokeWidth: 2, r: 3 } : false}
              activeDot={{ r: 6 }}
              isAnimationActive={chartData.length < 500}
              hide={!visibleSeries.objectSize}
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
    <div className="mt-10">
      {!loading && !error && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
            存储状态
          </h2>
          
          <div className="flex justify-between mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('area')}
                className={`px-4 py-1 rounded-md text-sm ${
                  chartType === 'area' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                } hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors theme-transition`}
              >
                面积图
              </button>
              <button
                onClick={() => setChartType('bar')}
                className={`px-4 py-1 rounded-md text-sm ${
                  chartType === 'bar' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                } hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors theme-transition`}
              >
                柱状图
              </button>
              <button
                onClick={() => setChartType('composed')}
                className={`px-4 py-1 rounded-md text-sm ${
                  chartType === 'composed' 
                    ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700' 
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700'
                } hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors theme-transition`}
              >
                组合图
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-100/70 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 theme-transition">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mr-2 theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm theme-transition">总文件数</h3>
                <div className="relative group ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 theme-transition">
                    所有用户上传的文件总数
                  </div>
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200 theme-transition">
                {loading ? (
                  <span className="inline-block w-8 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded theme-transition"></span>
                ) : chartData.length > 0 ? (
                  chartData[chartData.length - 1].objectCount
                ) : (
                  '0'
                )}
              </p>
            </div>
            
            <div className="bg-gray-100/70 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 theme-transition">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-600 dark:text-pink-400 mr-2 theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                </svg>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm theme-transition">总存储量</h3>
                <div className="relative group ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 theme-transition">
                    所有文件占用的总存储空间（包含元数据）
                  </div>
                </div>
              </div>
              <p className="text-2xl font-semibold text-gray-700 dark:text-gray-200 theme-transition">
                {loading ? (
                  <span className="inline-block w-16 h-6 bg-gray-200 dark:bg-gray-700 animate-pulse rounded theme-transition"></span>
                ) : chartData.length > 0 ? (
                  formatBytes(chartData[chartData.length - 1].objectSize)
                ) : (
                  '0 Bytes'
                )}
              </p>
            </div>
            
            <div className="bg-gray-100/70 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 theme-transition">
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-600 dark:text-amber-400 mr-2 theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-gray-600 dark:text-gray-400 text-sm theme-transition">API请求</h3>
                <div className="relative group ml-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 theme-transition">
                    本月API请求次数统计
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <div className="flex items-center">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm theme-transition">A类</h3>
                    <div className="relative group ml-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 theme-transition">
                        A类操作主要包括写入和删除存储资源。每月100万次免费
                      </div>
                    </div>
                  </div>
                  <p className={`font-medium ${
                    requestCounts.classA < 500000 ? 'text-gray-700 dark:text-gray-200' : 
                    (requestCounts.classA < 750000 ? 'text-blue-600 dark:text-blue-400' : 
                    (requestCounts.classA < 1000000 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'))
                  } theme-transition`}>{requestCounts.classA}</p>
                </div>
                
                <div>
                  <div className="flex items-center">
                    <h3 className="text-gray-600 dark:text-gray-400 text-sm theme-transition">B类</h3>
                    <div className="relative group ml-1">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 cursor-help theme-transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 p-2 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 theme-transition">
                        B类操作主要包括查看和查询存储资源。每月1000万次免费
                      </div>
                    </div>
                  </div>
                  <p className={`font-medium ${
                    requestCounts.classB < 5000000 ? 'text-gray-700 dark:text-gray-200' : 
                    (requestCounts.classB < 7500000 ? 'text-blue-600 dark:text-blue-400' : 
                    (requestCounts.classB < 10000000 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'))
                  } theme-transition`}>{requestCounts.classB}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-gray-100/70 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700 h-[400px] theme-transition">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart()}
        </ResponsiveContainer>
      </div>
      
      <div className="mt-3 text-sm text-gray-600 dark:text-gray-400 hidden theme-transition">
        <p>* 图表显示存储变化趋势，按北京时间（GMT+8）排序</p>
        <p>* 对象大小 = 元数据大小 + 有效载荷大小</p>
        {!loading && error && (
          <p className="text-red-600 dark:text-red-400 theme-transition">* 错误: {error}</p>
        )}
      </div>
    </div>
  );
};

export default StorageChart; 