import React, { useState } from 'react';
import { BENCHMARK_MODELS } from '../data/sfData';
import { Sparkles, Target, Compass, CheckCircle2, XCircle, BarChart3, Award, FileCode } from 'lucide-react';

export const PredictionModule: React.FC = () => {
  const [prefixRatio, setPrefixRatio] = useState<number>(0.6); // 20%, 40%, 60%, 80%

  // Simulated features based on prefix ratio
  const currentFeatures = {
    heading: prefixRatio === 0.2 ? 148 : prefixRatio === 0.4 ? 156 : prefixRatio === 0.6 ? 162 : 165,
    distanceKm: (22.4 * prefixRatio).toFixed(2),
    elapsedMin: (23.6 * prefixRatio).toFixed(1),
    avgSpeedKmh: (56.8 - prefixRatio * 2).toFixed(1),
    startCoord: '37.8080, -122.4177 (渔人码头)',
    currentCoord: prefixRatio === 0.2
      ? '37.7780, -122.4020 (SOMA区)'
      : prefixRatio === 0.4
      ? '37.7350, -122.3910 (Bayshore)'
      : prefixRatio === 0.6
      ? '37.6650, -122.3810 (101高速段)'
      : '37.6250, -122.3770 (机场外围)',
    trueDestination: '37.6189, -122.3750 (旧金山国际机场 SFO, 网格: 9q8vts)'
  };

  // Prediction candidate arrays calculated per model
  const baselinePredictions = [
    { rank: 1, gridName: '金融核心区 / Market St (9q8yyk)', prob: 38, distErrKm: 21.8, isTrue: false },
    { rank: 2, gridName: '联合广场 / Powell St (9q8yy7)', prob: 26, distErrKm: 22.3, isTrue: false },
    { rank: 3, gridName: '渔人码头 / 环游返回 (9q8zh4)', prob: 18, distErrKm: 21.0, isTrue: false },
    { rank: 4, gridName: 'SFO 国际机场 (9q8vts)', prob: 11, distErrKm: 0.0, isTrue: true },
    { rank: 5, gridName: 'Mission 街区 (9q8yvh)', prob: 7, distErrKm: 18.2, isTrue: false }
  ];

  const markovPredictions = [
    { rank: 1, gridName: 'SFO 国际机场 (9q8vts)', prob: Math.min(82, Math.round(35 + prefixRatio * 55)), distErrKm: 0.0, isTrue: true },
    { rank: 2, gridName: '南旧金山工业园 (9q8vte)', prob: 20, distErrKm: 4.8, isTrue: false },
    { rank: 3, gridName: 'San Mateo 商业中心 (9q8vsv)', prob: 14, distErrKm: 8.5, isTrue: false },
    { rank: 4, gridName: 'Mission 街区 (9q8yvh)', prob: 9, distErrKm: 18.2, isTrue: false },
    { rank: 5, gridName: '金融核心区 (9q8yyk)', prob: 5, distErrKm: 21.8, isTrue: false }
  ];

  const rfPredictions = [
    { rank: 1, gridName: 'SFO 国际机场 (9q8vts)', prob: Math.min(96, Math.round(52 + prefixRatio * 50)), distErrKm: 0.0, isTrue: true },
    { rank: 2, gridName: '南旧金山轻轨站 (9q8vte)', prob: Math.max(2, Math.round(18 - prefixRatio * 16)), distErrKm: 4.8, isTrue: false },
    { rank: 3, gridName: 'Millbrae 交通枢纽 (9q8vsw)', prob: Math.max(1, Math.round(14 - prefixRatio * 14)), distErrKm: 3.2, isTrue: false },
    { rank: 4, gridName: 'San Bruno 居民区 (9q8vtd)', prob: Math.max(1, Math.round(10 - prefixRatio * 10)), distErrKm: 5.1, isTrue: false },
    { rank: 5, gridName: 'Burlingame 酒店区 (9q8vsm)', prob: Math.max(0, Math.round(6 - prefixRatio * 6)), distErrKm: 6.4, isTrue: false }
  ];

  return (
    <div className="space-y-6" id="prediction-module-root">
      {/* Top Interactive Configuration Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-cyan-600" />
              <h3 className="text-base font-bold text-slate-900">
                出租车目的地网格多分类预测交互评测
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 font-semibold">
                核心亮点算法模块
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              基于轨迹前缀时空多维特征，对比起点频率基线、马尔可夫网格转移与随机森林三套模型推断效果
            </p>
          </div>

          {/* Interactive Prefix Ratio Tabs */}
          <div className="flex items-center space-x-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-600 px-2 font-semibold">截取轨迹前缀:</span>
            {[
              { ratio: 0.2, label: '20% 起步截断' },
              { ratio: 0.4, label: '40% 行程前期' },
              { ratio: 0.6, label: '60% 行程中段' },
              { ratio: 0.8, label: '80% 即将抵达' }
            ].map(item => (
              <button
                key={item.ratio}
                onClick={() => setPrefixRatio(item.ratio)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  prefixRatio === item.ratio
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                {{ 0.2: '20% 起步', 0.4: '40% 前期', 0.6: '60% 中段', 0.8: '80% 终段' }[item.ratio]}
              </button>
            ))}
          </div>
        </div>

        {/* Real-time Extracted Feature Vector */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 pt-2 text-xs">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px]">行驶方向角 θ</span>
            <span className="text-amber-700 font-mono font-bold">{currentFeatures.heading}° (南偏东)</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px]">已行驶距离</span>
            <span className="text-slate-800 font-mono font-bold">{currentFeatures.distanceKm} km</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px]">已行驶耗时</span>
            <span className="text-slate-800 font-mono font-bold">{currentFeatures.elapsedMin} min</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px]">前缀平均速度</span>
            <span className="text-slate-800 font-mono font-bold">{currentFeatures.avgSpeedKmh} km/h</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            <span className="text-slate-500 block text-[10px]">起始时段</span>
            <span className="text-slate-800 font-mono font-bold">14:20 (工作日)</span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 col-span-2">
            <span className="text-slate-500 block text-[10px]">真实目的地 Ground Truth</span>
            <span className="text-emerald-700 font-mono font-bold truncate block">
              SFO 国际机场 (9q8vts)
            </span>
          </div>
        </div>
      </div>

      {/* 3 Model Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Model 1: Baseline */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800">① 起点频率基线 (Baseline)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                P(Dest|Origin)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              仅统计历史中从渔人码头出发的所有行程目的地概率，无法感知车头转向与行驶距离。
            </p>

            <div className="space-y-2">
              {baselinePredictions.map(p => (
                <div
                  key={p.rank}
                  className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 w-4">{p.rank}.</span>
                    <span className="text-slate-800 font-medium truncate max-w-[140px]">{p.gridName.split('(')[0]}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-slate-600">{p.prob}%</span>
                    {p.isTrue ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex justify-between items-center">
            <span className="text-slate-500">Top-1 距离误差:</span>
            <span className="font-mono text-rose-600 font-bold">21.8 km (判断失误)</span>
          </div>
        </div>

        {/* Model 2: Markov Chain */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-800">② 马尔可夫链网格转移 (Markov)</h4>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
                P(G_t|G_t-1)
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              依据上一跳网格至当前网格的一阶状态跃迁矩阵推断下一跳，具备局部邻域感知。
            </p>

            <div className="space-y-2">
              {markovPredictions.map(p => (
                <div
                  key={p.rank}
                  className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 w-4">{p.rank}.</span>
                    <span className="text-slate-800 font-medium truncate max-w-[140px]">{p.gridName.split('(')[0]}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-cyan-700 font-bold">{p.prob}%</span>
                    {p.isTrue ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex justify-between items-center">
            <span className="text-slate-500">Top-1 距离误差:</span>
            <span className="font-mono text-emerald-700 font-bold">0.0 km (命中真实网格)</span>
          </div>
        </div>

        {/* Model 3: Random Forest Multi-class */}
        <div className="bg-white border-2 border-cyan-400 rounded-xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 bg-cyan-600 text-white font-bold text-[10px] rounded-bl-lg shadow-xs">
            最佳综合模型
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-bold text-cyan-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-cyan-600" /> ③ 随机森林时空多分类
              </h4>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              全量综合方向角、累计里程、均速、前缀网格与起始时段特征，预测置信度最高。
            </p>

            <div className="space-y-2">
              {rfPredictions.map(p => (
                <div
                  key={p.rank}
                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                    p.isTrue
                      ? 'bg-cyan-50 border-cyan-300 shadow-2xs'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-slate-500 w-4">{p.rank}.</span>
                    <span className={`truncate max-w-[140px] ${p.isTrue ? 'text-cyan-900 font-bold' : 'text-slate-800'}`}>
                      {p.gridName.split('(')[0]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className="font-mono text-emerald-700 font-bold">{p.prob}%</span>
                    {p.isTrue ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-slate-500 font-mono">+{p.distErrKm}km</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs flex justify-between items-center">
            <span className="text-slate-500">Top-1 距离误差:</span>
            <span className="font-mono text-emerald-700 font-bold">0.0 km (精准命中)</span>
          </div>
        </div>
      </div>

      {/* Offline Benchmark Evaluation Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-cyan-600" />
            <h4 className="text-sm font-bold text-slate-800">
              全量测试集离线评估对比指标 (Top-1 / Top-5 / Top-10 准确率 & 平均距离误差)
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">测试集规模: 93,658 条行程</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-600 border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="py-3 px-4 font-semibold">预测模型</th>
                <th className="py-3 px-4 font-semibold">Top-1 准确率</th>
                <th className="py-3 px-4 font-semibold">Top-5 准确率</th>
                <th className="py-3 px-4 font-semibold">Top-10 准确率</th>
                <th className="py-3 px-4 font-semibold">平均地理距离误差</th>
                <th className="py-3 px-4 font-semibold">持久化模型文件</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {BENCHMARK_MODELS.map((m, idx) => {
                const isBest = idx === 2;
                return (
                  <tr
                    key={m.modelName}
                    className={`transition-colors ${isBest ? 'bg-cyan-50/50 hover:bg-cyan-50' : 'hover:bg-slate-50'}`}
                  >
                    <td className={`py-3 px-4 font-medium ${isBest ? 'text-cyan-800 font-bold' : 'text-slate-800'}`}>
                      {m.modelName}
                    </td>
                    <td className={`py-3 px-4 font-mono ${isBest ? 'text-cyan-700 font-bold' : 'text-slate-600'}`}>
                      {m.top1Acc}%
                    </td>
                    <td className={`py-3 px-4 font-mono ${isBest ? 'text-cyan-700 font-bold' : 'text-slate-600'}`}>
                      {m.top5Acc}%
                    </td>
                    <td className={`py-3 px-4 font-mono ${isBest ? 'text-cyan-700 font-bold' : 'text-slate-600'}`}>
                      {m.top10Acc}%
                    </td>
                    <td className={`py-3 px-4 font-mono ${isBest ? 'text-emerald-700 font-bold' : 'text-slate-600'}`}>
                      {m.meanDistanceErrorKm} km
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 flex items-center gap-1.5">
                      <FileCode className="w-3.5 h-3.5 text-slate-400" />
                      {m.savedFile}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
