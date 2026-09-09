import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { HOURLY_DATA } from '../data/sfData';
import { Calendar, Grid, BarChart3, Truck, Clock } from 'lucide-react';

export const StatisticsModule: React.FC = () => {
  const weekdayWeekendChartRef = useRef<HTMLDivElement>(null);
  const spatialGridChartRef = useRef<HTMLDivElement>(null);
  const distDistChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let chart1: echarts.ECharts | null = null;
    let chart2: echarts.ECharts | null = null;
    let chart3: echarts.ECharts | null = null;

    // Chart 1: Weekday vs Weekend
    if (weekdayWeekendChartRef.current) {
      chart1 = echarts.init(weekdayWeekendChartRef.current);
      chart1.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        legend: {
          data: ['工作日 (典型双高峰 08:00 & 18:00)', '周末 (晚间单峰 & 缓和回升)'],
          textStyle: { color: '#94a3b8' },
          top: 0
        },
        grid: { left: '2%', right: '3%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: HOURLY_DATA.map(d => d.hour),
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#94a3b8', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          name: '行程数',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: [
          {
            name: '工作日 (典型双高峰 08:00 & 18:00)',
            type: 'line',
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: '#06b6d4' },
            lineStyle: { width: 3 },
            data: HOURLY_DATA.map(d => d.weekday)
          },
          {
            name: '周末 (晚间单峰 & 缓和回升)',
            type: 'line',
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: '#f59e0b' },
            lineStyle: { width: 3 },
            data: HOURLY_DATA.map(d => d.weekend)
          }
        ]
      });
    }

    // Chart 2: Top Spatial Grids
    if (spatialGridChartRef.current) {
      chart2 = echarts.init(spatialGridChartRef.current);
      const gridNames = [
        '金融核心区 (9q8yyk)',
        '联合广场 (9q8yy7)',
        'SFO 国际机场 (9q8vts)',
        'Mission 街区 (9q8yvh)',
        '渔人码头 (9q8zh4)',
        '市政中心 (9q8yv9)',
        '轮渡大厦 (9q8yyp)',
        'Castro 街区 (9q8yv2)'
      ].reverse();
      const gridCounts = [68420, 59810, 52140, 44320, 38900, 36780, 31450, 24900].reverse();

      chart2.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '5%', bottom: '3%', top: '4%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        yAxis: {
          type: 'category',
          data: gridNames,
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#94a3b8', fontSize: 11 }
        },
        series: [
          {
            name: '总出行频次',
            type: 'bar',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
                { offset: 0, color: '#059669' },
                { offset: 1, color: '#10b981' }
              ]),
              borderRadius: [0, 4, 4, 0]
            },
            data: gridCounts
          }
        ]
      });
    }

    // Chart 3: Distance Bucket Distribution
    if (distDistChartRef.current) {
      chart3 = echarts.init(distDistChartRef.current);
      chart3.setOption({
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
        xAxis: {
          type: 'category',
          data: ['0-2km (短途接驳)', '2-5km (常规市区)', '5-10km (跨区中程)', '10-20km (走廊长线)', '>20km (机场枢纽)'],
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#94a3b8', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          name: '行程占比 (%)',
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: '#1e293b' } }
        },
        series: [
          {
            name: '占比 (%)',
            type: 'bar',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#a855f7' },
                { offset: 1, color: '#6366f1' }
              ]),
              borderRadius: [4, 4, 0, 0]
            },
            data: [28.5, 42.1, 18.7, 6.8, 3.9]
          }
        ]
      });
    }

    const handleResize = () => {
      chart1?.resize();
      chart2?.resize();
      chart3?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart1?.dispose();
      chart2?.dispose();
      chart3?.dispose();
    };
  }, []);

  return (
    <div className="space-y-6" id="statistics-module-root">
      {/* Top 2 Charts: Weekday vs Weekend & Spatial Grids */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 text-cyan-400 mb-2">
            <Calendar className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-slate-200">
              时间维度：工作日 vs 周末 24 小时时变形态对比
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            工作日呈现早 08:00 与晚 18:00 极致双峰；周末无早高峰，午后持续上升至深夜单峰
          </p>
          <div ref={weekdayWeekendChartRef} className="w-full h-72" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 text-emerald-400 mb-2">
            <Grid className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-slate-200">
              空间网格维度：旧金山全域高频 Geohash 网格 Top 8
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            金融区与联合广场商业带聚集了全城 31% 以上的出行起讫点
          </p>
          <div ref={spatialGridChartRef} className="w-full h-72" />
        </div>
      </div>

      {/* Bottom 2 Charts: Distance Distribution & Fleet Operational Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center space-x-2 text-purple-400 mb-2">
            <BarChart3 className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-slate-200">
              运力能效：单次行程行驶距离区间分布
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            超 70% 的出租车订单集中在 5 公里以内的城区接驳与常规微循环
          </p>
          <div ref={distDistChartRef} className="w-full h-72" />
        </div>

        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-amber-400 mb-2">
            <Truck className="w-5 h-5" />
            <h3 className="text-sm font-semibold text-slate-200">
              车辆维度：537 辆车日均营运效能画像
            </h3>
          </div>
          <p className="text-xs text-slate-400 mb-3">
            基于 Spark 分布式清洗统计的单车日均运行指标中位数
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">单车日均有效载客单数</span>
              <div className="text-2xl font-bold text-cyan-400 font-mono">
                36.4 <span className="text-xs text-slate-400 font-normal">单/车·天</span>
              </div>
              <span className="text-[10px] text-slate-500 block">早晚高峰单量集中度 42.8%</span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">单车日均营运里程</span>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                194.2 <span className="text-xs text-slate-400 font-normal">km/车·天</span>
              </div>
              <span className="text-[10px] text-slate-500 block">有效载客里程比 54.1%</span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">平均单次行程里程</span>
              <div className="text-2xl font-bold text-emerald-400 font-mono">
                4.82 <span className="text-xs text-slate-400 font-normal">km</span>
              </div>
              <span className="text-[10px] text-slate-500 block">中位数 3.4 km，极值 38 km</span>
            </div>

            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[11px] text-slate-400">平均单次载客耗时</span>
              <div className="text-2xl font-bold text-purple-400 font-mono">
                13.8 <span className="text-xs text-slate-400 font-normal">min</span>
              </div>
              <span className="text-[10px] text-slate-500 block">90% 集中在 5-25 分钟区间</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
