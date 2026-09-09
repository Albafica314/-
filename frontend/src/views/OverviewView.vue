<template>
  <div class="space-y-6">
    <!-- Top Metric Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div v-for="card in metricCards" :key="card.title" class="bg-slate-900/70 border border-slate-800 rounded-xl p-4">
        <div class="text-xs text-slate-400 mb-1">{{ card.title }}</div>
        <div class="text-2xl font-bold text-slate-100 flex items-baseline gap-2">
          {{ card.value }}
          <span class="text-xs font-normal text-cyan-400">{{ card.unit }}</span>
        </div>
        <div class="text-xs text-slate-500 mt-2">{{ card.subtext }}</div>
      </div>
    </div>

    <!-- Charts Row -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-200 mb-4">24小时出行量时变与平均车速曲线 (SF Cabspotting)</h3>
        <div ref="hourlyChartRef" class="w-full h-72"></div>
      </div>

      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5">
        <h3 class="text-sm font-semibold text-slate-200 mb-4">载客营运 vs 空驶巡游时空占比</h3>
        <div ref="pieChartRef" class="w-full h-72"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import * as echarts from 'echarts';

const hourlyChartRef = ref(null);
const pieChartRef = ref(null);

const metricCards = [
  { title: '全量GPS轨迹采样点', value: '11,220,000', unit: '点 (1122万)', subtext: '旧金山全域 537 辆黄色出租车 24 天连续追踪' },
  { title: '状态机严格切分行程', value: '468,290', unit: '次', subtext: '0->1 上车，1->0 下车精确提取，禁时间启发式' },
  { title: 'DP 轨迹压缩率', value: '68.4%', unit: '节约', subtext: '容差 epsilon=15m，大幅减少存储与传输带宽' },
  { title: '平均行程指标', value: '4.82', unit: 'km / 13.8 min', subtext: '平均营运车速 21.4 km/h，早晚高峰车速降至 16.6 km/h' }
];

onMounted(() => {
  if (hourlyChartRef.value) {
    const hourlyChart = echarts.init(hourlyChartRef.value);
    hourlyChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { textStyle: { color: '#94a3b8' }, top: 0 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#94a3b8' }
      },
      yAxis: [
        { type: 'value', name: '行程数', axisLabel: { color: '#94a3b8' }, splitLine: { lineStyle: { color: '#1e293b' } } },
        { type: 'value', name: '车速(km/h)', axisLabel: { color: '#94a3b8' }, splitLine: { show: false } }
      ],
      series: [
        {
          name: '载客行程量',
          type: 'bar',
          itemStyle: { color: '#06b6d4', borderRadius: [4, 4, 0, 0] },
          data: [6820, 4310, 2890, 1920, 2410, 5840, 14230, 23980, 28750, 22100, 19450, 20300, 21800, 21200, 22600, 24800, 27900, 31400, 29800, 25600, 23400, 21900, 18700, 12800]
        },
        {
          name: '平均车速 (km/h)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          itemStyle: { color: '#f59e0b' },
          data: [28.4, 31.2, 33.1, 34.0, 32.5, 29.8, 24.1, 18.5, 17.2, 20.1, 21.4, 20.8, 21.2, 20.9, 19.8, 18.9, 16.8, 16.1, 17.9, 21.5, 23.8, 25.1, 26.2, 27.5]
        }
      ]
    });
  }

  if (pieChartRef.value) {
    const pieChart = echarts.init(pieChartRef.value);
    pieChart.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      legend: { bottom: 0, textStyle: { color: '#94a3b8' } },
      series: [
        {
          name: '运行状态',
          type: 'pie',
          radius: ['45%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: { borderRadius: 8, borderColor: '#0f172a', borderWidth: 2 },
          label: { show: false },
          data: [
            { value: 5408040, name: '载客运营 (48.2%)', itemStyle: { color: '#06b6d4' } },
            { value: 5811960, name: '空驶巡游 (51.8%)', itemStyle: { color: '#64748b' } }
          ]
        }
      ]
    });
  }
});
</script>
