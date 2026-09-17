import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Calendar,
  DollarSign,
  Filter,
  Flame,
  LineChart as LineChartIcon,
  Percent,
  PieChart,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { CostConfig, ExpenseItem, Product, StockLog } from '../types';
import { calculateBiSummary } from '../utils/calculations';

// Register Chart.js components once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface AnalyticsViewProps {
  stockLogs: StockLog[];
  expenses: ExpenseItem[];
  products: Product[];
  config: CostConfig;
}

export function AnalyticsView({
  stockLogs,
  expenses,
  products,
  config,
}: AnalyticsViewProps) {
  // Filters State
  const [dateFilter, setDateFilter] = useState<
    'TODAY' | 'YESTERDAY' | '7DAYS' | 'THIS_MONTH' | 'LAST_MONTH' | 'ALL' | 'CUSTOM'
  >('7DAYS');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [formulaFilter, setFormulaFilter] = useState<string>('ALL');
  const [productFilter, setProductFilter] = useState<string>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');

  // Canvas Refs for Chart.js
  const lineChartRef = useRef<HTMLCanvasElement | null>(null);
  const formulaDoughnutRef = useRef<HTMLCanvasElement | null>(null);
  const expenseDoughnutRef = useRef<HTMLCanvasElement | null>(null);
  const histogramRef = useRef<HTMLCanvasElement | null>(null);
  const compareBarRef = useRef<HTMLCanvasElement | null>(null);

  // Active instances refs
  const chartInstances = useRef<{ [key: string]: ChartJS | null }>({});

  // Compute BI Summary
  const summary = useMemo(() => {
    return calculateBiSummary({
      stockLogs,
      expenses,
      config,
      dateFilter,
      customStartDate,
      customEndDate,
      formulaFilter,
      productFilter,
      paymentFilter,
    });
  }, [
    stockLogs,
    expenses,
    config,
    dateFilter,
    customStartDate,
    customEndDate,
    formulaFilter,
    productFilter,
    paymentFilter,
  ]);

  // Product Comparison Data
  const productComparison = useMemo(() => {
    const map: {
      [id: string]: {
        product: Product;
        volume: number;
        revenue: number;
        cost: number;
      };
    } = {};

    products.forEach((p) => {
      map[p.id] = { product: p, volume: 0, revenue: 0, cost: 0 };
    });

    stockLogs.forEach((log) => {
      if (log.type === 'OUT' && map[log.productId]) {
        map[log.productId].volume += log.quantity || 0;
        map[log.productId].revenue += log.totalPrice || 0;
        map[log.productId].cost += log.cost || 0;
      }
    });

    const totalRev = summary.revenue || 1;
    return Object.values(map)
      .map((item) => ({
        ...item,
        revenueShare: Number(((item.revenue / totalRev) * 100).toFixed(1)),
        estProfit: Number((item.revenue - item.cost).toFixed(2)),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [products, stockLogs, summary.revenue]);

  // Daily Trend Data for Line Chart
  const trendData = useMemo(() => {
    const revMap: { [date: string]: number } = {};
    const expMap: { [date: string]: number } = {};

    // Populate past 7-10 days
    const allDates = new Set<string>();

    stockLogs.forEach((log) => {
      if (log.type === 'OUT') {
        const d = new Date(log.timestamp).toISOString().split('T')[0];
        revMap[d] = (revMap[d] || 0) + (log.totalPrice || 0);
        allDates.add(d);
      }
    });

    expenses.forEach((exp) => {
      const d = new Date(exp.timestamp).toISOString().split('T')[0];
      expMap[d] = (expMap[d] || 0) + (exp.amount || 0);
      allDates.add(d);
    });

    const sortedDates = Array.from(allDates).sort();
    return {
      labels: sortedDates.map((d) => d.slice(5)), // MM-DD
      revenue: sortedDates.map((d) => revMap[d] || 0),
      expenses: sortedDates.map((d) => expMap[d] || 0),
    };
  }, [stockLogs, expenses]);

  // Formula Breakdown for Doughnut 1
  const formulaBreakdown = useMemo(() => {
    let redRev = 0;
    let bmRev = 0;
    let otherRev = 0;

    stockLogs.forEach((log) => {
      if (log.type === 'OUT') {
        if (log.formulaType === 'RED') redRev += log.totalPrice || 0;
        else if (log.formulaType === 'BM') bmRev += log.totalPrice || 0;
        else otherRev += log.totalPrice || 0;
      }
    });

    return {
      labels: ['สูตรฝาแดง (RED)', 'สูตร BM (บ๊วย)', 'น้ำดิบ/อื่นๆ'],
      data: [redRev, bmRev, otherRev],
    };
  }, [stockLogs]);

  // Expense Breakdown for Doughnut 2
  const expenseBreakdown = useMemo(() => {
    const catMap: { [cat: string]: number } = {};
    expenses.forEach((exp) => {
      catMap[exp.category] = (catMap[exp.category] || 0) + exp.amount;
    });

    const labels = Object.keys(catMap);
    const data = Object.values(catMap);
    return { labels, data };
  }, [expenses]);

  // Histogram Data (Daily Sales Volume Distribution)
  const histogramData = useMemo(() => {
    const dailyBottlesMap: { [date: string]: number } = {};
    stockLogs.forEach((log) => {
      if (log.type === 'OUT') {
        const d = new Date(log.timestamp).toISOString().split('T')[0];
        dailyBottlesMap[d] = (dailyBottlesMap[d] || 0) + (log.quantity || 0);
      }
    });

    const values = Object.values(dailyBottlesMap);
    // Bins: 1-10, 11-20, 21-30, 31-40, 40+
    const bins = [0, 0, 0, 0, 0];
    values.forEach((v) => {
      if (v <= 10) bins[0]++;
      else if (v <= 20) bins[1]++;
      else if (v <= 30) bins[2]++;
      else if (v <= 40) bins[3]++;
      else bins[4]++;
    });

    return {
      labels: ['1-10 ขวด', '11-20 ขวด', '21-30 ขวด', '31-40 ขวด', '40+ ขวด'],
      data: bins,
    };
  }, [stockLogs]);

  // Comparative Product Bar Chart Data (RED vs BM)
  const compareData = useMemo(() => {
    const redItem = productComparison.find((p) => p.product.formulaType === 'RED');
    const bmItem = productComparison.find((p) => p.product.formulaType === 'BM');

    return {
      labels: ['ยอดขาย (ขวด)', 'รายได้ (ร้อยบาท)', 'กำไรสุทธิ (ร้อยบาท)'],
      red: [
        redItem?.volume || 0,
        Number(((redItem?.revenue || 0) / 100).toFixed(1)),
        Number(((redItem?.estProfit || 0) / 100).toFixed(1)),
      ],
      bm: [
        bmItem?.volume || 0,
        Number(((bmItem?.revenue || 0) / 100).toFixed(1)),
        Number(((bmItem?.estProfit || 0) / 100).toFixed(1)),
      ],
    };
  }, [productComparison]);

  // Initialize and update Chart.js Charts
  useEffect(() => {
    // 1. Line Chart: Revenue vs Expenses Trend
    if (lineChartRef.current) {
      if (chartInstances.current.line) chartInstances.current.line.destroy();
      chartInstances.current.line = new ChartJS(lineChartRef.current, {
        type: 'line',
        data: {
          labels: trendData.labels,
          datasets: [
            {
              label: 'รายได้รวม (฿)',
              data: trendData.revenue,
              borderColor: '#34d399',
              backgroundColor: 'rgba(52, 211, 153, 0.12)',
              tension: 0.35,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
            {
              label: 'รายจ่ายรวม (฿)',
              data: trendData.expenses,
              borderColor: '#f43f5e',
              backgroundColor: 'rgba(244, 63, 94, 0.08)',
              tension: 0.35,
              fill: true,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#94a3b8', font: { family: 'Plus Jakarta Sans', size: 11 } },
            },
            tooltip: {
              backgroundColor: 'rgba(5, 6, 8, 0.9)',
              titleColor: '#fff',
              bodyColor: '#34d399',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 10 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 10 } },
            },
          },
        },
      });
    }

    // 2. Doughnut Chart: Formula Breakdown
    if (formulaDoughnutRef.current) {
      if (chartInstances.current.formula) chartInstances.current.formula.destroy();
      chartInstances.current.formula = new ChartJS(formulaDoughnutRef.current, {
        type: 'doughnut',
        data: {
          labels: formulaBreakdown.labels,
          datasets: [
            {
              data: formulaBreakdown.data,
              backgroundColor: ['#f43f5e', '#f59e0b', '#38bdf8'],
              borderColor: '#0d1117',
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#cbd5e1', font: { size: 11 } },
            },
          },
          cutout: '70%',
        },
      });
    }

    // 3. Doughnut Chart: Expense Breakdown
    if (expenseDoughnutRef.current) {
      if (chartInstances.current.expense) chartInstances.current.expense.destroy();
      chartInstances.current.expense = new ChartJS(expenseDoughnutRef.current, {
        type: 'doughnut',
        data: {
          labels: expenseBreakdown.labels,
          datasets: [
            {
              data: expenseBreakdown.data,
              backgroundColor: [
                '#10b981',
                '#f43f5e',
                '#3b82f6',
                '#eab308',
                '#8b5cf6',
                '#ec4899',
                '#06b6d4',
                '#64748b',
              ],
              borderColor: '#0d1117',
              borderWidth: 3,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#cbd5e1', font: { size: 10 } },
            },
          },
          cutout: '65%',
        },
      });
    }

    // 4. Histogram: Daily Volume Distribution
    if (histogramRef.current) {
      if (chartInstances.current.histogram) chartInstances.current.histogram.destroy();
      chartInstances.current.histogram = new ChartJS(histogramRef.current, {
        type: 'bar',
        data: {
          labels: histogramData.labels,
          datasets: [
            {
              label: 'จำนวนวันที่มีการขายอยู่ในช่วงนี้',
              data: histogramData.data,
              backgroundColor: '#a78bfa',
              borderRadius: 8,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 10 }, stepSize: 1 },
            },
          },
        },
      });
    }

    // 5. Comparative Product Performance (ฝาแดง vs BM)
    if (compareBarRef.current) {
      if (chartInstances.current.compare) chartInstances.current.compare.destroy();
      chartInstances.current.compare = new ChartJS(compareBarRef.current, {
        type: 'bar',
        data: {
          labels: compareData.labels,
          datasets: [
            {
              label: 'สูตรฝาแดง (RED)',
              data: compareData.red,
              backgroundColor: '#f43f5e',
              borderRadius: 6,
            },
            {
              label: 'สูตร BM (บ๊วย)',
              data: compareData.bm,
              backgroundColor: '#f59e0b',
              borderRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              labels: { color: '#cbd5e1', font: { size: 11 } },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 10 } },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.05)' },
              ticks: { color: '#64748b', font: { size: 10 } },
            },
          },
        },
      });
    }

    return () => {
      (Object.values(chartInstances.current) as (ChartJS | null)[]).forEach((inst) => inst?.destroy());
    };
  }, [trendData, formulaBreakdown, expenseBreakdown, histogramData, compareData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header & Dynamic Date Filter Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <span>ระบบวิเคราะห์ธุรกิจเชิงลึก (Advanced BI Analytics)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Financial KPIs, สถิติขั้นสูง, 5 กราฟอินเทอร์แอคทีฟ (Chart.js) และการวิเคราะห์ Regression & Trend
          </p>
        </div>

        {/* Dynamic Date Filter Tabs */}
        <div className="glass-panel p-1 rounded-xl border border-white/10 flex flex-wrap gap-1">
          {[
            { id: 'TODAY', label: 'วันนี้' },
            { id: 'YESTERDAY', label: 'เมื่อวาน' },
            { id: '7DAYS', label: '7 วัน' },
            { id: 'THIS_MONTH', label: 'เดือนนี้' },
            { id: 'LAST_MONTH', label: 'เดือนที่แล้ว' },
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'CUSTOM', label: 'กำหนดเอง' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setDateFilter(item.id as typeof dateFilter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                dateFilter === item.id
                  ? 'bg-emerald-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Picker Drawer */}
      {dateFilter === 'CUSTOM' && (
        <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 flex flex-wrap items-center gap-4 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">จากวันที่:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-mono"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">ถึงวันที่:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white font-mono"
            />
          </div>
        </div>
      )}

      {/* Advanced Secondary Filters */}
      <div className="glass-panel p-3 rounded-xl border border-white/10 flex flex-wrap items-center gap-3 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-semibold">
          <Filter className="w-3.5 h-3.5 text-emerald-400" />
          <span>ตัวกรองละเอียด:</span>
        </span>

        {/* Formula */}
        <select
          value={formulaFilter}
          onChange={(e) => setFormulaFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white"
        >
          <option value="ALL">ทุกประเภทสูตร</option>
          <option value="RED">สูตรฝาแดง (RED)</option>
          <option value="BM">สูตร BM (บ๊วย)</option>
        </select>

        {/* Product */}
        <select
          value={productFilter}
          onChange={(e) => setProductFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white"
        >
          <option value="ALL">ทุกสินค้าในร้าน</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* Payment */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-white"
        >
          <option value="ALL">ทุกช่องทางชำระ</option>
          <option value="CASH">เงินสด (CASH)</option>
          <option value="TRANSFER">โอนเงิน (TRANSFER)</option>
        </select>
      </div>

      {/* 1. PRIMARY KPIs (6 Cards) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Primary Business KPIs</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Revenue */}
          <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20">
            <span className="text-[11px] text-slate-400 block font-medium">ยอดขายรวม (Revenue)</span>
            <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
              ฿{summary.revenue.toLocaleString()}
            </div>
            <span className="text-[10px] text-emerald-400/80 flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>+{summary.stats.growthRatePercent}% แนวโน้ม</span>
            </span>
          </div>

          {/* Expenses */}
          <div className="glass-panel p-4 rounded-2xl border border-rose-500/20">
            <span className="text-[11px] text-slate-400 block font-medium">รายจ่ายรวม (Expenses)</span>
            <div className="text-xl font-extrabold text-rose-400 font-mono mt-1">
              ฿{summary.expenses.toLocaleString()}
            </div>
            <span className="text-[10px] text-rose-400/80 mt-1 block">
              สัดส่วน {summary.expenseRatioPercent}%
            </span>
          </div>

          {/* Net Profit */}
          <div className={`glass-panel p-4 rounded-2xl border ${
            summary.netProfit >= 0 ? 'border-emerald-500/40 bg-emerald-950/20' : 'border-rose-500/40'
          }`}>
            <span className="text-[11px] text-slate-300 block font-medium">กำไรสุทธิ (Net Profit)</span>
            <div className={`text-xl font-extrabold font-mono mt-1 ${
              summary.netProfit >= 0 ? 'text-emerald-300' : 'text-rose-400'
            }`}>
              ฿{summary.netProfit.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              Net Margin {summary.netMarginPercent}%
            </span>
          </div>

          {/* Volume */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10">
            <span className="text-[11px] text-slate-400 block font-medium">ปริมาณขาย (Volume)</span>
            <div className="text-xl font-extrabold text-white font-mono mt-1">
              {summary.totalVolumeBottles} <span className="text-xs font-sans text-slate-400">ขวด</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">
              {summary.totalBills} รายการบิล
            </span>
          </div>

          {/* Break-Even Bottles */}
          <div className="glass-panel p-4 rounded-2xl border border-amber-500/20">
            <span className="text-[11px] text-slate-400 block font-medium">จุดคุ้มทุน (Break-Even)</span>
            <div className="text-xl font-extrabold text-amber-400 font-mono mt-1">
              {summary.breakEvenBottles} <span className="text-xs font-sans text-slate-400">ขวด</span>
            </div>
            <span className="text-[10px] text-amber-300/80 mt-1 block">
              วันละ ~{summary.breakEvenBottlesPerDay} ขวด
            </span>
          </div>

          {/* ATV */}
          <div className="glass-panel p-4 rounded-2xl border border-sky-500/20">
            <span className="text-[11px] text-slate-400 block font-medium">ยอดเฉลี่ย/บิล (ATV)</span>
            <div className="text-xl font-extrabold text-sky-400 font-mono mt-1">
              ฿{summary.averageTransactionValue}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              ฿{summary.revenuePerBottle}/ขวด
            </span>
          </div>
        </div>
      </div>

      {/* 2. FINANCIAL & OPERATIONAL KPIs (Split 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Financial KPIs */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>ตัวชี้วัดทางการเงิน (Financial KPIs)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">Gross Margin %</span>
              <span className="text-base font-bold text-white font-mono">{summary.grossMarginPercent}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">Net Margin %</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{summary.netMarginPercent}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">Contrib. Margin</span>
              <span className="text-base font-bold text-white font-mono">{summary.contributionMarginPercent}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">Margin of Safety</span>
              <span className="text-base font-bold text-emerald-400 font-mono">{summary.marginOfSafetyPercent}%</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">ต้นทุนเฉลี่ย/ขวด</span>
              <span className="text-base font-bold text-amber-400 font-mono">฿{summary.costPerBottle}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">ราคาขายเฉลี่ย/ขวด</span>
              <span className="text-base font-bold text-white font-mono">฿{summary.revenuePerBottle}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">กำไรเฉลี่ย/ขวด</span>
              <span className="text-base font-bold text-emerald-400 font-mono">฿{summary.profitPerBottle}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">ประมาณการ COGS</span>
              <span className="text-base font-bold text-white font-mono">฿{summary.estimatedCogs.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Operational KPIs & Trend Insights */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
            <Activity className="w-4 h-4 text-sky-400" />
            <span>ตัวชี้วัดการดำเนินงาน & ความแม่นยำ (Operational & Trends)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">รอบหมุนเวียนสต๊อก</span>
              <span className="text-base font-bold text-white font-mono">{summary.inventoryTurnover} เท่า</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">วันขายสต๊อก (DSI)</span>
              <span className="text-base font-bold text-sky-400 font-mono">{summary.daysSalesOfInventory} วัน</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
              <span className="text-slate-400 text-[11px] block">สัดส่วนค่าใช้จ่าย</span>
              <span className="text-base font-bold text-white font-mono">{summary.expenseRatioPercent}%</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/5 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300">
              <span>ความแม่นยำทางสถิติของแนวโน้ม (R²):</span>
              <span className="font-mono font-bold text-emerald-400">{summary.stats.rSquared}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>ช่วงเวลาขายดีที่สุด (Peak Hour):</span>
              <span className="font-mono font-bold text-amber-400">{summary.peakHour}</span>
            </div>
            {summary.top3Days.length > 0 && (
              <div className="flex justify-between text-slate-300">
                <span>วันขายดีที่สุดอันดับ 1:</span>
                <span className="font-mono text-white">
                  {summary.top3Days[0].date} (฿{summary.top3Days[0].revenue.toLocaleString()})
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. VISUAL INTERACTIVE CHARTS (5 Charts) */}
      <div>
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
          <LineChartIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>Interactive Visual Analytics (Chart.js 4.x Engine)</span>
        </div>

        {/* Row 1: Line Chart (Full Width) */}
        <div className="glass-panel p-5 rounded-2xl border border-white/10 mb-6">
          <h4 className="text-sm font-bold text-white mb-3">
            1. แนวโน้มรายได้เทียบรายจ่ายย้อนหลัง (Revenue vs Expenses Trend)
          </h4>
          <div className="h-64 sm:h-72 w-full">
            <canvas ref={lineChartRef} />
          </div>
        </div>

        {/* Row 2: 2 Doughnut Charts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Chart 2: Formula Breakdown */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <h4 className="text-sm font-bold text-white mb-2">
              2. สัดส่วนยอดขายตามประเภทสูตร (RED vs BM)
            </h4>
            <div className="h-60 w-full flex items-center justify-center">
              <canvas ref={formulaDoughnutRef} />
            </div>
          </div>

          {/* Chart 3: Expense Structure */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <h4 className="text-sm font-bold text-white mb-2">
              3. โครงสร้างรายจ่ายแยกตามหมวดหมู่
            </h4>
            <div className="h-60 w-full flex items-center justify-center">
              <canvas ref={expenseDoughnutRef} />
            </div>
          </div>
        </div>

        {/* Row 3: Histogram & Comparison Bar Chart */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 4: Daily Sales Histogram */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <h4 className="text-sm font-bold text-white mb-2">
              4. การกระจายตัวของยอดขายต่อวัน (Histogram Distribution)
            </h4>
            <div className="h-60 w-full">
              <canvas ref={histogramRef} />
            </div>
          </div>

          {/* Chart 5: Product Performance Comparison */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10">
            <h4 className="text-sm font-bold text-white mb-2">
              5. เปรียบเทียบประสิทธิภาพสินค้า (สูตรฝาแดง vs สูตร BM)
            </h4>
            <div className="h-60 w-full">
              <canvas ref={compareBarRef} />
            </div>
          </div>
        </div>
      </div>

      {/* 4. DEEP STATISTICAL ANALYTICS METRICS */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-white/10">
          <Scale className="w-4 h-4 text-emerald-400" />
          <span>Deep Statistical Analytics (การวิเคราะห์การกระจายตัว & สถิติเชิงลึก)</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Mean (ค่าเฉลี่ย)</span>
            <span className="text-base font-bold text-white font-mono">฿{summary.stats.mean}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Median (ค่ากลาง)</span>
            <span className="text-base font-bold text-white font-mono">฿{summary.stats.median}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Std Dev (ส่วนเบี่ยงเบน)</span>
            <span className="text-base font-bold text-sky-400 font-mono">±{summary.stats.stdDev}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 text-[11px] block">Variance (ความแปรปรวน)</span>
            <span className="text-base font-bold text-white font-mono">{summary.stats.variance}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 text-[11px] block">IQR (พิสัยระหว่างควอร์ไทล์)</span>
            <span className="text-base font-bold text-white font-mono">฿{summary.stats.iqr}</span>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <span className="text-slate-400 text-[11px] block">CV % (ความผันแปร)</span>
            <span className="text-base font-bold text-amber-400 font-mono">{summary.stats.cv}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-slate-500 text-[10px] block">Q1 (25th Percentile)</span>
            <span className="font-bold text-slate-300 font-mono">฿{summary.stats.q1}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-slate-500 text-[10px] block">Q2 (Median)</span>
            <span className="font-bold text-slate-300 font-mono">฿{summary.stats.q2}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-slate-500 text-[10px] block">Q3 (75th Percentile)</span>
            <span className="font-bold text-slate-300 font-mono">฿{summary.stats.q3}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-slate-500 text-[10px] block">Minimum</span>
            <span className="font-bold text-rose-300 font-mono">฿{summary.stats.min}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/5">
            <span className="text-slate-500 text-[10px] block">Maximum</span>
            <span className="font-bold text-emerald-300 font-mono">฿{summary.stats.max}</span>
          </div>
        </div>
      </div>

      {/* 5. COMPARATIVE PRODUCT PERFORMANCE TABLE */}
      <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
        <div>
          <h3 className="font-bold text-white text-base">
            ตารางเปรียบเทียบประสิทธิภาพสินค้าทุกตัว (Comparative Product Table)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            เรียงตามยอดขาย แสดงปริมาณ, รายได้, สต๊อกคงเหลือ, ส่วนแบ่งรายได้ (%) และประมาณการกำไร
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">สินค้า</th>
                <th className="py-2.5 px-3 font-semibold">สูตร</th>
                <th className="py-2.5 px-3 font-semibold text-right">จำนวนที่ขาย</th>
                <th className="py-2.5 px-3 font-semibold text-right">รายได้รวม</th>
                <th className="py-2.5 px-3 font-semibold text-right">ส่วนแบ่ง (%)</th>
                <th className="py-2.5 px-3 font-semibold text-right">สต๊อกคงเหลือ</th>
                <th className="py-2.5 px-3 font-semibold text-right">ประมาณการกำไร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {productComparison.map((item) => (
                <tr key={item.product.id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 px-3 text-white font-medium">{item.product.name}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.product.formulaType === 'RED'
                          ? 'bg-rose-500/20 text-rose-300'
                          : item.product.formulaType === 'BM'
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.product.formulaType}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                    {item.volume} ขวด
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                    ฿{item.revenue.toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {item.revenueShare}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                    {item.product.stock}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-300">
                    ฿{item.estProfit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
