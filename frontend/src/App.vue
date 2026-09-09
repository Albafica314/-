<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
    <!-- Top Navigation Header -->
    <header class="h-16 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-50">
      <div class="flex items-center space-x-3">
        <div class="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold text-sm">
          SF
        </div>
        <div>
          <h1 class="text-base font-semibold text-slate-100 tracking-tight flex items-center gap-2">
            城市出租车时空轨迹挖掘与智慧交通可视化系统
            <span class="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">SF Cabspotting 1122万点</span>
          </h1>
          <p class="text-xs text-slate-400">大数据综合实践 · 小组成员：华文涛、阳泽宇、许钧柏</p>
        </div>
      </div>

      <!-- Module Navigation Buttons -->
      <nav class="flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="activeModule = item.id"
          :class="[
            'px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200',
            activeModule === item.id
              ? 'bg-cyan-500 text-slate-950 font-semibold shadow-lg shadow-cyan-500/25'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          ]"
        >
          {{ item.name }}
        </button>
      </nav>
    </header>

    <!-- Main Module Display Area -->
    <main class="flex-1 p-6">
      <component :is="activeComponent" />
    </main>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import OverviewView from './views/OverviewView.vue';
import HotspotView from './views/HotspotView.vue';
import TrajectoryReplayView from './views/TrajectoryReplayView.vue';
import ODFlowView from './views/ODFlowView.vue';
import PredictionView from './views/PredictionView.vue';
import SpatiotemporalStatsView from './views/SpatiotemporalStatsView.vue';

const activeModule = ref('overview');

const navItems = [
  { id: 'overview', name: '1. 总览大屏' },
  { id: 'hotspot', name: '2. 热点热力图' },
  { id: 'replay', name: '3. 轨迹动态回放' },
  { id: 'od_flow', name: '4. OD流向图' },
  { id: 'prediction', name: '5. 目的地预测' },
  { id: 'stats', name: '6. 时空统计分析' }
];

const activeComponent = computed(() => {
  switch (activeModule.value) {
    case 'overview': return OverviewView;
    case 'hotspot': return HotspotView;
    case 'replay': return TrajectoryReplayView;
    case 'od_flow': return ODFlowView;
    case 'prediction': return PredictionView;
    case 'stats': return SpatiotemporalStatsView;
    default: return OverviewView;
  }
});
</script>
