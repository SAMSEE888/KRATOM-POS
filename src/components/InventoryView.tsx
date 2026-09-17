import { useState, useMemo, FormEvent } from 'react';
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Boxes,
  Check,
  Clock,
  Filter,
  Package,
  PackageCheck,
  PackagePlus,
  Plus,
  Search,
} from 'lucide-react';
import { MovementType, Product, StockLog } from '../types';

interface InventoryViewProps {
  products: Product[];
  stockLogs: StockLog[];
  onAddStock: (payload: {
    productId: string;
    productName: string;
    formulaType: 'RED' | 'BM' | 'CUSTOM' | 'OTHER';
    quantity: number;
    lot: string;
    cost: number;
    notes: string;
  }) => Promise<boolean>;
}

export function InventoryView({ products, stockLogs, onAddStock }: InventoryViewProps) {
  // Receive Stock Form State
  const [selectedProductId, setSelectedProductId] = useState<string>(
    products[0]?.id || ''
  );
  const [receiveQuantity, setReceiveQuantity] = useState<number>(20);
  const [lotNumber, setLotNumber] = useState<string>(() => {
    const d = new Date();
    return `LOT-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}-${d.getHours()}${d.getMinutes()}`;
  });
  const [sourceNote, setSourceNote] = useState<string>('ต้มผลิตเองรอบเช้า');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Filter & Search for Movement History
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [filterFormula, setFilterFormula] = useState<string>('ALL');

  // Stock Metrics
  const totalStockCount = useMemo(
    () => products.reduce((acc, p) => acc + (p.stock || 0), 0),
    [products]
  );
  const redStockCount = useMemo(
    () =>
      products
        .filter((p) => p.formulaType === 'RED')
        .reduce((acc, p) => acc + (p.stock || 0), 0),
    [products]
  );
  const bmStockCount = useMemo(
    () =>
      products
        .filter((p) => p.formulaType === 'BM')
        .reduce((acc, p) => acc + (p.stock || 0), 0),
    [products]
  );
  const lowStockItems = useMemo(
    () => products.filter((p) => p.stock <= 5),
    [products]
  );

  // Filtered Movement History (latest first)
  const filteredLogs = useMemo(() => {
    return stockLogs
      .filter((log) => {
        if (filterType !== 'ALL' && log.type !== filterType) return false;
        if (filterFormula !== 'ALL' && log.formulaType !== filterFormula) return false;
        if (searchKeyword) {
          const kw = searchKeyword.toLowerCase();
          const matchName = log.productName.toLowerCase().includes(kw);
          const matchLot = (log.customerOrLot || '').toLowerCase().includes(kw);
          const matchNote = (log.notes || '').toLowerCase().includes(kw);
          if (!matchName && !matchLot && !matchNote) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [stockLogs, filterType, filterFormula, searchKeyword]);

  const handleReceiveStockSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod || receiveQuantity <= 0 || isSubmitting) return;

    setIsSubmitting(true);
    const estCost = (prod.costEstimate || 14) * receiveQuantity;

    const success = await onAddStock({
      productId: prod.id,
      productName: prod.name,
      formulaType: prod.formulaType,
      quantity: receiveQuantity,
      lot: lotNumber.trim() || 'LOT-MANUAL',
      cost: estCost,
      notes: sourceNote.trim() || 'รับเข้าสต๊อกสินค้า',
    });

    setIsSubmitting(false);
    if (success) {
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 3000);
      setReceiveQuantity(20);
      // generate new lot
      const d = new Date();
      setLotNumber(
        `LOT-${d.getFullYear()}${(d.getMonth() + 1).toString().padStart(2, '0')}${d.getDate().toString().padStart(2, '0')}-${d.getHours()}${d.getMinutes()}`
      );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
          <Package className="w-6 h-6 text-emerald-400" />
          <span>ระบบจัดการสต๊อกสินค้า (Inventory Management)</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          สรุปสต๊อกรวม บันทึกรับสินค้าจากการต้ม/ผลิต และประวัติการเคลื่อนไหวสต๊อก (Stock Movement)
        </p>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">สต๊อกรวมทุกสินค้า</span>
            <span className="text-2xl font-extrabold text-white font-mono mt-1 block">
              {totalStockCount} <span className="text-xs text-slate-400 font-sans">ขวด</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        {/* Red Cap Stock */}
        <div className="glass-panel p-4 rounded-2xl border border-rose-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-rose-300 block font-medium">สต๊อกสูตรฝาแดง (RED)</span>
            <span className="text-2xl font-extrabold text-rose-400 font-mono mt-1 block">
              {redStockCount} <span className="text-xs text-slate-400 font-sans">ขวด</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* BM Stock */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-300 block font-medium">สต๊อกสูตร BM (บ๊วย)</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
              {bmStockCount} <span className="text-xs text-slate-400 font-sans">ขวด</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <PackageCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className={`glass-panel p-4 rounded-2xl border flex items-center justify-between ${
          lowStockItems.length > 0
            ? 'border-amber-500/40 bg-amber-950/20'
            : 'border-white/10'
        }`}>
          <div>
            <span className="text-xs text-slate-400 block font-medium">สินค้าใกล้หมด / ขาดสต๊อก</span>
            <span className="text-2xl font-extrabold text-amber-400 font-mono mt-1 block">
              {lowStockItems.length} <span className="text-xs text-slate-400 font-sans">รายการ</span>
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Receive Stock Form on Left, Stock Movement Log on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Receive Form */}
        <div className="lg:col-span-4 glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-white/10">
            <PackagePlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">รับสินค้าเข้าสต๊อก (Stock IN)</h3>
          </div>

          <form onSubmit={handleReceiveStockSubmit} className="space-y-3.5 text-xs">
            {/* Product Selector */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                เลือกสินค้าที่จะรับเข้า *
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                    {p.name} (คงเหลือ {p.stock} ขวด)
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                จำนวนที่รับเข้า (ขวด) *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={receiveQuantity}
                  onChange={(e) => setReceiveQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-sans">
                  ขวด
                </span>
              </div>
            </div>

            {/* Lot Number */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                ล็อตผลิต / รหัสอ้างอิง (Lot Number)
              </label>
              <input
                type="text"
                value={lotNumber}
                onChange={(e) => setLotNumber(e.target.value)}
                placeholder="เช่น LOT-20260912-01"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Source / Notes */}
            <div>
              <label className="text-slate-300 font-medium block mb-1">
                แหล่งที่มา / หมายเหตุ
              </label>
              <input
                type="text"
                value={sourceNote}
                onChange={(e) => setSourceNote(e.target.value)}
                placeholder="เช่น ผลิตเองรอบเช้า, รับมาจากครัวกลาง"
                className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || receiveQuantity <= 0}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isSubmitting ? (
                <span>กำลังบันทึก...</span>
              ) : showSuccessToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>รับเข้าสต๊อกสำเร็จแล้ว!</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>บันทึกรับเข้าสต๊อก (+{receiveQuantity} ขวด)</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right: Movement History Table */}
        <div className="lg:col-span-8 glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Clock className="w-5 h-5 text-sky-400" />
                <span>ประวัติการเคลื่อนไหวสต๊อก (Stock Movement History)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                เรียงลำดับจากล่าสุด แสดงรายการ [IN/OUT] อย่างชัดเจน
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as 'ALL' | 'IN' | 'OUT')}
                className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="ALL">ทุกประเภท (IN/OUT)</option>
                <option value="IN">เฉพาะรับเข้า [IN]</option>
                <option value="OUT">เฉพาะขายออก [OUT]</option>
              </select>

              <select
                value={filterFormula}
                onChange={(e) => setFilterFormula(e.target.value)}
                className="px-2.5 py-1.5 bg-black/40 border border-white/10 rounded-lg text-xs text-white"
              >
                <option value="ALL">ทุกสูตร</option>
                <option value="RED">สูตรฝาแดง</option>
                <option value="BM">สูตร BM</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="ค้นหาชื่อสินค้า, รหัสล็อต หรือหมายเหตุ..."
              className="w-full pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
            />
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-white/10 text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">วันเวลา</th>
                  <th className="py-2.5 px-3 font-semibold">ประเภท</th>
                  <th className="py-2.5 px-3 font-semibold">สินค้า</th>
                  <th className="py-2.5 px-3 font-semibold text-right">จำนวน</th>
                  <th className="py-2.5 px-3 font-semibold text-right">คงเหลือ</th>
                  <th className="py-2.5 px-3 font-semibold">ล็อต / ลูกค้า</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      ไม่พบประวัติการเคลื่อนไหวสต๊อก
                    </td>
                  </tr>
                ) : (
                  filteredLogs.slice(0, 15).map((log) => {
                    const isIncoming = log.type === 'IN';
                    return (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-2.5 px-3 text-slate-400 font-mono whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('th-TH', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                              isIncoming
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {isIncoming ? (
                              <>
                                <ArrowDownLeft className="w-3 h-3" />
                                <span>IN</span>
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" />
                                <span>OUT</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-white font-medium">
                          <div>{log.productName}</div>
                          {log.notes && (
                            <span className="text-[10px] text-slate-500">{log.notes}</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold whitespace-nowrap">
                          <span className={isIncoming ? 'text-emerald-400' : 'text-rose-400'}>
                            {isIncoming ? `+${log.quantity}` : `-${log.quantity}`}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {log.remainingStock}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] truncate max-w-[140px]">
                          {log.customerOrLot || '-'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
