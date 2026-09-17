export type FormulaType = 'RED' | 'BM' | 'CUSTOM' | 'OTHER';

export type PaymentMethod = 'CASH' | 'TRANSFER';

export type MovementType = 'IN' | 'OUT';

export type ViewTab =
  | 'POS'
  | 'BOILING'
  | 'MIXING'
  | 'INVENTORY'
  | 'MANUAL'
  | 'ANALYTICS'
  | 'LOGS';

export interface Product {
  id: string;
  sku: string;
  name: string;
  formulaType: FormulaType;
  price: number;
  costEstimate: number;
  stock: number;
  bottleSizeMl: number; // e.g., 1000
  description?: string;
  active: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface StockLog {
  id: string;
  timestamp: string; // ISO string or YYYY-MM-DD HH:mm:ss
  type: MovementType;
  productId: string;
  productName: string;
  formulaType: FormulaType;
  quantity: number;
  remainingStock: number;
  unitPrice?: number;
  totalPrice?: number;
  cost?: number;
  paymentMethod?: PaymentMethod;
  customerOrLot?: string; // Customer name or Lot number
  notes?: string;
}

export interface ExpenseItem {
  id: string;
  timestamp: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export type ExpenseCategory =
  | 'ใบกระท่อม'
  | 'โค้ก'
  | 'ยาแก้ไอฝาแดง'
  | 'ยาแก้ไอ BM'
  | 'ขวด/สติกเกอร์'
  | 'แก๊ส/ไฟ'
  | 'บ๊วย'
  | 'อื่นๆ';

export interface CostConfig {
  // Common Costs
  leafCostPerKg: number; // default 100
  bottleAndStickerCost: number; // default 4 per 1000ml bottle
  overheadCostPerBottle: number; // default 2 (gas/electricity)
  
  // RED Formula Costs & Selling
  redCokeCostPerLiter: number; // default 22
  redSyrupCostPerBottle60ml: number; // default 54
  redSellingPrice: number; // default 35
  
  // BM Formula Costs & Selling
  bmCokeCostPerLiter: number; // default 22
  bmSyrupCostPerBottle60ml: number; // default 34
  bmPlumCostPerPiece: number; // default 0.5
  bmSellingPrice: number; // default 35
  
  // Recipe Ratios (per standard batch)
  // Standard Red: Raw 3L : Coke 1L : Syrup 20ml
  redRawRatio: number; // 3
  redCokeRatio: number; // 1
  redSyrupMl: number; // 20
  
  // Standard BM: Raw 3L : Coke 1L : Syrup 20ml : Plum 9 pcs
  bmRawRatio: number; // 3
  bmCokeRatio: number; // 1
  bmSyrupMl: number; // 20
  bmPlumCount: number; // 9
  
  // Boiling Standard Defaults
  boilRatioWaterToLeaf: number; // default 22 (22 Liters water per 1 kg leaves)
  boilExtractPercent: number; // default 80 (%)
  standardBottleSizeMl: number; // default 1000
}

export interface GasSettings {
  webAppUrl: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface StatisticalMetrics {
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  q1: number;
  q2: number;
  q3: number;
  iqr: number;
  min: number;
  max: number;
  range: number;
  cv: number; // Coefficient of Variation %
  growthRatePercent: number;
  rSquared: number;
}

export interface BiSummary {
  revenue: number;
  expenses: number;
  netProfit: number;
  totalVolumeBottles: number;
  breakEvenBottles: number;
  averageTransactionValue: number; // ATV
  grossMarginPercent: number;
  netMarginPercent: number;
  contributionMarginPercent: number;
  marginOfSafetyPercent: number;
  costPerBottle: number;
  revenuePerBottle: number;
  profitPerBottle: number;
  estimatedCogs: number;
  inventoryTurnover: number;
  daysSalesOfInventory: number; // DSI
  expenseRatioPercent: number;
  breakEvenBottlesPerDay: number;
  totalBills: number;
  stats: StatisticalMetrics;
  top3Days: { date: string; revenue: number }[];
  lowestDay: { date: string; revenue: number } | null;
  peakHour: string;
}
