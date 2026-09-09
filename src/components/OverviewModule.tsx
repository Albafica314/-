import React, { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { SF_METRICS, HOURLY_DATA } from '../data/sfData';
import { Activity, Gauge, MapPin, Minimize2, Cpu, Database, Server, Compass } from 'lucide-react';

export const OverviewModule: React.FC = () => {
  const hourlyChartRef = useRef<HTMLDivElement>(null);
  const pieChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let hourlyChart: echarts.ECharts | null = null;
    let pieChart: echarts.ECharts | null = null;

    if (hourlyChartRef.current) {
      hourlyChart = echarts.init(hourlyChartRef.current);
      hourlyChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'cross', label: { backgroundColor: '#475569' } },
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          textStyle: { color: '#1e293b' }
        },
        legend: {
          data: ['载客行程数 (次)', '平均车速 (km/h)'],
          textStyle: { color: '#475569' },
          top: 0
        },
        grid: { left: '2%', right: '3%', bottom: '3%', containLabel: true },
        xAxis: {
          type: 'category',
          data: HOURLY_DATA.map(d => d.hour),
          axisLine: { lineStyle: { color: '#cbd5e1' } },
          axisLabel: { color: '#64748b', fontSize: 11 }
        },
        yAxis: [
          {
            type: 'value',
            name: '行程数',
            nameTextStyle: { color: '#64748b' },
            axisLabel: { color: '#64748b' },
            splitLine: { lineStyle: { color: '#f1f5f9' } }
          },
          {
            type: 'value',
            name: '车速(km/h)',
            nameTextStyle: { color: '#64748b' },
            min: 10,
            max: 40,
            axisLabel: { color: '#64748b' },
            splitLine: { show: false }
          }
        ],
        series: [
          {
            name: '载客行程数 (次)',
            type: 'bar',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: '#0284c7' },
                { offset: 1, color: '#38bdf8' }
              ]),
              borderRadius: [4, 4, 0, 0]
            },
            data: HOURLY_DATA.map(d => d.trips)
          },
          {
            name: '平均车速 (km/h)',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            symbolSize: 6,
            itemStyle: { color: '#d97706' },
            lineStyle: { width: 3 },
            data: HOURLY_DATA.map(d => d.speed)
          }
        ]
      });
    }

    if (pieChartRef.current) {
      pieChart = echarts.init(pieChartRef.current);
      pieChart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}点 ({d}%)',
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0',
          textStyle: { color: '#1e293b' }
        },
        legend: { bottom: 10, textStyle: { color: '#64748b' } },
        series: [
          {
            name: '状态占比',
            type: 'pie',
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#ffffff',
              borderWidth: 3
            },
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 13, fontWeight: 'bold', color: '#0f172a' }
            },
            data: [
              { value: 5408040, name: '载客运营 (occupancy=1)', itemStyle: { color: '#0284c7' } },
              { value: 5811960, name: '空驶巡游 (occupancy=0)', itemStyle: { color: '#94a3b8' } }
            ]
          }
        ]
      });
    }

    const handleResize = () => {
      hourlyChart?.resize();
      pieChart?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      hourlyChart?.dispose();
      pieChart?.dispose();
    };
  }, []);

  return (
    <div className="space-y-6" id="overview-module-root">
      {/* 4 Architectural Banner Pills */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">④ 大数据底层层</div>
            <div className="text-xs font-bold text-slate-800">Hadoop HDFS + PySpark</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">③ 时空管理与挖掘层</div>
            <div className="text-xs font-bold text-slate-800">MobilityDB + PostGIS</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">② 业务逻辑层</div>
            <div className="text-xs font-bold text-slate-800">FastAPI RESTful APIs</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3.5 flex items-center space-x-3 shadow-xs">
          <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">① 可视化交互层</div>
            <div className="text-xs font-bold text-slate-800">Vue3 + ECharts5 + Leaflet</div>
          </div>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-cyan-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
            <span>全量轨迹采样点</span>
            <Activity className="w-4 h-4 text-cyan-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
            {SF_METRICS.totalRawGpsPoints.toLocaleString()}
            <span className="text-xs font-semibold text-cyan-700">点 (1122万)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            537 辆旧金山黄色出租车 24 天连续 GPS 追踪
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-emerald-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
            <span>状态机切分有效行程</span>
            <MapPin className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
            {SF_METRICS.totalValidTrips.toLocaleString()}
            <span className="text-xs font-semibold text-emerald-700">次行程</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            严格依靠 occupancy 0→1 与 1→0 切分，禁时间启发式
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-purple-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
            <span>DP 轨迹压缩率</span>
            <Minimize2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
            {SF_METRICS.dpCompressionSavingsPct}%
            <span className="text-xs font-semibold text-purple-700">存储缩减</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            Douglas-Peucker 容差 ε=15m，大幅减少时空点冗余
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-amber-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2 font-medium">
            <span>平均营运特征</span>
            <Gauge className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 flex items-baseline gap-2">
            {SF_METRICS.avgTripDistanceKm}
            <span className="text-xs font-semibold text-amber-700">km / {SF_METRICS.avgTripDurationMin} min</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            平均营运车速 21.4 km/h，早晚高峰降至 16.6 km/h
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-800">24小时载客行程量时变与平均车速曲线</h3>
              <p className="text-xs text-slate-500 mt-0.5">早高峰 (08:00) 与晚高峰 (17:00-18:00) 出行剧增，车速显著骤降</p>
            </div>
            <span className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 text-cyan-800 font-semibold border border-slate-200">SF Cabspotting 全量</span>
          </div>
          <div ref={hourlyChartRef} className="w-full h-80" />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div className="mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-800">全域载客营运 vs 空驶巡游点分布</h3>
            <p className="text-xs text-slate-500 mt-0.5">11,220,000 GPS 采样点状态结构</p>
          </div>
          <div ref={pieChartRef} className="w-full h-64" />
          <div className="text-xs text-slate-600 border-t border-slate-100 pt-3 space-y-1.5">
            <div className="flex justify-between">
              <span>空驶巡游率:</span>
              <span className="font-mono text-slate-700 font-medium">51.8% (空驶寻客)</span>
            </div>
            <div className="flex justify-between">
              <span>载客营运率:</span>
              <span className="font-mono text-cyan-700 font-bold">48.2% (产生有效营收)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
