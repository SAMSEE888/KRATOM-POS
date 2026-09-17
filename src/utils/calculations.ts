import { BiSummary, CostConfig, ExpenseItem, StatisticalMetrics, StockLog } from '../types';

/**
 * 1. 3-WAY BOILING & EXTRACTION CALCULATOR
 */
export interface BoilCalcResult {
  leafKg: number;
  waterLiters: number;
  extractLiters: number;
  potentialBottles: number;
  leafCost: number;
  overheadCost: number;
  totalCost: number;
  costPerLiterRaw: number;
}

export function calculateBoiling({
  mode,
  value,
  config,
}: {
  mode: 'LEAF' | 'WATER' | 'EXTRACT';
  value: number;
  config: CostConfig;
}): BoilCalcResult {
  const ratio = Math.max(1, config.boilRatioWaterToLeaf || 22);
  const extractPct = Math.max(1, Math.min(100, config.boilExtractPercent || 80)) / 100;
  const bottleSizeL = Math.max(100, config.standardBottleSizeMl || 1000) / 1000;

  let leafKg = 0;
  let waterLiters = 0;
  let extractLiters = 0;

  if (mode === 'LEAF') {
    leafKg = Math.max(0, value);
    waterLiters = leafKg * ratio;
    extractLiters = waterLiters * extractPct;
  } else if (mode === 'WATER') {
    waterLiters = Math.max(0, value);
    leafKg = waterLiters / ratio;
    extractLiters = waterLiters * extractPct;
  } else {
    // EXTRACT
    extractLiters = Math.max(0, value);
    waterLiters = extractLiters / extractPct;
    leafKg = waterLiters / ratio;
  }

  const potentialBottles = Math.floor(extractLiters / bottleSizeL);
  const leafCost = leafKg * (config.leafCostPerKg || 100);
  const overheadCost = potentialBottles * (config.overheadCostPerBottle || 2);
  const totalCost = leafCost + overheadCost;
  const costPerLiterRaw = extractLiters > 0 ? totalCost / extractLiters : 0;

  return {
    leafKg: Number(leafKg.toFixed(2)),
    waterLiters: Number(waterLiters.toFixed(2)),
    extractLiters: Number(extractLiters.toFixed(2)),
    potentialBottles,
    leafCost: Number(leafCost.toFixed(2)),
    overheadCost: Number(overheadCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    costPerLiterRaw: Number(costPerLiterRaw.toFixed(2)),
  };
}

/**
 * 2. COMMERCIAL MIXING & RECIPE CALCULATOR
 */
export interface RecipeCalcResult {
  rawLiters: number;
  cokeLiters: number;
  syrupMl: number;
  plumCount?: number;
  totalVolumeLiters: number;
  bottlesProduced: number;
  
  // Cost breakdown
  rawCost: number;
  cokeCost: number;
  syrupCost: number;
  plumCost: number;
  packagingCost: number;
  overheadCost: number;
  totalCost: number;
  costPerBottle: number;
  
  // Financial ROI
  sellingPrice: number;
  revenue: number;
  netProfit: number;
  marginPercent: number;
  roiPercent: number;
}

export function calculateRedRecipe({
  rawLiters,
  config,
  rawCostPerLiter = 8.5,
}: {
  rawLiters: number;
  config: CostConfig;
  rawCostPerLiter?: number;
}): RecipeCalcResult {
  const baseRaw = Math.max(0.1, config.redRawRatio || 3);
  const baseCoke = Math.max(0.1, config.redCokeRatio || 1);
  const baseSyrupMl = Math.max(1, config.redSyrupMl || 20);

  const scale = Math.max(0, rawLiters) / baseRaw;
  const cokeLiters = scale * baseCoke;
  const syrupMl = scale * baseSyrupMl;
  const totalVolumeLiters = rawLiters + cokeLiters + syrupMl / 1000;
  
  const bottleSizeL = (config.standardBottleSizeMl || 1000) / 1000;
  const bottlesProduced = Math.floor(totalVolumeLiters / bottleSizeL);

  const rawCost = rawLiters * rawCostPerLiter;
  const cokeCost = cokeLiters * (config.redCokeCostPerLiter || 22);
  const syrupCost = (syrupMl / 60) * (config.redSyrupCostPerBottle60ml || 54);
  const packagingCost = bottlesProduced * (config.bottleAndStickerCost || 4);
  const overheadCost = bottlesProduced * (config.overheadCostPerBottle || 2);
  const totalCost = rawCost + cokeCost + syrupCost + packagingCost + overheadCost;

  const costPerBottle = bottlesProduced > 0 ? totalCost / bottlesProduced : 0;
  const sellingPrice = config.redSellingPrice || 35;
  const revenue = bottlesProduced * sellingPrice;
  const netProfit = revenue - totalCost;
  const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    rawLiters: Number(rawLiters.toFixed(2)),
    cokeLiters: Number(cokeLiters.toFixed(2)),
    syrupMl: Number(syrupMl.toFixed(1)),
    totalVolumeLiters: Number(totalVolumeLiters.toFixed(2)),
    bottlesProduced,
    rawCost: Number(rawCost.toFixed(2)),
    cokeCost: Number(cokeCost.toFixed(2)),
    syrupCost: Number(syrupCost.toFixed(2)),
    plumCost: 0,
    packagingCost: Number(packagingCost.toFixed(2)),
    overheadCost: Number(overheadCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    costPerBottle: Number(costPerBottle.toFixed(2)),
    sellingPrice,
    revenue: Number(revenue.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(1)),
    roiPercent: Number(roiPercent.toFixed(1)),
  };
}

export function calculateBmRecipe({
  rawLiters,
  config,
  rawCostPerLiter = 8.5,
}: {
  rawLiters: number;
  config: CostConfig;
  rawCostPerLiter?: number;
}): RecipeCalcResult {
  const baseRaw = Math.max(0.1, config.bmRawRatio || 3);
  const baseCoke = Math.max(0.1, config.bmCokeRatio || 1);
  const baseSyrupMl = Math.max(1, config.bmSyrupMl || 20);
  const basePlums = Math.max(0, config.bmPlumCount || 9);

  const scale = Math.max(0, rawLiters) / baseRaw;
  const cokeLiters = scale * baseCoke;
  const syrupMl = scale * baseSyrupMl;
  const plumCount = Math.round(scale * basePlums);
  const totalVolumeLiters = rawLiters + cokeLiters + syrupMl / 1000;
  
  const bottleSizeL = (config.standardBottleSizeMl || 1000) / 1000;
  const bottlesProduced = Math.floor(totalVolumeLiters / bottleSizeL);

  const rawCost = rawLiters * rawCostPerLiter;
  const cokeCost = cokeLiters * (config.bmCokeCostPerLiter || 22);
  const syrupCost = (syrupMl / 60) * (config.bmSyrupCostPerBottle60ml || 34);
  const plumCost = plumCount * (config.bmPlumCostPerPiece || 0.5);
  const packagingCost = bottlesProduced * (config.bottleAndStickerCost || 4);
  const overheadCost = bottlesProduced * (config.overheadCostPerBottle || 2);
  const totalCost = rawCost + cokeCost + syrupCost + plumCost + packagingCost + overheadCost;

  const costPerBottle = bottlesProduced > 0 ? totalCost / bottlesProduced : 0;
  const sellingPrice = config.bmSellingPrice || 35;
  const revenue = bottlesProduced * sellingPrice;
  const netProfit = revenue - totalCost;
  const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const roiPercent = totalCost > 0 ? (netProfit / totalCost) * 100 : 0;

  return {
    rawLiters: Number(rawLiters.toFixed(2)),
    cokeLiters: Number(cokeLiters.toFixed(2)),
    syrupMl: Number(syrupMl.toFixed(1)),
    plumCount,
    totalVolumeLiters: Number(totalVolumeLiters.toFixed(2)),
    bottlesProduced,
    rawCost: Number(rawCost.toFixed(2)),
    cokeCost: Number(cokeCost.toFixed(2)),
    syrupCost: Number(syrupCost.toFixed(2)),
    plumCost: Number(plumCost.toFixed(2)),
    packagingCost: Number(packagingCost.toFixed(2)),
    overheadCost: Number(overheadCost.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    costPerBottle: Number(costPerBottle.toFixed(2)),
    sellingPrice,
    revenue: Number(revenue.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    marginPercent: Number(marginPercent.toFixed(1)),
    roiPercent: Number(roiPercent.toFixed(1)),
  };
}

/**
 * 3. REVERSE RECIPE CALCULATOR (Input Target Bottles -> Required Ingredients)
 */
export function calculateReverseRecipe({
  targetBottles,
  formulaType,
  config,
  rawCostPerLiter = 8.5,
}: {
  targetBottles: number;
  formulaType: 'RED' | 'BM';
  config: CostConfig;
  rawCostPerLiter?: number;
}): RecipeCalcResult {
  const bottleSizeL = (config.standardBottleSizeMl || 1000) / 1000;
  const targetVolumeL = Math.max(1, targetBottles) * bottleSizeL;

  if (formulaType === 'RED') {
    const baseRaw = config.redRawRatio || 3;
    const baseCoke = config.redCokeRatio || 1;
    const baseSyrupMl = config.redSyrupMl || 20;
    const batchVolume = baseRaw + baseCoke + baseSyrupMl / 1000; // approx 4.02L
    const rawRequired = (targetVolumeL / batchVolume) * baseRaw;
    return calculateRedRecipe({ rawLiters: rawRequired, config, rawCostPerLiter });
  } else {
    const baseRaw = config.bmRawRatio || 3;
    const baseCoke = config.bmCokeRatio || 1;
    const baseSyrupMl = config.bmSyrupMl || 20;
    const batchVolume = baseRaw + baseCoke + baseSyrupMl / 1000;
    const rawRequired = (targetVolumeL / batchVolume) * baseRaw;
    return calculateBmRecipe({ rawLiters: rawRequired, config, rawCostPerLiter });
  }
}

/**
 * 4. STATISTICAL & DEEP ANALYTICS ENGINE
 */
export function calculateStatistics(values: number[]): StatisticalMetrics {
  if (!values || values.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      variance: 0,
      q1: 0,
      q2: 0,
      q3: 0,
      iqr: 0,
      min: 0,
      max: 0,
      range: 0,
      cv: 0,
      growthRatePercent: 0,
      rSquared: 0,
    };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median (Q2)
  const median =
    n % 2 === 0
      ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
      : sorted[Math.floor(n / 2)];

  // Variance & StdDev
  const variance =
    n > 1
      ? sorted.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1)
      : 0;
  const stdDev = Math.sqrt(variance);

  // Percentiles (Q1, Q3)
  const getPercentile = (arr: number[], p: number) => {
    const index = (arr.length - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    if (lower === upper) return arr[lower];
    return arr[lower] * (1 - weight) + arr[upper] * weight;
  };

  const q1 = getPercentile(sorted, 0.25);
  const q2 = median;
  const q3 = getPercentile(sorted, 0.75);
  const iqr = q3 - q1;
  const min = sorted[0];
  const max = sorted[n - 1];
  const range = max - min;
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  // Growth rate comparing second half vs first half
  let growthRatePercent = 0;
  if (n >= 4) {
    const mid = Math.floor(n / 2);
    const firstHalfSum = values.slice(0, mid).reduce((a, b) => a + b, 0);
    const secondHalfSum = values.slice(mid).reduce((a, b) => a + b, 0);
    if (firstHalfSum > 0) {
      growthRatePercent = ((secondHalfSum - firstHalfSum) / firstHalfSum) * 100;
    }
  }

  // Linear regression R-Squared for trend
  let rSquared = 0;
  if (n >= 2) {
    const xValues = values.map((_, idx) => idx);
    const xMean = (n - 1) / 2;
    let ssXY = 0;
    let ssXX = 0;
    let ssYY = 0;
    for (let i = 0; i < n; i++) {
      const dx = xValues[i] - xMean;
      const dy = values[i] - mean;
      ssXY += dx * dy;
      ssXX += dx * dx;
      ssYY += dy * dy;
    }
    if (ssXX > 0 && ssYY > 0) {
      const r = ssXY / Math.sqrt(ssXX * ssYY);
      rSquared = Math.min(1, Math.max(0, r * r));
    }
  }

  return {
    mean: Number(mean.toFixed(2)),
    median: Number(median.toFixed(2)),
    stdDev: Number(stdDev.toFixed(2)),
    variance: Number(variance.toFixed(2)),
    q1: Number(q1.toFixed(2)),
    q2: Number(q2.toFixed(2)),
    q3: Number(q3.toFixed(2)),
    iqr: Number(iqr.toFixed(2)),
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    range: Number(range.toFixed(2)),
    cv: Number(cv.toFixed(1)),
    growthRatePercent: Number(growthRatePercent.toFixed(1)),
    rSquared: Number(rSquared.toFixed(3)),
  };
}

/**
 * 5. COMPREHENSIVE BI SUMMARY GENERATOR
 */
export function calculateBiSummary({
  stockLogs,
  expenses,
  config,
  dateFilter = 'ALL',
  customStartDate,
  customEndDate,
  formulaFilter = 'ALL',
  productFilter = 'ALL',
  paymentFilter = 'ALL',
}: {
  stockLogs: StockLog[];
  expenses: ExpenseItem[];
  config: CostConfig;
  dateFilter?: string;
  customStartDate?: string;
  customEndDate?: string;
  formulaFilter?: string;
  productFilter?: string;
  paymentFilter?: string;
}): BiSummary {
  // Date range filter
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const isWithinDate = (ts: string) => {
    const time = new Date(ts).getTime();
    if (isNaN(time)) return true;

    if (dateFilter === 'TODAY') {
      return time >= startOfDay;
    }
    if (dateFilter === 'YESTERDAY') {
      const yesterdayStart = startOfDay - 24 * 60 * 60 * 1000;
      return time >= yesterdayStart && time < startOfDay;
    }
    if (dateFilter === '7DAYS') {
      return time >= startOfDay - 7 * 24 * 60 * 60 * 1000;
    }
    if (dateFilter === 'THIS_MONTH') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return time >= monthStart;
    }
    if (dateFilter === 'LAST_MONTH') {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return time >= lastMonthStart && time < thisMonthStart;
    }
    if (dateFilter === 'CUSTOM' && customStartDate && customEndDate) {
      const s = new Date(customStartDate).getTime();
      const e = new Date(customEndDate).setHours(23, 59, 59, 999);
      return time >= s && time <= e;
    }
    return true; // ALL
  };

  // Filtered Sales (OUT logs)
  const salesLogs = stockLogs.filter((log) => {
    if (log.type !== 'OUT') return false;
    if (!isWithinDate(log.timestamp)) return false;
    if (formulaFilter !== 'ALL' && log.formulaType !== formulaFilter) return false;
    if (productFilter !== 'ALL' && log.productId !== productFilter) return false;
    if (paymentFilter !== 'ALL' && log.paymentMethod !== paymentFilter) return false;
    return true;
  });

  // Filtered Expenses
  const filteredExpenses = expenses.filter((exp) => isWithinDate(exp.timestamp));

  // Primary Metrics
  const revenue = salesLogs.reduce((acc, log) => acc + (log.totalPrice || 0), 0);
  const totalExpenseAmount = filteredExpenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);
  const totalVolumeBottles = salesLogs.reduce((acc, log) => acc + (log.quantity || 0), 0);
  const estimatedCogs = salesLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
  const netProfit = revenue - totalExpenseAmount;

  // Averages & Margins
  const totalBills = salesLogs.length;
  const averageTransactionValue = totalBills > 0 ? revenue / totalBills : 0;
  const revenuePerBottle = totalVolumeBottles > 0 ? revenue / totalVolumeBottles : 0;
  const costPerBottle = totalVolumeBottles > 0 ? estimatedCogs / totalVolumeBottles : 0;
  const profitPerBottle = revenuePerBottle - costPerBottle;

  const grossProfit = revenue - estimatedCogs;
  const grossMarginPercent = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const netMarginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const contributionMarginPercent = revenue > 0 ? ((revenue - estimatedCogs) / revenue) * 100 : 0;
  const expenseRatioPercent = revenue > 0 ? (totalExpenseAmount / revenue) * 100 : 0;

  // Break-even
  const unitContribution = Math.max(1, profitPerBottle > 0 ? profitPerBottle : 15);
  const breakEvenBottles = Math.ceil(totalExpenseAmount / unitContribution);
  const marginOfSafetyPercent =
    totalVolumeBottles > 0 && totalVolumeBottles >= breakEvenBottles
      ? ((totalVolumeBottles - breakEvenBottles) / totalVolumeBottles) * 100
      : 0;

  // Days in range estimation
  const periodDays = dateFilter === '7DAYS' ? 7 : dateFilter === 'TODAY' ? 1 : 30;
  const breakEvenBottlesPerDay = Math.ceil(breakEvenBottles / periodDays);

  // Operational: Inventory Turnover & DSI
  const avgInventoryValue = 50 * 35; // approx 50 bottles in stock * 35 THB
  const inventoryTurnover = avgInventoryValue > 0 ? Number((estimatedCogs / avgInventoryValue).toFixed(2)) : 1;
  const daysSalesOfInventory = inventoryTurnover > 0 ? Math.round(periodDays / inventoryTurnover) : 30;

  // Daily revenue aggregation for Deep Statistics
  const dailyRevMap: { [dateStr: string]: number } = {};
  const hourMap: { [hour: number]: number } = {};

  salesLogs.forEach((log) => {
    const d = new Date(log.timestamp);
    const dateKey = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : 'Unknown';
    dailyRevMap[dateKey] = (dailyRevMap[dateKey] || 0) + (log.totalPrice || 0);

    if (!isNaN(d.getTime())) {
      const h = d.getHours();
      hourMap[h] = (hourMap[h] || 0) + (log.quantity || 0);
    }
  });

  const dailyValues = Object.values(dailyRevMap);
  const stats = calculateStatistics(dailyValues.length > 0 ? dailyValues : [0]);

  // Top 3 best days and lowest day
  const sortedDays = Object.entries(dailyRevMap)
    .map(([date, rev]) => ({ date, revenue: rev }))
    .sort((a, b) => b.revenue - a.revenue);

  const top3Days = sortedDays.slice(0, 3);
  const lowestDay = sortedDays.length > 0 ? sortedDays[sortedDays.length - 1] : null;

  // Peak Hour
  let peakH = 14;
  let maxHourQty = 0;
  Object.entries(hourMap).forEach(([hr, qty]) => {
    if (qty > maxHourQty) {
      maxHourQty = qty;
      peakH = Number(hr);
    }
  });
  const peakHour = `${peakH.toString().padStart(2, '0')}:00 - ${(peakH + 1).toString().padStart(2, '0')}:00`;

  return {
    revenue: Number(revenue.toFixed(2)),
    expenses: Number(totalExpenseAmount.toFixed(2)),
    netProfit: Number(netProfit.toFixed(2)),
    totalVolumeBottles,
    breakEvenBottles,
    averageTransactionValue: Number(averageTransactionValue.toFixed(2)),
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    netMarginPercent: Number(netMarginPercent.toFixed(1)),
    contributionMarginPercent: Number(contributionMarginPercent.toFixed(1)),
    marginOfSafetyPercent: Number(marginOfSafetyPercent.toFixed(1)),
    costPerBottle: Number(costPerBottle.toFixed(2)),
    revenuePerBottle: Number(revenuePerBottle.toFixed(2)),
    profitPerBottle: Number(profitPerBottle.toFixed(2)),
    estimatedCogs: Number(estimatedCogs.toFixed(2)),
    inventoryTurnover,
    daysSalesOfInventory,
    expenseRatioPercent: Number(expenseRatioPercent.toFixed(1)),
    breakEvenBottlesPerDay,
    totalBills,
    stats,
    top3Days,
    lowestDay,
    peakHour,
  };
}
