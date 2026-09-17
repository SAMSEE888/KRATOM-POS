import { useState, useMemo } from 'react';
import {
  ArrowLeftRight,
  Calculator,
  Check,
  ChevronDown,
  ChevronUp,
  Droplet,
  PackagePlus,
  Percent,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { CostConfig, Product } from '../types';
import { calculateBmRecipe, calculateRedRecipe, calculateReverseRecipe } from '../utils/calculations';

interface MixingCalculatorProps {
  config: CostConfig;
  products: Product[];
  initialRawLiters?: number;
  initialFormula?: 'RED' | 'BM';
  onAddStockProduction: (payload: {
    productId: string;
    productName: string;
    formulaType: 'RED' | 'BM';
    quantity: number;
    lot: string;
    cost: number;
    notes: string;
  }) => Promise<boolean>;
}

export function MixingCalculator({
  config,
  products,
  initialRawLiters,
  initialFormula = 'RED',
  onAddStockProduction,
}: MixingCalculatorProps) {
  const [activeRecipe, setActiveRecipe] = useState<'RED' | 'BM'>(initialFormula);
  const [isReverseMode, setIsReverseMode] = useState(false);

  // Normal mode inputs
  const [rawInput, setRawInput] = useState<number>(initialRawLiters || 6);

  // Reverse mode inputs
  const [targetBottlesInput, setTargetBottlesInput] = useState<number>(20);

  // Parameter drawer toggle
  const [showRecipeSettings, setShowRecipeSettings] = useState(false);

  // Production recording state
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);
  const [stockAddedSuccess, setStockAddedSuccess] = useState(false);

  // Normal calculation
  const normalResult = useMemo(() => {
    if (activeRecipe === 'RED') {
      return calculateRedRecipe({ rawLiters: rawInput, config });
    } else {
      return calculateBmRecipe({ rawLiters: rawInput, config });
    }
  }, [activeRecipe, rawInput, config]);

  // Reverse calculation
  const reverseResult = useMemo(() => {
    return calculateReverseRecipe({
      targetBottles: targetBottlesInput,
      formulaType: activeRecipe,
      config,
    });
  }, [activeRecipe, targetBottlesInput, config]);

  const activeResult = isReverseMode ? reverseResult : normalResult;

  // Matching product for stock recording
  const matchedProduct = useMemo(() => {
    return (
      products.find((p) => p.formulaType === activeRecipe && p.bottleSizeMl === 1000) ||
      products[0]
    );
  }, [products, activeRecipe]);

  const handleRecordToStock = async () => {
    if (!matchedProduct || activeResult.bottlesProduced <= 0 || isSubmittingStock) return;

    setIsSubmittingStock(true);
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 5).replace(/:/g, '');
    const lotNumber = `LOT-${activeRecipe}-${dateStr}-${timeStr}`;

    const success = await onAddStockProduction({
      productId: matchedProduct.id,
      productName: matchedProduct.name,
      formulaType: activeRecipe,
      quantity: activeResult.bottlesProduced,
      lot: lotNumber,
      cost: activeResult.totalCost,
      notes: `ผลิตสูตร ${activeRecipe === 'RED' ? 'ฝาแดง' : 'BM'} น้ำดิบ ${activeResult.rawLiters}L, โค้ก ${activeResult.cokeLiters}L`,
    });

    setIsSubmittingStock(false);
    if (success) {
      setStockAddedSuccess(true);
      setTimeout(() => setStockAddedSuccess(false), 4000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 font-['Plus_Jakarta_Sans']">
            <Calculator className="w-6 h-6 text-emerald-400" />
            <span>เครื่องคิดเลขผสมสูตรพาณิชย์ & คำนวณย้อนกลับ</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            คำนวณสัดส่วนผสมสูตรฝาแดง (RED), สูตร BM (บ๊วย 9 เม็ด) และคำนวณย้อนกลับจากจำนวนขวด
          </p>
        </div>

        {/* Reverse Mode Toggle Pill */}
        <button
          onClick={() => setIsReverseMode(!isReverseMode)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all self-start sm:self-auto ${
            isReverseMode
              ? 'bg-amber-500 text-black border-amber-400 shadow-lg shadow-amber-500/25'
              : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          <span>{isReverseMode ? 'โหมด: คำนวณย้อนกลับ (Reverse)' : 'สลับเป็น: คำนวณย้อนกลับ'}</span>
        </button>
      </div>

      {/* Formula Selector Tabs (RED vs BM) */}
      <div className="grid grid-cols-2 gap-3">
        {/* RED TAB */}
        <button
          onClick={() => setActiveRecipe('RED')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeRecipe === 'RED'
              ? 'bg-rose-950/40 border-rose-500 shadow-lg shadow-rose-500/10'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
              สูตร 1 (ฝาแดง)
            </span>
            {activeRecipe === 'RED' && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </div>
          <div className="text-base font-bold text-white">สูตรฝาแดง (RED CAP)</div>
          <div className="text-xs text-slate-400 mt-1">
            น้ำดิบ 3L : โค้ก 1L : ยาแก้ไอฝาแดง 20ml
          </div>
        </button>

        {/* BM TAB */}
        <button
          onClick={() => setActiveRecipe('BM')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeRecipe === 'BM'
              ? 'bg-amber-950/40 border-amber-500 shadow-lg shadow-amber-500/10'
              : 'bg-white/[0.02] border-white/5 hover:border-white/10 opacity-70'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              สูตร 2 (บีเอ็ม)
            </span>
            {activeRecipe === 'BM' && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="text-base font-bold text-white">สูตร BM (บ๊วยเค็ม 9 เม็ด)</div>
          <div className="text-xs text-slate-400 mt-1">
            น้ำดิบ 3L : โค้ก 1L : ยาแก้ไอ BM 20ml : บ๊วย 9 เม็ด
          </div>
        </button>
      </div>

      {/* Main Calculation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Input */}
        <div className="lg:col-span-5 glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {isReverseMode
                  ? 'จำนวนขวดที่ต้องการผลิต (Target Bottles)'
                  : 'ปริมาณน้ำดิบที่ใช้ผสม (Raw Extract Liters)'}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
                {isReverseMode ? 'ขวด 1,000ml' : 'ลิตร'}
              </span>
            </div>

            {/* Input Element */}
            {isReverseMode ? (
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={targetBottlesInput}
                  onChange={(e) => setTargetBottlesInput(Math.max(1, Number(e.target.value)))}
                  className="w-full text-4xl font-extrabold font-mono text-white bg-black/50 border border-amber-500/30 rounded-2xl p-4 focus:outline-none focus:border-amber-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                  ขวด
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={rawInput}
                  onChange={(e) => setRawInput(Math.max(0.1, Number(e.target.value)))}
                  className="w-full text-4xl font-extrabold font-mono text-white bg-black/50 border border-emerald-500/30 rounded-2xl p-4 focus:outline-none focus:border-emerald-400"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-emerald-400">
                  LITERS
                </span>
              </div>
            )}

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 mt-4">
              <span className="text-[11px] text-slate-500 self-center">ค่าด่วน:</span>
              {isReverseMode
                ? [10, 20, 30, 50, 100].map((v) => (
                    <button
                      key={v}
                      onClick={() => setTargetBottlesInput(v)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                        targetBottlesInput === v
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {v} ขวด
                    </button>
                  ))
                : [3, 6, 9, 12, 18, 24].map((v) => (
                    <button
                      key={v}
                      onClick={() => setRawInput(v)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono border transition-colors ${
                        rawInput === v
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {v} ลิตร
                    </button>
                  ))}
            </div>
          </div>

          {/* Recipe Proportion Summary Card */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 text-xs space-y-2">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>สัดส่วนผสมทางการค้า:</span>
              <span className="text-emerald-400 font-mono">
                {activeRecipe === 'RED' ? '3 : 1 : 20ml' : '3 : 1 : 20ml : 9 เม็ด'}
              </span>
            </div>
            <div className="text-slate-400 text-[11px] leading-relaxed">
              {activeRecipe === 'RED'
                ? 'สูตรฝาแดงแท้ ใช้น้ำดิบสกัด 3 ลิตร ต่อน้ำโค้ก 1 ลิตร และยาแก้ไอฝาแดง 20 มล.'
                : 'สูตร BM แท้ ใช้น้ำดิบ 3 ลิตร ต่อน้ำโค้ก 1 ลิตร ยาแก้ไอ BM 20 มล. และเม็ดบ๊วย 9 เม็ด'}
            </div>
          </div>
        </div>

        {/* Right: Required Ingredients & Output Results */}
        <div className="lg:col-span-7 glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>
                {isReverseMode ? 'วัตถุดิบที่ต้องใช้สำหรับผลิต' : 'ส่วนผสมที่ต้องใช้ & ผลผลิต'}
              </span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-bold font-mono">
              ผลผลิต: {activeResult.bottlesProduced} ขวด
            </span>
          </div>

          {/* Ingredients Grid */}
          <div className={`grid gap-3 ${activeRecipe === 'BM' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
            {/* Raw Extract */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="text-[11px] text-slate-400 block">น้ำดิบสกัด</span>
              <div className="text-xl font-mono font-extrabold text-emerald-400 mt-1">
                {activeResult.rawLiters}
              </div>
              <span className="text-[10px] text-slate-500">ลิตร</span>
            </div>

            {/* Coke */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="text-[11px] text-slate-400 block">น้ำโค้ก</span>
              <div className="text-xl font-mono font-extrabold text-white mt-1">
                {activeResult.cokeLiters}
              </div>
              <span className="text-[10px] text-slate-500">ลิตร</span>
            </div>

            {/* Syrup */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
              <span className="text-[11px] text-slate-400 block">
                {activeRecipe === 'RED' ? 'ฝาแดง' : 'ยาแก้ไอ BM'}
              </span>
              <div className="text-xl font-mono font-extrabold text-rose-400 mt-1">
                {activeResult.syrupMl}
              </div>
              <span className="text-[10px] text-slate-500">มิลลิลิตร (ml)</span>
            </div>

            {/* Plums (If BM) */}
            {activeRecipe === 'BM' && (
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-center">
                <span className="text-[11px] text-slate-400 block">เม็ดบ๊วย</span>
                <div className="text-xl font-mono font-extrabold text-amber-400 mt-1">
                  {activeResult.plumCount || 0}
                </div>
                <span className="text-[10px] text-slate-500">เม็ด</span>
              </div>
            )}
          </div>

          {/* Detailed Financial Breakdown (Cost & ROI Margin) */}
          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-2.5 text-xs">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pb-2.5 border-b border-white/10">
              <div>
                <span className="text-slate-400 text-[11px] block">ปริมาตรผสมรวม</span>
                <span className="text-sm font-mono font-bold text-white">
                  {activeResult.totalVolumeLiters} ลิตร
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">ต้นทุนเฉลี่ย/ขวด</span>
                <span className="text-sm font-mono font-bold text-amber-400">
                  ฿{activeResult.costPerBottle}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">ราคาขาย/ขวด</span>
                <span className="text-sm font-mono font-bold text-white">
                  ฿{activeResult.sellingPrice}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">กำไรสุทธิ/ขวด</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  ฿{(activeResult.sellingPrice - activeResult.costPerBottle).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Cost Breakdown list */}
            <div className="space-y-1 text-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span>ต้นทุนน้ำดิบ: ฿{activeResult.rawCost.toLocaleString()}</span>
                <span>ต้นทุนโค้ก: ฿{activeResult.cokeCost.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>ต้นทุนยาแก้ไอ: ฿{activeResult.syrupCost.toLocaleString()}</span>
                {activeRecipe === 'BM' ? (
                  <span>ต้นทุนบ๊วย: ฿{activeResult.plumCost.toLocaleString()}</span>
                ) : (
                  <span>ค่าขวด/สติกเกอร์: ฿{activeResult.packagingCost.toLocaleString()}</span>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <span className="text-slate-400">ต้นทุนวัตถุดิบรวม: </span>
                <span className="font-mono font-bold text-white">
                  ฿{activeResult.totalCost.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">ยอดขายคาดการณ์: </span>
                <span className="font-mono font-bold text-emerald-400">
                  ฿{activeResult.revenue.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-slate-400">อัตรากำไร (Margin): </span>
                <span className="font-mono font-bold text-emerald-400">
                  {activeResult.marginPercent}% (ROI {activeResult.roiPercent}%)
                </span>
              </div>
            </div>
          </div>

          {/* Forward to Inventory Production Button */}
          <div className="pt-2">
            <button
              id="btn-add-production-stock"
              onClick={handleRecordToStock}
              disabled={activeResult.bottlesProduced <= 0 || isSubmittingStock}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmittingStock ? (
                <span>กำลังบันทึกเข้าสต๊อก...</span>
              ) : stockAddedSuccess ? (
                <>
                  <Check className="w-5 h-5 text-black" />
                  <span>บันทึกสินค้าเข้าสต๊อกเรียบร้อยแล้ว!</span>
                </>
              ) : (
                <>
                  <PackagePlus className="w-5 h-5 text-black" />
                  <span>
                    บันทึกเข้าสต๊อกสินค้าทันที ({activeResult.bottlesProduced} ขวด)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
