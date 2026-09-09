import React, { useState } from 'react';
import { OverviewModule } from './components/OverviewModule';
import { HotspotModule } from './components/HotspotModule';
import { TrajectoryReplayModule } from './components/TrajectoryReplayModule';
import { ODFlowModule } from './components/ODFlowModule';
import { PredictionModule } from './components/PredictionModule';
import { StatisticsModule } from './components/StatisticsModule';
import { CodeExplorerModule } from './components/CodeExplorerModule';
import {
  LayoutDashboard,
  Flame,
  Route,
  Share2,
  Sparkles,
  BarChart2,
  Code2,
  Car,
  ShieldCheck
} from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('overview');

  const navTabs = [
    { id: 'overview', name: '1. 总览大屏', icon: LayoutDashboard },
    { id: 'hotspot', name: '2. 热点热力图', icon: Flame },
    { id: 'replay', name: '3. 轨迹动态回放', icon: Route },
    { id: 'od_flow', name: '4. OD流向图', icon: Share2 },
    { id: 'prediction', name: '5. 目的地预测', icon: Sparkles },
    { id: 'stats', name: '6. 时空统计分析', icon: BarChart2 },
    { id: 'code_explorer', name: '7. 架构与工程源码', icon: Code2 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Main Navigation Header */}
      <header className="h-16 border-b border-slate-200/90 bg-white/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-600 font-bold shadow-xs">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm md:text-base font-bold text-slate-800 tracking-tight">
                城市出租车时空轨迹挖掘与智慧交通可视化系统
              </h1>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-medium">
                SF Cabspotting 1122万点
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              面向高并发时空轨迹的大数据分布式清洗、DBSCAN热点挖掘与多模型目的地预测
            </p>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center space-x-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200 shadow-inner overflow-x-auto">
          {navTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </header>

      {/* Sub-Header Notice Bar: Core Physical Rule & Boundary */}
      <div className="bg-white/70 border-b border-slate-200/80 px-6 py-1.5 text-[11px] text-slate-600 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
          <span>
            <strong>核心规则</strong>：严格依靠 <span className="text-cyan-700 font-mono font-semibold">occupancy</span> 状态机切分载客行程 (<span className="text-emerald-700 font-mono font-semibold">0→1 上车</span>，<span className="text-amber-700 font-mono font-semibold">1→0 下车</span>)；严禁使用时间间隔启发式切分。
          </span>
        </div>
        <div className="text-slate-500 font-mono hidden md:block">
          旧金山范围 [Lat: 37.5~37.9, Lon: -122.6~-122.2] · 瞬时速度 &gt;200km/h 异常漂移已剔除
        </div>
      </div>

      {/* Active Module Container */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
        {activeTab === 'overview' && <OverviewModule />}
        {activeTab === 'hotspot' && <HotspotModule />}
        {activeTab === 'replay' && <TrajectoryReplayModule />}
        {activeTab === 'od_flow' && <ODFlowModule />}
        {activeTab === 'prediction' && <PredictionModule />}
        {activeTab === 'stats' && <StatisticsModule />}
        {activeTab === 'code_explorer' && <CodeExplorerModule />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-500">
        城市出租车时空轨迹挖掘与智慧交通可视化系统 · 2026
      </footer>
    </div>
  );
}

export default App;
