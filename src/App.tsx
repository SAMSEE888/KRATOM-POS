import { useState, useEffect, useCallback, useMemo } from 'react';
import { ActiveTab, Navbar } from './components/Navbar';
import { PosView } from './components/PosView';
import { BoilingCalculator } from './components/BoilingCalculator';
import { MixingCalculator } from './components/MixingCalculator';
import { InventoryView } from './components/InventoryView';
import { ManualSalesAndExpenses } from './components/ManualSalesAndExpenses';
import { AnalyticsView } from './components/AnalyticsView';
import { TransactionLogsView } from './components/TransactionLogsView';
import { SettingsModal } from './components/SettingsModal';
import { ToastContainer } from './components/Toast';
import {
  CartItem,
  CostConfig,
  ExpenseCategory,
  ExpenseItem,
  PaymentMethod,
  Product,
  StockLog,
} from './types';
import {
  INITIAL_CONFIG,
  INITIAL_EXPENSES,
  INITIAL_PRODUCTS,
  INITIAL_STOCK_LOGS,
} from './constants/initialData';
import {
  fetchAllFromGas,
  postActionToGas,
  testGasConnection,
} from './utils/gasService';

const STORAGE_KEYS = {
  PRODUCTS: 'kratom_pos_products_v1',
  STOCK_LOGS: 'kratom_pos_stock_logs_v1',
  EXPENSES: 'kratom_pos_expenses_v1',
  CONFIG: 'kratom_pos_config_v1',
  GAS_URL: 'kratom_pos_gas_url',
};

export default function App() {
  // Navigation State
  const [activeView, setActiveView] = useState<ActiveTab>('POS');

  // Core Data States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_PRODUCTS;
  });

  const [stockLogs, setStockLogs] = useState<StockLog[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_STOCK_LOGS;
  });

  const [expenses, setExpenses] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_EXPENSES;
  });

  const [config, setConfig] = useState<CostConfig>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback
      }
    }
    return INITIAL_CONFIG;
  });

  // GAS Integration & Connectivity States
  const [gasUrl, setGasUrl] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.GAS_URL) || '';
  });
  const [isOnline, setIsOnline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Forwarding State between Boiling and Mixing
  const [mixingPayload, setMixingPayload] = useState<{
    formula: 'RED' | 'BM';
    rawLiters: number;
  } | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<
    Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>
  >([]);

  const addToast = useCallback(
    (type: 'success' | 'error' | 'info', message: string) => {
      const id = Date.now().toString() + Math.random().toString().slice(2, 5);
      setToasts((prev) => [...prev, { id, type, message }]);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Compute Today KPIs for Top Bar
  const { todaySalesCount, todayRevenue } = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLogs = stockLogs.filter(
      (l) => l.type === 'OUT' && l.timestamp.startsWith(todayStr)
    );
    return {
      todaySalesCount: todayLogs.length,
      todayRevenue: todayLogs.reduce((sum, l) => sum + (l.totalPrice || 0), 0),
    };
  }, [stockLogs]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(stockLogs));
  }, [stockLogs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
  }, [config]);

  // Initial Sync from GAS if URL exists
  useEffect(() => {
    if (!gasUrl) return;

    let isMounted = true;
    async function loadFromGas() {
      setIsSyncing(true);
      const gasData = await fetchAllFromGas(gasUrl);
      setIsSyncing(false);

      if (!isMounted) return;

      if (gasData.success && gasData.data) {
        setIsOnline(true);
        if (gasData.data.products?.length) setProducts(gasData.data.products);
        if (gasData.data.stockLogs?.length) setStockLogs(gasData.data.stockLogs);
        if (gasData.data.expenses?.length) setExpenses(gasData.data.expenses);
        if (gasData.data.config) {
          setConfig((prev) => ({ ...prev, ...gasData.data!.config }));
        }
        addToast('success', 'เชื่อมต่อข้อมูลกับ Google Sheets สำเร็จเรียบร้อย');
      } else {
        setIsOnline(false);
      }
    }

    loadFromGas();
    return () => {
      isMounted = false;
    };
  }, [gasUrl, addToast]);

  // Manual Refresh Sync
  const handleManualSync = async () => {
    if (!gasUrl) {
      setIsSettingsOpen(true);
      return;
    }
    setIsSyncing(true);
    const gasData = await fetchAllFromGas(gasUrl);
    setIsSyncing(false);
    if (gasData.success && gasData.data) {
      setIsOnline(true);
      if (gasData.data.products?.length) setProducts(gasData.data.products);
      if (gasData.data.stockLogs?.length) setStockLogs(gasData.data.stockLogs);
      if (gasData.data.expenses?.length) setExpenses(gasData.data.expenses);
      if (gasData.data.config) {
        setConfig((prev) => ({ ...prev, ...gasData.data!.config }));
      }
      addToast('success', 'ซิงค์ข้อมูลล่าสุดจาก Google Sheets สำเร็จ');
    } else {
      setIsOnline(false);
      addToast('error', 'ไม่สามารถเชื่อมต่อ Google Sheets ได้ ตรวจสอบ URL');
    }
  };

  // 1. Checkout Handler (POS Sale)
  const handleCheckout = async (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerOrNote: string
  ): Promise<{ success: boolean; error?: string; logs?: StockLog[] }> => {
    try {
      const now = new Date().toISOString();
      const newLogs: StockLog[] = [];

      // Update product stocks
      const updatedProducts = products.map((prod) => {
        const item = items.find((it) => it.product.id === prod.id);
        if (item) {
          const newStock = Math.max(0, prod.stock - item.quantity);
          const estUnitCost = prod.costEstimate || 14;
          const logItem: StockLog = {
            id: `LOG-SALE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: now,
            type: 'OUT',
            productId: prod.id,
            productName: prod.name,
            formulaType: prod.formulaType,
            quantity: item.quantity,
            remainingStock: newStock,
            unitPrice: prod.price,
            totalPrice: prod.price * item.quantity,
            cost: estUnitCost * item.quantity,
            paymentMethod,
            customerOrLot: customerOrNote.trim() || 'ลูกค้าหน้าร้าน',
            notes: `ขายหน้าร้าน (${paymentMethod})`,
          };
          newLogs.push(logItem);
          return { ...prod, stock: newStock };
        }
        return prod;
      });

      setProducts(updatedProducts);
      setStockLogs((prev) => [...newLogs, ...prev]);

      addToast(
        'success',
        `ขายสำเร็จ ${items.reduce((s, it) => s + it.quantity, 0)} ขวด ตัดสต๊อกเรียบร้อย`
      );

      // Async sync to Google Apps Script
      if (gasUrl) {
        postActionToGas(gasUrl, 'RECORD_SALE', {
          items,
          paymentMethod,
          customerOrNote,
          logs: newLogs,
          updatedProducts,
        });
      }

      return { success: true, logs: newLogs };
    } catch (err: any) {
      addToast('error', `เกิดข้อผิดพลาดในการขาย: ${err.message}`);
      return { success: false, error: err.message };
    }
  };

  // 2. Production Stock In (From Mixing or Inventory)
  const handleAddStock = async (payload: {
    productId: string;
    productName: string;
    formulaType: 'RED' | 'BM' | 'CUSTOM' | 'OTHER';
    quantity: number;
    lot: string;
    cost: number;
    notes: string;
  }): Promise<boolean> => {
    try {
      const now = new Date().toISOString();
      let updatedRemaining = 0;

      const updatedProducts = products.map((prod) => {
        if (prod.id === payload.productId) {
          const nextStock = prod.stock + payload.quantity;
          updatedRemaining = nextStock;
          return { ...prod, stock: nextStock };
        }
        return prod;
      });

      const newLog: StockLog = {
        id: `LOG-IN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        timestamp: now,
        type: 'IN',
        productId: payload.productId,
        productName: payload.productName,
        formulaType: payload.formulaType,
        quantity: payload.quantity,
        remainingStock: updatedRemaining,
        unitPrice: 0,
        totalPrice: 0,
        cost: payload.cost,
        customerOrLot: payload.lot,
        notes: payload.notes,
      };

      setProducts(updatedProducts);
      setStockLogs((prev) => [newLog, ...prev]);
      addToast('success', `รับสินค้าเข้าสต๊อก +${payload.quantity} ขวด (${payload.productName})`);

      if (gasUrl) {
        postActionToGas(gasUrl, 'STOCK_IN', {
          ...payload,
          log: newLog,
          remainingStock: updatedRemaining,
        });
      }

      return true;
    } catch (err: any) {
      addToast('error', `เกิดข้อผิดพลาดในการรับเข้าสต๊อก: ${err.message}`);
      return false;
    }
  };

  // 3. Manual Sale Handler (Backdated)
  const handleAddManualSale = async (sale: {
    productId: string;
    productName: string;
    formulaType: 'RED' | 'BM' | 'CUSTOM' | 'OTHER';
    quantity: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    timestamp: string;
    customerOrNote: string;
  }): Promise<boolean> => {
    try {
      let updatedRemaining = 0;
      const updatedProducts = products.map((p) => {
        if (p.id === sale.productId) {
          const nextStock = Math.max(0, p.stock - sale.quantity);
          updatedRemaining = nextStock;
          return { ...p, stock: nextStock };
        }
        return p;
      });

      const estCost = ((products.find((p) => p.id === sale.productId)?.costEstimate) || 14) * sale.quantity;

      const newLog: StockLog = {
        id: `LOG-MANUAL-${Date.now()}`,
        timestamp: sale.timestamp,
        type: 'OUT',
        productId: sale.productId,
        productName: sale.productName,
        formulaType: sale.formulaType,
        quantity: sale.quantity,
        remainingStock: updatedRemaining,
        unitPrice: sale.unitPrice,
        totalPrice: sale.unitPrice * sale.quantity,
        cost: estCost,
        paymentMethod: sale.paymentMethod,
        customerOrLot: sale.customerOrNote,
        notes: 'บันทึกการขายย้อนหลัง',
      };

      setProducts(updatedProducts);
      setStockLogs((prev) => [newLog, ...prev]);
      addToast('success', `บันทึกการขายย้อนหลัง ${sale.quantity} ขวด สำเร็จ`);

      if (gasUrl) {
        postActionToGas(gasUrl, 'RECORD_SALE', {
          sale,
          log: newLog,
          updatedProducts,
        });
      }

      return true;
    } catch (err: any) {
      addToast('error', `บันทึกขายย้อนหลังไม่สำเร็จ: ${err.message}`);
      return false;
    }
  };

  // 4. Add Expense Handler
  const handleAddExpense = async (expense: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    quantity?: number;
    unit?: string;
    timestamp: string;
    notes?: string;
  }): Promise<boolean> => {
    try {
      const newExp: ExpenseItem = {
        id: `EXP-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        ...expense,
      };

      setExpenses((prev) => [newExp, ...prev]);
      addToast('success', `บันทึกรายจ่าย ฿${expense.amount.toLocaleString()} เรียบร้อย`);

      if (gasUrl) {
        postActionToGas(gasUrl, 'ADD_EXPENSE', { expense: newExp });
      }

      return true;
    } catch (err: any) {
      addToast('error', `บันทึกรายจ่ายไม่สำเร็จ: ${err.message}`);
      return false;
    }
  };

  // 5. Delete Expense Handler
  const handleDeleteExpense = async (expenseId: string): Promise<boolean> => {
    setExpenses((prev) => prev.filter((exp) => exp.id !== expenseId));
    addToast('info', 'ลบรายการรายจ่ายแล้ว');
    if (gasUrl) {
      postActionToGas(gasUrl, 'DELETE_EXPENSE', { expenseId });
    }
    return true;
  };

  // 6. Forwarding from Boiling Calculator to Mixing Calculator
  const handleForwardToMixing = (payload: {
    formula: 'RED' | 'BM' | 'SPLIT';
    rawLiters: number;
  }) => {
    if (payload.formula === 'SPLIT') {
      const half = Number((payload.rawLiters / 2).toFixed(1));
      setMixingPayload({ formula: 'RED', rawLiters: half });
      addToast('info', `แบ่งน้ำดิบเข้าสูตรฝาแดง ${half} ลิตร (และเหลืออีก ${half} ลิตร)`);
    } else {
      setMixingPayload({ formula: payload.formula, rawLiters: payload.rawLiters });
      addToast(
        'info',
        `ส่งต่อน้ำดิบ ${payload.rawLiters} ลิตร เข้าเครื่องคิดเลขสูตร ${
          payload.formula === 'RED' ? 'ฝาแดง' : 'BM'
        }`
      );
    }
    setActiveView('MIXING');
  };

  // 7. Test GAS Connection
  const handleTestGas = async (): Promise<{ success: boolean; message: string }> => {
    if (!gasUrl) {
      return { success: false, message: 'กรุณาระบุ URL ของ Google Apps Script ก่อน' };
    }
    const result = await testGasConnection(gasUrl);
    if (result.success) {
      setIsOnline(true);
      addToast('success', result.message);
    } else {
      setIsOnline(false);
      addToast('error', result.message);
    }
    return result;
  };

  // 8. Reset to Seed Data
  const handleResetSeedData = () => {
    setProducts(INITIAL_PRODUCTS);
    setStockLogs(INITIAL_STOCK_LOGS);
    setExpenses(INITIAL_EXPENSES);
    setConfig(INITIAL_CONFIG);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.STOCK_LOGS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.CONFIG);
    addToast('info', 'รีเซ็ตข้อมูลทั้งหมดกลับเป็นค่าเริ่มต้นตัวอย่างแล้ว');
  };

  return (
    <div className="min-h-screen bg-[#050608] text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-black font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Top Fixed Header / Navbar */}
      <Navbar
        activeTab={activeView}
        setActiveTab={setActiveView}
        gasSettings={{ webAppUrl: gasUrl, autoSync: true }}
        isSyncing={isSyncing}
        onManualSync={handleManualSync}
        onOpenConfig={() => setIsSettingsOpen(true)}
        onOpenHistory={() => setActiveView('LOGS')}
        todaySalesCount={todaySalesCount}
        todayRevenue={todayRevenue}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-16">
        {activeView === 'POS' && (
          <PosView
            products={products}
            onCheckout={handleCheckout}
            onUpdateStock={(id, newStock) => {
              setProducts((prev) =>
                prev.map((p) => (p.id === id ? { ...p, stock: newStock } : p))
              );
            }}
          />
        )}

        {activeView === 'BOILING' && (
          <BoilingCalculator
            config={config}
            onUpdateConfig={setConfig}
            onForwardToMixing={handleForwardToMixing}
          />
        )}

        {activeView === 'MIXING' && (
          <MixingCalculator
            config={config}
            products={products}
            initialRawLiters={mixingPayload?.rawLiters}
            initialFormula={mixingPayload?.formula}
            onAddStockProduction={handleAddStock}
          />
        )}

        {activeView === 'INVENTORY' && (
          <InventoryView
            products={products}
            stockLogs={stockLogs}
            onAddStock={handleAddStock}
          />
        )}

        {activeView === 'MANUAL_EXPENSE' && (
          <ManualSalesAndExpenses
            products={products}
            expenses={expenses}
            onAddManualSale={handleAddManualSale}
            onAddExpense={handleAddExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {activeView === 'BI_ANALYTICS' && (
          <AnalyticsView
            stockLogs={stockLogs}
            expenses={expenses}
            products={products}
            config={config}
          />
        )}

        {activeView === 'LOGS' && (
          <TransactionLogsView stockLogs={stockLogs} />
        )}
      </main>

      {/* Settings & Google Sheets Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gasUrl={gasUrl}
        onSaveGasUrl={(url) => {
          setGasUrl(url);
          localStorage.setItem(STORAGE_KEYS.GAS_URL, url);
          addToast('success', 'บันทึก Google Apps Script Web App URL เรียบร้อย');
        }}
        onTestGasConnection={handleTestGas}
        onResetSeedData={handleResetSeedData}
        isOnline={isOnline}
      />
    </div>
  );
}
