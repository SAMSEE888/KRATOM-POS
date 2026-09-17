import { useState, useMemo } from 'react';
import {
  ArrowRight,
  Calculator,
  ChevronDown,
  ChevronUp,
  Droplet,
  Flame,
  Layers,
  Leaf,
  Settings2,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { CostConfig } from '../types';
import { calculateBoiling } from '../utils/calculations';

interface BoilingCalculatorProps {
  config: CostConfig;
  onUpdateConfig: (newConfig: CostConfig) => void;
  onForwardToMixing: (payload: { formula: 'RED' | 'BM' | 'SPLIT'; rawLiters: number }) => void;
}

export function BoilingCalculator({
  config,
  onUpdateConfig,
  onForwardToMixing,
}: BoilingCalculatorProps) {
  const [inputMode, setInputMode] = useState<'LEAF' | 'WATER' | 'EXTRACT'>('LEAF');
  const [inputValue, setInputValue] = useState<number>(1);
  const [showConfigDrawer, setShowConfigDrawer] = useState(false);

  // Local config adjustments
  const [boilRatio, setBoilRatio] = useState(config.boilRatioWaterToLeaf || 22);
  const [extractPercent, setExtractPercent] = useState(config.boilExtractPercent || 80);
  const [leafPrice, setLeafPrice] = useState(config.leafCostPerKg || 100);
  const [overheadPrice, setOverheadPrice] = useState(config.overheadCostPerBottle || 2);

  const currentConfig: CostConfig = useMemo(
    () => ({
      ...config,
      boilRatioWaterToLeaf: boilRatio,
      boilExtractPercent: extractPercent,
      leafCostPerKg: leafPrice,
      overheadCostPerBottle: overheadPrice,
    }),
    [config, boilRatio, extractPercent, leafPrice, overheadPrice]
  );

  const result = useMemo(() => {
    return calculateBoiling({
      mode: inputMode,
      value: inputValue,
      config: currentConfig,
    });
  }, [inputMode, inputValue, currentConfig]);

  const handleSaveConfigChanges = () => {
    onUpdateConfig(currentConfig);
    setShowConfigDrawer(false);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Title & Introduction */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
            <Flame className="w-6 h-6 text-amber-400" />
            <span>เครื่องคิดเลขต้มน้ำดิบ (Boiling & Extraction)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            คำนวณสัดส่วนแบบ 3 ทิศทางอัจฉริยะ (ใบกระท่อม ↔ น้ำเปล่า ↔ น้ำดิบสกัดได้) พร้อมวิเคราะห์ต้นทุน
          </p>
        </div>

        <button
          onClick={() => setShowConfigDrawer(!showConfigDrawer)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold text-slate-300 transition-all self-start sm:self-auto"
        >
          <Settings2 className="w-4 h-4 text-emerald-400" />
          <span>ตั้งค่าสัดส่วนต้ม</span>
          {showConfigDrawer ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expandable Parameters Drawer */}
      {showConfigDrawer && (
        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 animate-in fade-in space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>ปรับแต่งอัตราส่วนการต้ม & ต้นทุนมาตรฐาน</span>
            </h4>
            <span className="text-[11px] text-slate-400">มีผลต่อการคำนวณทั้งระบบ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                อัตราส่วนต้ม (น้ำ : ใบ 1 กก.)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={boilRatio}
                  onChange={(e) => setBoilRatio(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
                <span className="text-slate-400 shrink-0">ลิตร/กก.</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                % การสกัด (% Extract)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={extractPercent}
                  onChange={(e) => setExtractPercent(Number(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
                <span className="text-slate-400 shrink-0">%</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                ราคาใบกระท่อม (บาท/กก.)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={leafPrice}
                  onChange={(e) => setLeafPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
                <span className="text-slate-400 shrink-0">บาท</span>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">
                ค่าแฝง แก๊ส/ไฟ (บาท/ขวด)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={overheadPrice}
                  onChange={(e) => setOverheadPrice(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
                <span className="text-slate-400 shrink-0">บาท</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <button
              onClick={() => {
                setBoilRatio(22);
                setExtractPercent(80);
                setLeafPrice(100);
                setOverheadPrice(2);
              }}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
            >
              คืนค่ามาตรฐาน (Default 22:1, 80%)
            </button>
            <button
              onClick={handleSaveConfigChanges}
              className="px-4 py-1.5 rounded-lg bg-emerald-500 text-black font-semibold text-xs hover:bg-emerald-400 transition-colors"
            >
              บันทึกค่าสัดส่วน
            </button>
          </div>
        </div>
      )}

      {/* 3-Way Mode Selector Tabs */}
      <div className="glass-panel p-1.5 rounded-2xl border border-white/10 grid grid-cols-3 gap-1">
        <button
          onClick={() => setInputMode('LEAF')}
          className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            inputMode === 'LEAF'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Leaf className="w-4 h-4" />
          <span>1. ป้อนน้ำหนักใบกระท่อม</span>
        </button>

        <button
          onClick={() => setInputMode('WATER')}
          className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            inputMode === 'WATER'
              ? 'bg-sky-500 text-black shadow-lg shadow-sky-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Droplet className="w-4 h-4" />
          <span>2. ป้อนปริมาณน้ำเปล่า</span>
        </button>

        <button
          onClick={() => setInputMode('EXTRACT')}
          className={`py-3 px-2 rounded-xl text-xs sm:text-sm font-semibold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
            inputMode === 'EXTRACT'
              ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>3. ป้อนน้ำดิบที่ต้องการ</span>
        </button>
      </div>

      {/* Main Input Control & Dynamic Ratio Visualizer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        {/* Input Card */}
        <div className="md:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">
              {inputMode === 'LEAF'
                ? 'น้ำหนักใบกระท่อมสด (กิโลกรัม)'
                : inputMode === 'WATER'
                ? 'ปริมาณน้ำเปล่าที่ใส่ในหม้อต้ม (ลิตร)'
                : 'ปริมาณน้ำดิบสกัดที่ต้องการได้ (ลิตร)'}
            </span>

            <div className="mt-3 relative">
              <input
                id="input-boil-value"
                type="number"
                min="0.1"
                step="0.1"
                value={inputValue}
                onChange={(e) => setInputValue(Math.max(0, Number(e.target.value)))}
                className="w-full text-4xl font-extrabold font-mono text-white bg-black/50 border border-white/10 rounded-2xl p-4 focus:outline-none focus:border-emerald-400/50"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                {inputMode === 'LEAF' ? 'KG' : 'LITERS'}
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[11px] text-slate-500 self-center">ค่าแนะนำ:</span>
              {[1, 2, 3, 5, 10].map((val) => (
                <button
                  key={val}
                  onClick={() => setInputValue(val)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-colors ${
                    inputValue === val
                      ? 'bg-white/20 border-white/30 text-white'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  {val} {inputMode === 'LEAF' ? 'กก.' : 'ลิตร'}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>อัตราส่วนต้มมาตรฐาน:</span>
              <span className="font-mono text-white font-semibold">1 กก. : {boilRatio} ลิตร</span>
            </div>
            <div className="flex justify-between">
              <span>อัตราการสกัด (% Yield):</span>
              <span className="font-mono text-emerald-400 font-semibold">{extractPercent}%</span>
            </div>
          </div>
        </div>

        {/* 3-Way Proportion Results Card */}
        <div className="md:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>ผลการคำนวณสัดส่วน 3 ทิศทาง</span>
          </h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            {/* 1. Leaf */}
            <div className={`p-4 rounded-xl border ${inputMode === 'LEAF' ? 'bg-emerald-950/40 border-emerald-500/40' : 'bg-white/[0.03] border-white/5'}`}>
              <Leaf className="w-5 h-5 mx-auto mb-1 text-emerald-400" />
              <span className="text-[11px] text-slate-400 block">ใบกระท่อม</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1">
                {result.leafKg}
              </div>
              <span className="text-[10px] text-slate-500">กิโลกรัม</span>
            </div>

            {/* 2. Water */}
            <div className={`p-4 rounded-xl border ${inputMode === 'WATER' ? 'bg-sky-950/40 border-sky-500/40' : 'bg-white/[0.03] border-white/5'}`}>
              <Droplet className="w-5 h-5 mx-auto mb-1 text-sky-400" />
              <span className="text-[11px] text-slate-400 block">น้ำเปล่า</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-white mt-1">
                {result.waterLiters}
              </div>
              <span className="text-[10px] text-slate-500">ลิตร</span>
            </div>

            {/* 3. Raw Extract */}
            <div className={`p-4 rounded-xl border ${inputMode === 'EXTRACT' ? 'bg-amber-950/40 border-amber-500/40' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
              <Flame className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <span className="text-[11px] text-emerald-300 font-semibold block">น้ำดิบสกัดได้</span>
              <div className="text-xl sm:text-2xl font-extrabold font-mono text-emerald-400 mt-1">
                {result.extractLiters}
              </div>
              <span className="text-[10px] text-emerald-300/70 font-semibold">ลิตรบริสุทธิ์</span>
            </div>
          </div>

          {/* Cost Breakdown & Unit Economics */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>ต้นทุนใบกระท่อม ({result.leafKg} กก. x ฿{leafPrice}):</span>
              <span className="font-mono text-white font-semibold">฿{result.leafCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ค่าแก๊ส/ไฟ/ค่าแฝง (ประมาณการ):</span>
              <span className="font-mono text-white">฿{result.overheadCost.toLocaleString()}</span>
            </div>
            <div className="pt-2 border-t border-white/10 flex justify-between items-baseline font-bold text-sm">
              <span className="text-white">รวมต้นทุนการต้มน้ำดิบ:</span>
              <span className="text-emerald-400 font-mono text-base">฿{result.totalCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-400 pt-1">
              <span>ต้นทุนเฉลี่ยต่อน้ำดิบ 1 ลิตร:</span>
              <span className="font-mono text-emerald-300 font-bold">฿{result.costPerLiterRaw} / ลิตร</span>
            </div>
          </div>
        </div>
      </div>

      {/* FORWARDING ENGINE (Action Buttons to Mixing Calculator) */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/20 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Forwarding Engine (ส่งต่อน้ำดิบสกัดได้เข้าเครื่องคิดเลขผสมสูตร)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ส่งต่อน้ำดิบจำนวน <span className="text-emerald-400 font-bold font-mono">{result.extractLiters} ลิตร</span> ไปคำนวณสัดส่วนโค้ก ยาแก้ไอ และบ๊วยในคลิกเดียว
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 font-mono font-bold">
            พร้อมส่งต่อ: {result.extractLiters}L
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Forward to RED */}
          <button
            id="btn-forward-red"
            disabled={result.extractLiters <= 0}
            onClick={() => onForwardToMixing({ formula: 'RED', rawLiters: result.extractLiters })}
            className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 hover:bg-rose-900/50 hover:border-rose-400 text-left transition-all group disabled:opacity-40"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                สูตรฝาแดง (RED)
              </span>
              <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-sm font-bold text-white">ส่งเข้าสูตรฝาแดง 100%</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              น้ำดิบ {result.extractLiters} ลิตร
            </div>
          </button>

          {/* Forward to BM */}
          <button
            id="btn-forward-bm"
            disabled={result.extractLiters <= 0}
            onClick={() => onForwardToMixing({ formula: 'BM', rawLiters: result.extractLiters })}
            className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 hover:bg-amber-900/50 hover:border-amber-400 text-left transition-all group disabled:opacity-40"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                สูตร BM (บ๊วย)
              </span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-sm font-bold text-white">ส่งเข้าสูตร BM 100%</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              น้ำดิบ {result.extractLiters} ลิตร
            </div>
          </button>

          {/* Forward 50/50 Split */}
          <button
            id="btn-forward-split"
            disabled={result.extractLiters <= 0}
            onClick={() => onForwardToMixing({ formula: 'SPLIT', rawLiters: result.extractLiters })}
            className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 hover:bg-emerald-900/50 hover:border-emerald-400 text-left transition-all group disabled:opacity-40"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                แบ่งสัดส่วน 50 / 50
              </span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
            <div className="text-sm font-bold text-white">แบ่งเข้าทั้ง 2 สูตรเท่ากัน</div>
            <div className="text-[11px] text-slate-400 mt-1 font-mono">
              สูตรละ {(result.extractLiters / 2).toFixed(1)} ลิตร
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
