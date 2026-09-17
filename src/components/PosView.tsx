import { useState } from 'react';
import {
  AlertCircle,
  Banknote,
  Check,
  CreditCard,
  Minus,
  Plus,
  Printer,
  QrCode,
  RotateCcw,
  ShoppingBag,
  Trash2,
  User,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { CartItem, PaymentMethod, Product, StockLog } from '../types';

interface PosViewProps {
  products: Product[];
  onCheckout: (
    items: CartItem[],
    paymentMethod: PaymentMethod,
    customerOrNote: string
  ) => Promise<{ success: boolean; error?: string; logs?: StockLog[] }>;
  onUpdateStock: (productId: string, newStock: number) => void;
}

export function PosView({ products, onCheckout }: PosViewProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerNote, setCustomerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<{
    items: CartItem[];
    paymentMethod: PaymentMethod;
    customerNote: string;
    totalAmount: number;
    totalBottles: number;
    timestamp: string;
    receiptId: string;
  } | null>(null);

  // Cart operations
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Cannot exceed stock
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            if (nextQty <= 0) return null;
            if (nextQty > item.product.stock) return item; // limit to available stock
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => setCart([]);

  const totalAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalBottles = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleProcessCheckout = async () => {
    if (cart.length === 0 || isSubmitting) return;

    setIsSubmitting(true);
    const orderData = {
      items: [...cart],
      paymentMethod,
      customerNote: customerNote.trim() || 'ลูกค้าหน้าร้าน',
      totalAmount,
      totalBottles,
      timestamp: new Date().toISOString(),
      receiptId: `REC-${Date.now().toString().slice(-6)}`,
    };

    const result = await onCheckout(cart, paymentMethod, customerNote);
    setIsSubmitting(false);

    if (result.success) {
      // Trigger confetti celebration
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#34d399', '#10b981', '#059669', '#6ee7b7'],
        });
      } catch {
        // ignore if confetti blocked
      }

      setCompletedOrder(orderData);
      setCart([]);
      setCustomerNote('');
    }
  };

  // Stock status helper
  const getStockStatus = (stock: number) => {
    if (stock <= 0) return { label: 'สินค้าหมด', color: 'bg-rose-500/20 text-rose-400 border-rose-500/30' };
    if (stock <= 5) return { label: `ใกล้หมด (${stock})`, color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
    if (stock <= 20) return { label: `ปานกลาง (${stock})`, color: 'bg-sky-500/20 text-sky-400 border-sky-500/30' };
    return { label: `พร้อมขาย (${stock})`, color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* 2-Column Responsive Layout: Catalog Grid on Left, Sticky Cart on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT: Product Catalog */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white font-['Plus_Jakarta_Sans'] flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <span>รายการสินค้าหน้าร้าน (Product Catalog)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                เลือกสินค้าเพื่อเพิ่มลงตะกร้าขาย สต๊อกอัปเดตแบบเรียลไทม์
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-slate-300">
              {products.length} รายการ
            </span>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {products.map((product) => {
              const status = getStockStatus(product.stock);
              const inCartItem = cart.find((it) => it.product.id === product.id);
              const isOutOfStock = product.stock <= 0;
              const isRed = product.formulaType === 'RED';
              const isBm = product.formulaType === 'BM';

              return (
                <div
                  key={product.id}
                  id={`product-card-${product.id}`}
                  className={`glass-panel p-4 rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                    isOutOfStock
                      ? 'opacity-50 grayscale border-slate-800'
                      : 'hover:border-emerald-500/40 hover:shadow-lg hover:shadow-emerald-500/5'
                  }`}
                >
                  <div>
                    {/* Header: Formula Badge & Stock status */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md border ${
                          isRed
                            ? 'bg-rose-950/60 text-rose-300 border-rose-500/30'
                            : isBm
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isRed ? 'ฝาแดง RED' : isBm ? 'สูตร BM' : product.formulaType}
                      </span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Product Name */}
                    <h3 className="font-semibold text-sm sm:text-base text-white line-clamp-2 leading-snug">
                      {product.name}
                    </h3>

                    {/* Description */}
                    {product.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Pricing & Add Button */}
                  <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block">ราคาขาย</span>
                      <span className="text-lg font-bold text-emerald-400 font-mono">
                        ฿{product.price.toFixed(0)}
                      </span>
                    </div>

                    <button
                      id={`btn-add-to-cart-${product.id}`}
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock || (inCartItem && inCartItem.quantity >= product.stock)}
                      className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                        isOutOfStock
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : inCartItem
                          ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20'
                          : 'bg-white/10 hover:bg-emerald-500 hover:text-black text-white'
                      }`}
                    >
                      {inCartItem ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>ในตะกร้า ({inCartItem.quantity})</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>เพิ่มลงตะกร้า</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Cart & Checkout Panel */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="glass-panel rounded-2xl p-5 border border-white/10 shadow-2xl">
            {/* Cart Header */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">ตะกร้าสินค้า</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-xs font-bold">
                  {totalBottles} ขวด
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-rose-400 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>ล้าง</span>
                </button>
              )}
            </div>

            {/* Cart Items List */}
            <div className="py-3 max-h-60 overflow-y-auto space-y-2.5">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <span>ยังไม่มีสินค้าในตะกร้า</span>
                  <p className="text-[11px] text-slate-600 mt-1">
                    คลิกปุ่ม &quot;เพิ่มลงตะกร้า&quot; จากรายการด้านซ้าย
                  </p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-medium text-white truncate">
                        {item.product.name}
                      </h4>
                      <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span className="font-mono text-emerald-400">
                          ฿{item.product.price}
                        </span>
                        <span>x</span>
                        <span className="font-mono text-white">{item.quantity}</span>
                        <span>=</span>
                        <span className="font-mono font-bold text-white">
                          ฿{(item.product.price * item.quantity).toFixed(0)}
                        </span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-bold text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white disabled:opacity-30"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 flex items-center justify-center ml-1"
                        title="ลบ"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="pt-3 border-t border-white/10 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">
                  ช่องทางการชำระเงิน
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      paymentMethod === 'CASH'
                        ? 'bg-emerald-500 text-black border-emerald-400 shadow-md shadow-emerald-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>เงินสด (CASH)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                      paymentMethod === 'TRANSFER'
                        ? 'bg-sky-500 text-black border-sky-400 shadow-md shadow-sky-500/20'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>โอนเงิน (QR)</span>
                  </button>
                </div>
              </div>

              {/* Transfer Helper / PromptPay QR button */}
              {paymentMethod === 'TRANSFER' && (
                <button
                  onClick={() => setShowQrModal(true)}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-950/40 border border-sky-500/30 text-sky-300 text-xs flex items-center justify-center gap-2 hover:bg-sky-900/40 transition-colors"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>แสดง QR Code พร้อมเพย์รับเงิน</span>
                </button>
              )}

              {/* Customer Name / Note Input */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  ชื่อลูกค้า / หมายเหตุบิล
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="เช่น คุณเอก, ลูกค้าหน้าร้าน, ไรเดอร์"
                    className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Summary Totals */}
              <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-1.5">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>จำนวนรวม:</span>
                  <span className="font-mono text-white font-bold">{totalBottles} ขวด</span>
                </div>
                <div className="flex justify-between items-baseline pt-1 border-t border-white/5">
                  <span className="text-sm font-semibold text-white">ยอดสุทธิที่ต้องชำระ:</span>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    ฿{totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                id="btn-checkout-confirm"
                onClick={handleProcessCheckout}
                disabled={cart.length === 0 || isSubmitting}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-black font-bold text-sm shadow-xl shadow-emerald-500/25 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">กำลังบันทึกข้อมูล...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>ยืนยันการขาย (CHECKOUT)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: QR Code Helper */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-xs w-full text-center border border-white/10 shadow-2xl relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-white mb-1">สแกนชำระเงินผ่าน QR Code</h4>
            <p className="text-xs text-slate-400 mb-4">พร้อมเพย์ร้าน Kratom SAMSEE</p>

            {/* Simulated PromptPay QR Visual */}
            <div className="bg-white p-4 rounded-xl mx-auto w-48 h-48 flex flex-col items-center justify-center shadow-inner">
              <QrCode className="w-36 h-36 text-slate-900" />
            </div>

            <div className="mt-4 pt-3 border-t border-white/10">
              <span className="text-xs text-slate-400">ยอดชำระ</span>
              <div className="text-xl font-mono font-bold text-emerald-400">
                ฿{totalAmount.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="mt-4 w-full py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      )}

      {/* MODAL: Digital Receipt & Success Printout */}
      {completedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="glass-panel p-6 rounded-2xl max-w-md w-full border border-emerald-500/30 shadow-2xl relative">
            <div className="text-center pb-4 border-b border-white/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-2 text-emerald-400">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">บันทึกการขายสำเร็จ!</h3>
              <p className="text-xs text-slate-400">ใบเสร็จรับเงินอิเล็กทรอนิกส์ (Digital Receipt)</p>
            </div>

            {/* Receipt Body */}
            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>เลขที่บิล:</span>
                <span className="font-mono text-white font-semibold">{completedOrder.receiptId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>วันเวลา:</span>
                <span className="font-mono text-white">
                  {new Date(completedOrder.timestamp).toLocaleString('th-TH')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>ลูกค้า / หมายเหตุ:</span>
                <span className="text-white">{completedOrder.customerNote}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>วิธีชำระ:</span>
                <span className="text-emerald-400 font-semibold">
                  {completedOrder.paymentMethod === 'CASH' ? 'เงินสด (CASH)' : 'โอนเงิน (TRANSFER)'}
                </span>
              </div>

              {/* Items Table */}
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                {completedOrder.items.map((it) => (
                  <div key={it.product.id} className="flex justify-between text-slate-300">
                    <span>
                      {it.product.name} x{it.quantity}
                    </span>
                    <span className="font-mono text-white font-medium">
                      ฿{(it.product.price * it.quantity).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline text-sm font-bold">
                <span className="text-white">ยอดรวมทั้งสิ้น ({completedOrder.totalBottles} ขวด):</span>
                <span className="text-xl font-mono text-emerald-400">
                  ฿{completedOrder.totalAmount.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
              <button
                onClick={() => setCompletedOrder(null)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-xs transition-colors"
              >
                เสร็จสิ้น / ขายต่อ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
