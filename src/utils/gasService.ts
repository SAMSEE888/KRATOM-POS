import { CostConfig, ExpenseItem, GasSettings, Product, StockLog } from '../types';
import { INITIAL_CONFIG, INITIAL_EXPENSES, INITIAL_PRODUCTS, INITIAL_STOCK_LOGS } from '../constants/initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'kratom_pos_products_v1',
  STOCK_LOGS: 'kratom_pos_stock_logs_v1',
  EXPENSES: 'kratom_pos_expenses_v1',
  CONFIG: 'kratom_pos_config_v1',
  SETTINGS: 'kratom_pos_gas_settings_v1',
};

export interface AppDatabaseState {
  products: Product[];
  stockLogs: StockLog[];
  expenses: ExpenseItem[];
  config: CostConfig;
  gasSettings: GasSettings;
}

export function loadLocalDatabase(): AppDatabaseState {
  try {
    const rawProd = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    const rawLogs = localStorage.getItem(STORAGE_KEYS.STOCK_LOGS);
    const rawExp = localStorage.getItem(STORAGE_KEYS.EXPENSES);
    const rawCfg = localStorage.getItem(STORAGE_KEYS.CONFIG);
    const rawSet = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    return {
      products: rawProd ? JSON.parse(rawProd) : INITIAL_PRODUCTS,
      stockLogs: rawLogs ? JSON.parse(rawLogs) : INITIAL_STOCK_LOGS,
      expenses: rawExp ? JSON.parse(rawExp) : INITIAL_EXPENSES,
      config: rawCfg ? JSON.parse(rawCfg) : INITIAL_CONFIG,
      gasSettings: rawSet
        ? JSON.parse(rawSet)
        : { webAppUrl: '', autoSync: false, lastSyncedAt: undefined },
    };
  } catch (err) {
    console.error('Failed to load local database:', err);
    return {
      products: INITIAL_PRODUCTS,
      stockLogs: INITIAL_STOCK_LOGS,
      expenses: INITIAL_EXPENSES,
      config: INITIAL_CONFIG,
      gasSettings: { webAppUrl: '', autoSync: false },
    };
  }
}

export function saveLocalDatabase(state: AppDatabaseState) {
  try {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(state.products));
    localStorage.setItem(STORAGE_KEYS.STOCK_LOGS, JSON.stringify(state.stockLogs));
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(state.expenses));
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(state.config));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(state.gasSettings));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

/**
 * Fetch all data from Google Apps Script Web App
 */
export async function fetchAllFromGas(webAppUrl: string): Promise<{
  success: boolean;
  data?: {
    stockLogs: StockLog[];
    expenses: ExpenseItem[];
    products: Product[];
    config: Partial<CostConfig>;
  };
  error?: string;
}> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, error: 'กรุณาระบุ URL ของ Google Apps Script Web App ให้ถูกต้อง' };
  }

  try {
    const url = new URL(webAppUrl);
    url.searchParams.set('action', 'GET_ALL');

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const json = await res.json();
    if (json.status === 'success' && json.data) {
      return { success: true, data: json.data };
    } else {
      return { success: false, error: json.message || 'โครงสร้างข้อมูลตอบกลับไม่ถูกต้อง' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: `ไม่สามารถเชื่อมต่อ Google Sheets ได้: ${message}` };
  }
}

/**
 * Post Action to Google Apps Script Web App
 */
export async function postActionToGas(
  webAppUrl: string,
  action: string,
  payload: unknown
): Promise<{ success: boolean; result?: unknown; error?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('http')) {
    return { success: false, error: 'ไม่มี Web App URL (บันทึกในเครื่อง LocalStorage แล้ว)' };
  }

  try {
    const body = JSON.stringify({
      action,
      payload,
      timestamp: new Date().toISOString(),
    });

    // In browsers, calling GAS Web App doPost usually requires text/plain or json
    const res = await fetch(webAppUrl, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
    });

    const json = await res.json();
    if (json.status === 'success') {
      return { success: true, result: json.result };
    } else {
      return { success: false, error: json.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' };
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    // Note: Due to CORS on some deployments, if fetch fails, local data is already persisted
    return { success: false, error: `GAS Sync Error: ${message}` };
  }
}

/**
 * Test GAS Web App connectivity
 */
export async function testGasConnection(webAppUrl: string): Promise<{ success: boolean; message: string }> {
  const result = await fetchAllFromGas(webAppUrl);
  if (result.success) {
    return { success: true, message: 'เชื่อมต่อ Google Apps Script Web App สำเร็จ! ดึงข้อมูลได้เรียบร้อย' };
  }
  return { success: false, message: result.error || 'การเชื่อมต่อล้มเหลว ตรวจสอบ URL และการตั้งค่า Deploy (Anyone)' };
}
