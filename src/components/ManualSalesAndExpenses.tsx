import { useState, useMemo, FormEvent } from 'react';
import {
  AlertCircle,
  Calendar,
  Check,
  CircleDollarSign,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Plus,
  Receipt,
  Trash2,
  Wallet,
} from 'lucide-react';
import { ExpenseCategory, ExpenseItem, PaymentMethod, Product, StockLog } from '../types';

interface ManualSalesAndExpensesProps {
  products: Product[];
  expenses: ExpenseItem[];
  onAddManualSale: (sale: {
    productId: string;
    productName: string;
    formulaType: 'RED' | 'BM' | 'CUSTOM' | 'OTHER';
    quantity: number;
    unitPrice: number;
    paymentMethod: PaymentMethod;
    timestamp: string;
    customerOrNote: string;
  }) => Promise<boolean>;
  onAddExpense: (expense: {
    category: ExpenseCategory;
    description: string;
    amount: number;
    quantity?: number;
    unit?: string;
    timestamp: string;
    notes?: string;
  }) => Promise<boolean>;
  onDeleteExpense: (expenseId: string) => Promise<boolean>;
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'ใบกระท่อม',
  'โค้ก',
  'ยาแก้ไอฝาแดง',
  'ยาแก้ไอ BM',
  'ขวด/สติกเกอร์',
  'แก๊ส/ไฟ',
  'บ๊วย',
  'อื่นๆ',
];

export function ManualSalesAndExpenses({
  products,
  expenses,
  onAddManualSale,
  onAddExpense,
  onDeleteExpense,
}: ManualSalesAndExpensesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'MANUAL_SALE' | 'EXPENSE'>('EXPENSE');

  // Manual Sale State
  const [saleProductId, setSaleProductId] = useState<string>(products[0]?.id || '');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleUnitPrice, setSaleUnitPrice] = useState<number>(35);
  const [salePayment, setSalePayment] = useState<PaymentMethod>('CASH');
  const [saleDateTime, setSaleDateTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [saleNotes, setSaleNotes] = useState<string>('บันทึกขายย้อนหลัง');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);
  const [saleSuccess, setSaleSuccess] = useState(false);

  // Expense Form State
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('โค้ก');
  const [expDescription, setExpDescription] = useState<string>('');
  const [expAmount, setExpAmount] = useState<number>(100);
  const [expQty, setExpQty] = useState<number>(1);
  const [expUnit, setExpUnit] = useState<string>('หน่วย');
  const [expDateTime, setExpDateTime] = useState<string>(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  });
  const [expNotes, setExpNotes] = useState<string>('');
  const [isSubmittingExp, setIsSubmittingExp] = useState(false);
  const [expSuccess, setExpSuccess] = useState(false);

  // Filter expenses
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');

  // Handle Product Change in Manual Sale
  const handleProductChange = (prodId: string) => {
    setSaleProductId(prodId);
    const prod = products.find((p) => p.id === prodId);
    if (prod) {
      setSaleUnitPrice(prod.price);
    }
  };

  // Submit Manual Sale
  const handleSubmitSale = async (e: FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === saleProductId);
    if (!prod || saleQty <= 0 || isSubmittingSale) return;

    setIsSubmittingSale(true);
    const success = await onAddManualSale({
      productId: prod.id,
      productName: prod.name,
      formulaType: prod.formulaType,
      quantity: saleQty,
      unitPrice: saleUnitPrice,
      paymentMethod: salePayment,
      timestamp: new Date(saleDateTime).toISOString(),
      customerOrNote: saleNotes.trim() || 'บันทึกขายย้อนหลัง',
    });

    setIsSubmittingSale(false);
    if (success) {
      setSaleSuccess(true);
      setTimeout(() => setSaleSuccess(false), 3000);
      setSaleQty(1);
    }
  };

  // Submit Expense
  const handleSubmitExpense = async (e: FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0 || isSubmittingExp) return;

    setIsSubmittingExp(true);
    const success = await onAddExpense({
      category: expCategory,
      description: expDescription.trim() || expCategory,
      amount: expAmount,
      quantity: expQty,
      unit: expUnit,
      timestamp: new Date(expDateTime).toISOString(),
      notes: expNotes.trim(),
    });

    setIsSubmittingExp(false);
    if (success) {
      setExpSuccess(true);
      setTimeout(() => setExpSuccess(false), 3000);
      setExpDescription('');
      setExpAmount(100);
      setExpNotes('');
    }
  };

  // Expenses filtered & sorted latest first
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((exp) => {
        if (selectedCategoryFilter !== 'ALL' && exp.category !== selectedCategoryFilter)
          return false;
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [expenses, selectedCategoryFilter]);

  const totalExpenseSum = useMemo(
    () => expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0),
    [expenses]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
            <CircleDollarSign className="w-6 h-6 text-emerald-400" />
            <span>บันทึกการขายย้อนหลัง & บันทึกรายจ่าย</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ลงรายการขายย้อนเวลา และบริหารจัดการรายจ่ายต้นทุนการผลิตแยกตามหมวดหมู่อย่างละเอียด
          </p>
        </div>

        {/* Toggle sub-tabs */}
        <div className="glass-panel p-1 rounded-xl border border-white/10 flex gap-1 self-start sm:self-auto">
          <button
            onClick={() => setActiveSubTab('EXPENSE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'EXPENSE'
                ? 'bg-rose-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>บันทึกรายจ่าย (Expenses)</span>
          </button>
          <button
            onClick={() => setActiveSubTab('MANUAL_SALE')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeSubTab === 'MANUAL_SALE'
                ? 'bg-emerald-500 text-black shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>บันทึกขายย้อนหลัง (Manual Sales)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: EXPENSE TRACKER */}
      {activeSubTab === 'EXPENSE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Form: Add Expense */}
          <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" />
                <span>ลงบันทึกรายจ่ายใหม่</span>
              </h3>
              <span className="text-[11px] text-slate-400">หักลบในกำไรสุทธิอัตโนมัติ</span>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-3.5 text-xs">
              {/* Category */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  หมวดหมู่รายจ่าย *
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setExpCategory(cat)}
                      className={`p-2 rounded-lg text-left text-xs transition-colors border ${
                        expCategory === cat
                          ? 'bg-rose-500/20 border-rose-500 text-rose-200 font-semibold'
                          : 'bg-white/[0.03] border-white/5 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  รายละเอียดรายจ่าย
                </label>
                <input
                  type="text"
                  value={expDescription}
                  onChange={(e) => setExpDescription(e.target.value)}
                  placeholder="เช่น ซื้อโค้กขวด 1.5L แม็คโคร, ค่าใบกระท่อมสด 5กก."
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Amount & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    ยอดเงินรวม (บาท) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={expAmount}
                    onChange={(e) => setExpAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="text-slate-300 font-medium block mb-1">
                    จำนวน / หน่วย
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={expQty}
                      onChange={(e) => setExpQty(Number(e.target.value))}
                      className="w-16 px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                    />
                    <input
                      type="text"
                      value={expUnit}
                      onChange={(e) => setExpUnit(e.target.value)}
                      placeholder="หน่วย เช่น ลิตร, กก., ถัง"
                      className="flex-1 px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* DateTime Picker */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  วันเวลาที่จ่ายเงิน
                </label>
                <input
                  type="datetime-local"
                  value={expDateTime}
                  onChange={(e) => setExpDateTime(e.target.value)}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  หมายเหตุ / สถานที่ซื้อ
                </label>
                <input
                  type="text"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  placeholder="เช่น บิลร้านเจริญภัณฑ์, จ่ายเงินสด"
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmittingExp || expAmount <= 0}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-bold text-xs shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
              >
                {isSubmittingExp ? (
                  <span>กำลังบันทึก...</span>
                ) : expSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>บันทึกรายจ่ายสำเร็จ!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>บันทึกรายจ่าย (฿{expAmount.toLocaleString()})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right List: Recent Expenses */}
          <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div>
                <h3 className="font-bold text-white text-base">ประวัติรายจ่ายล่าสุด</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  รวมรายจ่ายทั้งหมด:{' '}
                  <span className="font-mono font-bold text-rose-400 text-sm">
                    ฿{totalExpenseSum.toLocaleString()}
                  </span>
                </p>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="ALL">ทุกหมวดหมู่รายจ่าย</option>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Expenses List */}
            <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
              {filteredExpenses.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  ยังไม่มีประวัติรายจ่ายในหมวดหมู่นี้
                </div>
              ) : (
                filteredExpenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 flex items-center justify-between gap-3 transition-colors text-xs"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {exp.category}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {new Date(exp.timestamp).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      </div>
                      <h4 className="text-white font-medium truncate">{exp.description}</h4>
                      {exp.notes && (
                        <p className="text-[11px] text-slate-400 mt-0.5">{exp.notes}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-sm font-mono font-bold text-rose-400 block">
                          -฿{exp.amount.toLocaleString()}
                        </span>
                        {exp.quantity && exp.unit && (
                          <span className="text-[10px] text-slate-500">
                            {exp.quantity} {exp.unit}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="ลบรายการรายจ่ายนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MANUAL BACKDATED SALES */}
      {activeSubTab === 'MANUAL_SALE' && (
        <div className="max-w-2xl mx-auto glass-panel p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" />
              <span>บันทึกการขายย้อนหลัง (Manual Sales Entry)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              ใช้กรณีลืมกดขายหน้าร้าน หรือต้องการลงประวัติการขายย้อนหลัง ระบบจะตัดสต๊อกและคำนวณกำไรตามวันเวลาที่ระบุ
            </p>
          </div>

          <form onSubmit={handleSubmitSale} className="space-y-4 text-xs">
            {/* Product Selector */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                เลือกสินค้าที่ขาย *
              </label>
              <select
                value={saleProductId}
                onChange={(e) => handleProductChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name} (ราคา ฿{p.price} | สต๊อกคงเหลือ {p.stock} ขวด)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity & Unit Price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  จำนวนที่ขาย (ขวด) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={saleQty}
                  onChange={(e) => setSaleQty(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold text-base"
                />
              </div>
              <div>
                <label className="text-slate-300 font-medium block mb-1">
                  ราคาต่อหน่วย (บาท) *
                </label>
                <input
                  type="number"
                  min="1"
                  value={saleUnitPrice}
                  onChange={(e) => setSaleUnitPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono font-bold text-base"
                />
              </div>
            </div>

            {/* DateTime Picker */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                วันและเวลาที่เกิดการขาย *
              </label>
              <input
                type="datetime-local"
                value={saleDateTime}
                onChange={(e) => setSaleDateTime(e.target.value)}
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
              />
            </div>

            {/* Payment Method */}
            <div>
              <label className="text-slate-300 font-medium block mb-1.5">
                วิธีชำระเงิน
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSalePayment('CASH')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    salePayment === 'CASH'
                      ? 'bg-emerald-500 text-black border-emerald-400'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  <span>เงินสด (CASH)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSalePayment('TRANSFER')}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                    salePayment === 'TRANSFER'
                      ? 'bg-sky-500 text-black border-sky-400'
                      : 'bg-white/5 border-white/10 text-slate-300'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>โอนเงิน (TRANSFER)</span>
                </button>
              </div>
            </div>

            {/* Notes / Customer Name */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                ชื่อลูกค้า / หมายเหตุ
              </label>
              <input
                type="text"
                value={saleNotes}
                onChange={(e) => setSaleNotes(e.target.value)}
                placeholder="เช่น ขายหน้าร้านเมื่อวาน, สั่งผ่านไลน์"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white"
              />
            </div>

            {/* Summary Box */}
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex justify-between items-center text-xs">
              <span className="text-slate-400">ยอดขายรวม:</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                ฿{(saleQty * saleUnitPrice).toLocaleString()}
              </span>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmittingSale || saleQty <= 0}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSubmittingSale ? (
                <span>กำลังบันทึก...</span>
              ) : saleSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>บันทึกการขายสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>ยืนยันบันทึกการขายย้อนหลัง</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
