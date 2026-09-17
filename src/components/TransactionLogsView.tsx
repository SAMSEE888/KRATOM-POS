import { useState, useMemo } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  FileSpreadsheet,
  Filter,
  History,
  RotateCcw,
  Search,
} from 'lucide-react';
import { MovementType, StockLog } from '../types';

interface TransactionLogsViewProps {
  stockLogs: StockLog[];
  onClearLogs?: () => void;
}

export function TransactionLogsView({ stockLogs, onClearLogs }: TransactionLogsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT'>('ALL');
  const [formulaFilter, setFormulaFilter] = useState<'ALL' | 'RED' | 'BM' | 'CUSTOM' | 'OTHER'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'CASH' | 'TRANSFER'>('ALL');

  // Filtered and sorted logs (latest first)
  const filteredLogs = useMemo(() => {
    return stockLogs
      .filter((log) => {
        if (typeFilter !== 'ALL' && log.type !== typeFilter) return false;
        if (formulaFilter !== 'ALL' && log.formulaType !== formulaFilter) return false;
        if (paymentFilter !== 'ALL' && log.paymentMethod !== paymentFilter) return false;
        if (searchTerm) {
          const kw = searchTerm.toLowerCase();
          const matchId = log.id.toLowerCase().includes(kw);
          const matchProduct = log.productName.toLowerCase().includes(kw);
          const matchLot = (log.customerOrLot || '').toLowerCase().includes(kw);
          const matchNotes = (log.notes || '').toLowerCase().includes(kw);
          if (!matchId && !matchProduct && !matchLot && !matchNotes) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [stockLogs, typeFilter, formulaFilter, paymentFilter, searchTerm]);

  // Totals
  const totalVolumeIn = useMemo(
    () => filteredLogs.filter((l) => l.type === 'IN').reduce((sum, l) => sum + l.quantity, 0),
    [filteredLogs]
  );
  const totalVolumeOut = useMemo(
    () => filteredLogs.filter((l) => l.type === 'OUT').reduce((sum, l) => sum + l.quantity, 0),
    [filteredLogs]
  );
  const totalSalesRevenue = useMemo(
    () =>
      filteredLogs
        .filter((l) => l.type === 'OUT')
        .reduce((sum, l) => sum + (l.totalPrice || 0), 0),
    [filteredLogs]
  );

  // CSV Export with UTF-8 BOM for Excel support
  const handleExportCsv = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Type',
      'Product ID',
      'Product Name',
      'Formula Type',
      'Quantity',
      'Remaining Stock',
      'Unit Price (THB)',
      'Total Price (THB)',
      'Estimated Cost (THB)',
      'Payment Method',
      'Customer / Lot',
      'Notes',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.type}"`,
      `"${log.productId}"`,
      `"${log.productName.replace(/"/g, '""')}"`,
      `"${log.formulaType}"`,
      log.quantity,
      log.remainingStock,
      log.unitPrice || 0,
      log.totalPrice || 0,
      log.cost || 0,
      `"${log.paymentMethod || '-'}"`,
      `"${(log.customerOrLot || '').replace(/"/g, '""')}"`,
      `"${(log.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `kratom_pos_stock_logs_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2 font-['Plus_Jakarta_Sans']">
            <History className="w-6 h-6 text-emerald-400" />
            <span>ประวัติธุรกรรม & บันทึกความเคลื่อนไหว (Transaction Logs)</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            ตรวจทานประวัติการขาย การรับเข้าสต๊อก ตรวจสอบย้อนหลัง และส่งออกข้อมูล CSV
          </p>
        </div>

        {/* CSV Export Button */}
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>ส่งออกไฟล์ Excel/CSV (UTF-8)</span>
        </button>
      </div>

      {/* Summary Mini Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-xl border border-white/10">
          <span className="text-[11px] text-slate-400 block font-medium">จำนวนบันทึก (Records)</span>
          <span className="text-lg font-mono font-bold text-white mt-0.5 block">
            {filteredLogs.length} รายการ
          </span>
        </div>
        <div className="glass-panel p-3.5 rounded-xl border border-emerald-500/20">
          <span className="text-[11px] text-emerald-300 block font-medium">ปริมาณรับเข้า (IN)</span>
          <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
            +{totalVolumeIn} ขวด
          </span>
        </div>
        <div className="glass-panel p-3.5 rounded-xl border border-rose-500/20">
          <span className="text-[11px] text-rose-300 block font-medium">ปริมาณขายออก (OUT)</span>
          <span className="text-lg font-mono font-bold text-rose-400 mt-0.5 block">
            -{totalVolumeOut} ขวด
          </span>
        </div>
        <div className="glass-panel p-3.5 rounded-xl border border-sky-500/20">
          <span className="text-[11px] text-sky-300 block font-medium">ยอดขายรวมในตัวกรอง</span>
          <span className="text-lg font-mono font-bold text-sky-400 mt-0.5 block">
            ฿{totalSalesRevenue.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-white/10 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหารหัส ID, สินค้า, ล็อต หรือชื่อลูกค้า..."
              className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Type Filter */}
          <div className="sm:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="ALL">ประเภททั้งหมด</option>
              <option value="IN">รับเข้า [IN]</option>
              <option value="OUT">ขายออก [OUT]</option>
            </select>
          </div>

          {/* Formula Filter */}
          <div className="sm:col-span-2">
            <select
              value={formulaFilter}
              onChange={(e) => setFormulaFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="ALL">สูตรทั้งหมด</option>
              <option value="RED">สูตรฝาแดง</option>
              <option value="BM">สูตร BM</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as any)}
              className="w-full px-2.5 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white"
            >
              <option value="ALL">วิธีชำระทั้งหมด</option>
              <option value="CASH">เงินสด</option>
              <option value="TRANSFER">โอนเงิน</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                <th className="py-3 px-4 font-semibold">วันเวลา</th>
                <th className="py-3 px-4 font-semibold">ประเภท</th>
                <th className="py-3 px-4 font-semibold">สินค้า</th>
                <th className="py-3 px-4 font-semibold text-right">จำนวน</th>
                <th className="py-3 px-4 font-semibold text-right">ยอดเงิน</th>
                <th className="py-3 px-4 font-semibold text-right">สต๊อกคงเหลือ</th>
                <th className="py-3 px-4 font-semibold">วิธีชำระ</th>
                <th className="py-3 px-4 font-semibold">ล็อต / ลูกค้า</th>
                <th className="py-3 px-4 font-semibold">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    ไม่พบข้อมูลธุรกรรมตรงตามเงื่อนไขค้นหา
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isIncoming = log.type === 'IN';
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('th-TH', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4 text-white font-medium">
                        {log.productName}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold whitespace-nowrap">
                        <span className={isIncoming ? 'text-emerald-400' : 'text-rose-400'}>
                          {isIncoming ? `+${log.quantity}` : `-${log.quantity}`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-semibold text-white">
                        {log.totalPrice ? `฿${log.totalPrice.toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        {log.remainingStock}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {log.paymentMethod || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-mono text-[11px] truncate max-w-[150px]">
                        {log.customerOrLot || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-[200px]">
                        {log.notes || '-'}
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
  );
}
