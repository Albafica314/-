<template>
  <div class="space-y-6">
    <!-- Chart Row 1: Weekday vs Weekend Comparison -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-200 mb-4">时间维度：工作日 vs 周末 24小时出行形态对比</h3>
        <div ref="weekdayWeekendChartRef" class="w-full h-72"></div>
      </div>

      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-200 mb-4">空间网格维度：高频活跃 Geohash 网格出行量 Top 8</h3>
        <div ref="spatialGridChartRef" class="w-full h-72"></div>
      </div>
    </div>

    <!-- Chart Row 2: Fleet Efficiency & Distance Distribution -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-200 mb-4">运力能效：行程距离区间分布 (短途接驳 vs 走廊通勤)</h3>
        <div ref="distDistChartRef" class="w-full h-72"></div>
      </div>

      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-200 mb-4">车辆维度：单车日均营运指标分布画像 (537 辆车)</h3>
        <div class="grid grid-cols-2 gap-4 h-72 flex items-center">
          <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span class="text-xs text-slate-500">单车日均有效载客单数</span>
            <div class="text-2xl font-bold text-cyan-400 font-mono">36.4 <span class="text-xs text-slate-400 font-normal">单/车·天</span></div>
            <p class="text-[11px] text-slate-400">早晚高峰集中度 42.8%</p>
          </div>
          <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span class="text-xs text-slate-500">单车日均营运里程</span>
            <div class="text-2xl font-bold text-amber-400 font-mono">194.2 <span class="text-xs text-slate-400 font-normal">km/车·天</span></div>
            <p class="text-[11px] text-slate-400">载客里程占比 54.1%</p>
          </div>
          <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span class="text-xs text-slate-500">平均单次行程距离</span>
            <div class="text-2xl font-bold text-emerald-400 font-mono">4.82 <span class="text-xs text-slate-400 font-normal">km</span></div>
            <p class="text-[11px] text-slate-400">中位数 3.4 km</p>
          </div>
          <div class="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span class="text-xs text-slate-500">平均单次载客耗时</span>
            <div class="text-2xl font-bold text-purple-400 font-mono">13.8 <span class="text-xs text-slate-400 font-normal">min</span></div>
            <p class="text-[11px] text-slate-400">90% 集中在 5-25 分钟内</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';

const weekdayWeekendChartRef = ref(null);
const spatialGridChartRef = ref(null);
const distDistChartRef = ref(null);

onMounted(() => {
  if (weekdayWeekendChartRef.value) {
    const chart = echarts.init(weekdayWeekendChartRef.value);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { textStyle: { color: '#94a3b8' }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        name: '出行量',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          name: '工作日 (典型双峰 08:00 & 18:00)',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#06b6d4' },
          data: [3200, 1800, 1100, 900, 1400, 4200, 13800, 27400, 31200, 21800, 17900, 18500, 19200, 18900, 20400, 23100, 28500, 34200, 29800, 22100, 18400, 15900, 11800, 6800]
        },
        {
          name: '周末 (夜生活单峰 & 缓和上升)',
          type: 'line',
          smooth: true,
          itemStyle: { color: '#f59e0b' },
          data: [8200, 6800, 5200, 3100, 1900, 1800, 2800, 4900, 8900, 14200, 18500, 22400, 24800, 25100, 26200, 27100, 27800, 28900, 30400, 29800, 28900, 27400, 24100, 18200]
        }
      ]
    });
  }

  if (spatialGridChartRef.value) {
    const chart = echarts.init(spatialGridChartRef.value);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      yAxis: {
        type: 'category',
        data: ['金融区', '联合广场', 'SFO 机场', 'Mission', '渔人码头', '市政中心', '轮渡大厦', 'Castro'].reverse(),
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      series: [
        {
          name: '总出行量',
          type: 'bar',
          itemStyle: { color: '#10b981', borderRadius: [0, 4, 4, 0] },
          data: [68420, 59810, 52140, 44320, 38900, 36780, 31450, 24900].reverse()
        }
      ]
    });
  }

  if (distDistChartRef.value) {
    const chart = echarts.init(distDistChartRef.value);
    chart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: ['0-2km (短途接驳)', '2-5km (城区常规)', '5-10km (跨区中程)', '10-20km (走廊干线)', '>20km (机场枢纽)'],
        axisLabel: { color: '#94a3b8' },
        axisLine: { lineStyle: { color: '#334155' } }
      },
      yAxis: {
        type: 'value',
        name: '占比 (%)',
        axisLabel: { color: '#94a3b8' },
        splitLine: { lineStyle: { color: '#1e293b' } }
      },
      series: [
        {
          name: '比例 (%)',
          type: 'bar',
          itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
          data: [28.5, 42.1, 18.7, 6.8, 3.9]
        }
      ]
    });
  }
});
</script>
