<template>
  <div class="space-y-6">
    <!-- Top Configuration & Prefix Control -->
    <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 class="text-base font-semibold text-slate-100 flex items-center gap-2">
            出租车目的地网格多分类预测交互评测
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">核心亮点算法</span>
          </h3>
          <p class="text-xs text-slate-400 mt-1">模拟出租车行驶过程中不同前缀比例下，三套预测模型对最终目的地网格的研判效果</p>
        </div>

        <!-- Prefix Selector Tabs -->
        <div class="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <span class="text-xs text-slate-500 px-2">轨迹前缀:</span>
          <button
            v-for="p in prefixOptions"
            :key="p.ratio"
            @click="activePrefix = p.ratio"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
              activePrefix === p.ratio ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            ]"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Feature Bar -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2 text-xs">
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span class="text-slate-500 block">行驶方向角</span>
          <span class="text-amber-400 font-mono font-bold">{{ prefixStats.heading }}° (向南偏东)</span>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span class="text-slate-500 block">已行驶距离</span>
          <span class="text-slate-200 font-mono">{{ prefixStats.dist }} km</span>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span class="text-slate-500 block">已耗时</span>
          <span class="text-slate-200 font-mono">{{ prefixStats.time }} min</span>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span class="text-slate-500 block">瞬时均速</span>
          <span class="text-slate-200 font-mono">{{ prefixStats.speed }} km/h</span>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span class="text-slate-500 block">起点坐标</span>
          <span class="text-slate-300 font-mono">37.808, -122.417</span>
        </div>
        <div class="bg-slate-950/80 p-2 rounded-lg border border-slate-800">
          <span class="text-slate-500 block">真实目的地</span>
          <span class="text-emerald-400 font-mono font-bold">SFO 机场 (9q8vts)</span>
        </div>
      </div>
    </div>

    <!-- Three Comparative Models Columns -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Model 1: Baseline -->
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-semibold text-slate-200">① 起点频率基线 (Baseline)</h4>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">P(Dest|Origin)</span>
          </div>
          <p class="text-xs text-slate-400 mb-3">仅依据起点网格的历史先验分布进行预测</p>

          <div class="space-y-2 text-xs">
            <div v-for="item in currentPredictions.baseline" :key="item.name" class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span class="font-medium text-slate-200">Top-{{ item.rank }}: {{ item.name }}</span>
                <span class="text-[10px] text-slate-500 block">误差: {{ item.distErr }} km</span>
              </div>
              <div class="text-right">
                <span class="font-mono text-cyan-400 font-bold">{{ item.prob }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800 text-xs flex justify-between text-slate-400">
          <span>Top-1 距离误差:</span>
          <span class="font-mono text-rose-400 font-bold">{{ currentPredictions.baselineErr }} km</span>
        </div>
      </div>

      <!-- Model 2: Markov Chain -->
      <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-semibold text-slate-200">② 马尔可夫链转移模型 (Markov)</h4>
            <span class="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">P(G_t | G_{t-1})</span>
          </div>
          <p class="text-xs text-slate-400 mb-3">结合当前网格与上一跳网格状态转移概率</p>

          <div class="space-y-2 text-xs">
            <div v-for="item in currentPredictions.markov" :key="item.name" class="p-2 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span class="font-medium text-slate-200">Top-{{ item.rank }}: {{ item.name }}</span>
                <span class="text-[10px] text-slate-500 block">误差: {{ item.distErr }} km</span>
              </div>
              <div class="text-right">
                <span class="font-mono text-cyan-400 font-bold">{{ item.prob }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800 text-xs flex justify-between text-slate-400">
          <span>Top-1 距离误差:</span>
          <span class="font-mono text-amber-400 font-bold">{{ currentPredictions.markovErr }} km</span>
        </div>
      </div>

      <!-- Model 3: Random Forest Multi-class -->
      <div class="bg-slate-900/70 border border-cyan-500/40 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
        <div class="absolute top-0 right-0 px-2 py-0.5 rounded-bl bg-cyan-500 text-slate-950 text-[10px] font-bold">最优算法</div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-semibold text-cyan-300">③ 随机森林时空多分类</h4>
            <span class="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400">Random Forest</span>
          </div>
          <p class="text-xs text-slate-400 mb-3">联合方向角、均速、时长、起始小时与前缀多维特征</p>

          <div class="space-y-2 text-xs">
            <div v-for="item in currentPredictions.rf" :key="item.name" :class="['p-2 rounded-lg border flex items-center justify-between', item.isTrue ? 'bg-cyan-950/40 border-cyan-500/60' : 'bg-slate-950/80 border-slate-800']">
              <div>
                <span class="font-medium text-slate-200">Top-{{ item.rank }}: {{ item.name }}</span>
                <span class="text-[10px] text-slate-500 block">误差: {{ item.distErr }} km</span>
              </div>
              <div class="text-right">
                <span class="font-mono text-emerald-400 font-bold">{{ item.prob }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-800 text-xs flex justify-between text-slate-400">
          <span>Top-1 距离误差:</span>
          <span class="font-mono text-emerald-400 font-bold">{{ currentPredictions.rfErr }} km (精准命中)</span>
        </div>
      </div>
    </div>

    <!-- Offline Benchmark Accuracy Table -->
    <div class="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3">
      <h4 class="text-sm font-semibold text-slate-200">全量测试集离线评估对比指标 (Top-1 / Top-5 / Top-10 准确率 & 平均距离误差)</h4>
      <div class="overflow-x-auto">
        <table class="w-full text-xs text-left">
          <thead class="text-slate-400 border-b border-slate-800 bg-slate-950/50">
            <tr>
              <th class="py-2.5 px-4">预测模型</th>
              <th class="py-2.5 px-4">Top-1 准确率</th>
              <th class="py-2.5 px-4">Top-5 准确率</th>
              <th class="py-2.5 px-4">Top-10 准确率</th>
              <th class="py-2.5 px-4">平均地理距离误差 (km)</th>
              <th class="py-2.5 px-4">模型持久化保存文件</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/80">
            <tr class="hover:bg-slate-800/30">
              <td class="py-2.5 px-4 font-medium text-slate-300">起点频率基线 (Baseline)</td>
              <td class="py-2.5 px-4 font-mono text-slate-400">28.4%</td>
              <td class="py-2.5 px-4 font-mono text-slate-400">51.2%</td>
              <td class="py-2.5 px-4 font-mono text-slate-400">66.8%</td>
              <td class="py-2.5 px-4 font-mono text-rose-400">5.42 km</td>
              <td class="py-2.5 px-4 font-mono text-slate-500">dest_baseline.json</td>
            </tr>
            <tr class="hover:bg-slate-800/30">
              <td class="py-2.5 px-4 font-medium text-slate-300">马尔可夫链网格转移 (Markov Chain)</td>
              <td class="py-2.5 px-4 font-mono text-slate-300">41.6%</td>
              <td class="py-2.5 px-4 font-mono text-slate-300">68.3%</td>
              <td class="py-2.5 px-4 font-mono text-slate-300">81.5%</td>
              <td class="py-2.5 px-4 font-mono text-amber-400">3.78 km</td>
              <td class="py-2.5 px-4 font-mono text-slate-500">dest_markov.json</td>
            </tr>
            <tr class="bg-cyan-950/20 hover:bg-cyan-950/30">
              <td class="py-2.5 px-4 font-bold text-cyan-300">随机森林时空多分类 (Random Forest)</td>
              <td class="py-2.5 px-4 font-mono font-bold text-cyan-400">62.8%</td>
              <td class="py-2.5 px-4 font-mono font-bold text-cyan-400">86.4%</td>
              <td class="py-2.5 px-4 font-mono font-bold text-cyan-400">93.7%</td>
              <td class="py-2.5 px-4 font-mono font-bold text-emerald-400">1.94 km</td>
              <td class="py-2.5 px-4 font-mono text-cyan-400">dest_rf_model.pkl</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const activePrefix = ref(0.6);

const prefixOptions = [
  { ratio: 0.2, label: '20% 起步截断' },
  { ratio: 0.4, label: '40% 行程前期' },
  { ratio: 0.6, label: '60% 行程中段' },
  { ratio: 0.8, label: '80% 即将抵达' }
];

const prefixStats = computed(() => {
  switch (activePrefix.value) {
    case 0.2: return { heading: 148, dist: 4.5, time: 4.2, speed: 64.2 };
    case 0.4: return { heading: 156, dist: 9.0, time: 8.5, speed: 63.5 };
    case 0.6: return { heading: 161, dist: 13.5, time: 13.2, speed: 61.4 };
    case 0.8: return { heading: 164, dist: 18.0, time: 18.0, speed: 60.0 };
    default: return { heading: 160, dist: 13.5, time: 13.0, speed: 62.0 };
  }
});

const currentPredictions = computed(() => {
  const p = activePrefix.value;
  return {
    baseline: [
      { rank: 1, name: '金融中心区 (9q8yyk)', prob: 42, distErr: 21.8, isTrue: false },
      { rank: 2, name: '联合广场 (9q8yy7)', prob: 24, distErr: 22.3, isTrue: false },
      { rank: 3, name: 'SFO 国际机场 (9q8vts)', prob: 18, distErr: 0.0, isTrue: true }
    ],
    baselineErr: 21.8,
    markov: [
      { rank: 1, name: 'SFO 国际机场 (9q8vts)', prob: Math.round(35 + p * 40), distErr: 0.0, isTrue: true },
      { rank: 2, name: 'Mission 街区 (9q8yvh)', prob: 22, distErr: 18.2, isTrue: false },
      { rank: 3, name: 'SOMA 南区 (9q8yvs)', prob: 15, distErr: 19.5, isTrue: false }
    ],
    markovErr: p >= 0.4 ? 0.0 : 18.2,
    rf: [
      { rank: 1, name: 'SFO 国际机场 (9q8vts)', prob: Math.round(50 + p * 45), distErr: 0.0, isTrue: true },
      { rank: 2, name: 'Mission 街区 (9q8yvh)', prob: Math.round(20 - p * 15), distErr: 18.2, isTrue: false },
      { rank: 3, name: 'SOMA 南区 (9q8yvs)', prob: Math.round(15 - p * 12), distErr: 19.5, isTrue: false }
    ],
    rfErr: 0.0
  };
});
</script>
