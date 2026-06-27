import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Trash2, 
  Minus, 
  Plus, 
  ArrowRight, 
  CreditCard, 
  Landmark, 
  MessageSquare,
  CheckCircle,
  ShieldCheck,
  FileText,
  Printer
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";

type PaymentMethod = "mpesa" | "airtel" | "bank" | "card" | "gpay" | "international";

export function CartDrawer() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart
  } = useCart();

  // Expanded checkout states:
  // "cart" -> "register" -> "payment" -> "processing" -> "success"
  const [checkoutStep, setCheckoutStep] = useState<"cart" | "register" | "payment" | "processing" | "success">("cart");
  
  // Account Registration Details
  const [regName, setRegName] = useState("");
  const [regIdNumber, setRegIdNumber] = useState("");
  const [regCounty, setRegCounty] = useState("");
  const [regAgriType, setRegAgriType] = useState("Maize Farming");

  // Proforma Invoice Generation
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceNumber] = useState(() => `MQ-CART-${Math.floor(100000 + Math.random() * 900000)}`);
  const [invoiceDate] = useState(() => new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }));

  // Load registration details from localStorage if present
  useEffect(() => {
    try {
      const stored = localStorage.getItem("mqulima_user_account");
      if (stored) {
        const parsed = JSON.parse(stored);
        setRegName(parsed.name || "");
        setRegIdNumber(parsed.idNumber || "");
        setRegCounty(parsed.county || "");
        setRegAgriType(parsed.natureOfAgriculture || "Maize Farming");
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Payment Details
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("mpesa");
  const [phoneInput, setPhoneInput] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  const [countdown, setCountdown] = useState(5);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const vatAmount = subtotal * 0.16;
  const deliveryFee = subtotal > 2000 ? 0 : 250;
  const total = subtotal + vatAmount + deliveryFee;

  // Reset steps when drawer opens/closes
  useEffect(() => {
    if (!cartOpen) {
      setCheckoutStep("cart");
    }
  }, [cartOpen]);

  // STK Push / Processing Countdown Simulator
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (checkoutStep === "processing" && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (checkoutStep === "processing" && countdown === 0) {
      setCheckoutStep("success");
      clearCart();
      toast.success("Order Placed Successfully!", {
        description: `Verified payment of KES ${total.toLocaleString()}`,
      });
    }
    return () => clearTimeout(timer);
  }, [checkoutStep, countdown, clearCart, total]);

  const handleStartCheckout = () => {
    setCheckoutStep("register");
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regIdNumber.trim() || !regCounty.trim()) {
      toast.error("Please fill in all registration fields.");
      return;
    }
    
    // Save registration details to local storage
    try {
      localStorage.setItem("mqulima_user_account", JSON.stringify({
        name: regName,
        idNumber: regIdNumber,
        county: regCounty,
        natureOfAgriculture: regAgriType
      }));
    } catch (e) {
      console.error("Local storage error", e);
    }

    setCheckoutStep("payment");
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMethod === "mpesa" || selectedMethod === "airtel") {
      if (!/^(07|01|254)\d{8}$/.test(phoneInput.trim())) {
        toast.error("Please enter a valid mobile number (e.g. 0712345678)");
        return;
      }
    } else if (selectedMethod === "card") {
      if (!cardNumber.trim() || !cardExpiry.trim() || !cardCvv.trim()) {
        toast.error("Please fill out card details.");
        return;
      }
    }
    
    setCountdown(5);
    setCheckoutStep("processing");
  };

  // WhatsApp Checkout direct from cart
  const handleWhatsAppCartCheckout = () => {
    if (cartItems.length === 0) return;
    
    let itemRows = "";
    cartItems.forEach((item, index) => {
      itemRows += `${index + 1}. ${item.product.name} x${item.quantity} - KSh ${(item.product.price * item.quantity).toLocaleString()}\n`;
    });

    const regSnippet = regName 
      ? `\n*Customer details:*\nName: ${regName}\nID Number: ${regIdNumber}\nLocation: ${regCounty}\nFarming: ${regAgriType}\n` 
      : "";

    const message = `Hello Mqulima agent, I want to order these items via WhatsApp:\n
*Items:*\n${itemRows}
*Subtotal:* KSh ${subtotal.toLocaleString()}
*Delivery:* KSh ${deliveryFee.toLocaleString()}
*Total Amount:* KSh ${total.toLocaleString()}${regSnippet}
Please assist me in finalizing my order!`;

    window.open(`https://wa.me/254700000000?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <AnimatePresence>
      {cartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden font-sans">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setCartOpen(false)}
          />

          <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col text-left"
            >
              {/* Header */}
              <div className="p-6 border-b border-[#F0F0F0] flex items-center justify-between bg-white">
                <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#1A1A1A]">
                  {checkoutStep === "cart" && `My Shopping Cart (${cartItems.length})`}
                  {checkoutStep === "register" && "Account Registration"}
                  {checkoutStep === "payment" && "Choose Payment Channel"}
                  {checkoutStep === "processing" && "Processing Transaction"}
                  {checkoutStep === "success" && "Order Success"}
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-[#6B7280] hover:text-[#1A1A1A] transition"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Items / Forms */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                
                {/* STEP 1: CART VIEW */}
                {checkoutStep === "cart" && (
                  <>
                    {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <span className="text-4xl">🛒</span>
                        <h3 className="mt-4 text-xs font-bold text-[#1A1A1A]">Your cart is empty</h3>
                        <p className="mt-1 text-[11px] text-[#6B7280] max-w-[220px]">
                          Explore our agrovets store and pick farm essentials.
                        </p>
                        <button
                          onClick={() => setCartOpen(false)}
                          className="mt-6 rounded-lg bg-[#2D6A4F] px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-[#1A5438]"
                        >
                          Start Shopping
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div
                            key={item.product.id}
                            className="flex items-center gap-4 py-3 border-b border-[#F0F0F0] last:border-none"
                          >
                            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#FAFAF8] border border-[#E5E7EB] p-1">
                              <img
                                src={item.product.image || '/placeholder-product.png'}
                                alt={item.product.name}
                                className="h-full w-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder-product.png';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-[#1A1A1A] truncate">{item.product.name}</h4>
                              <span className="text-[10px] text-[#6B7280]">per {item.product.unit}</span>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs font-bold text-[#2D6A4F]">
                                  KES {item.product.price.toLocaleString()}
                                </span>
                                <div className="flex items-center border border-[#E5E7EB] rounded-md bg-white">
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                                    className="p-1 text-[#6B7280] hover:text-[#1A1A1A]"
                                  >
                                    <Minus className="h-3 w-3" />
                                  </button>
                                  <span className="px-2 text-[11px] font-bold text-[#1A1A1A]">{item.quantity}</span>
                                  <button
                                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                    className="p-1 text-[#6B7280] hover:text-[#1A1A1A]"
                                  >
                                    <Plus className="h-3 w-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => removeFromCart(item.product.id)}
                              className="text-[#6B7280] hover:text-red-500 self-start p-1"
                              aria-label="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* STEP 2: USER ACCOUNT REGISTRATION (Required for finalizing purchase) */}
                {checkoutStep === "register" && (
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 py-2">
                    <div className="bg-[#FAF8F5] border border-[#F5A623]/25 rounded-none p-4 text-[11px] text-[#1A1A1A] space-y-1">
                      <strong className="font-bold block text-[#F5A623]">Customer Account Required</strong>
                      <p className="text-xs text-[#6B7280] leading-relaxed">
                        To finalize your purchase, register your farmer profile. This enables direct seed certification tracking and specialized local agronomist deliveries.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Full Name</label>
                      <input
                        type="text"
                        required
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        placeholder="e.g. Timothy Kiprono"
                        className="w-full rounded-none border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">National ID Number</label>
                      <input
                        type="text"
                        required
                        value={regIdNumber}
                        onChange={(e) => setRegIdNumber(e.target.value)}
                        placeholder="e.g. 34567890"
                        className="w-full rounded-none border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Delivery Destination / County</label>
                      <input
                        type="text"
                        required
                        value={regCounty}
                        onChange={(e) => setRegCounty(e.target.value)}
                        placeholder="e.g. Eldoret, Uasin Gishu"
                        className="w-full rounded-none border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F] focus:bg-white transition"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Nature of Agriculture</label>
                      <select
                        value={regAgriType}
                        onChange={(e) => setRegAgriType(e.target.value)}
                        className="w-full rounded-none border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-2.5 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F] focus:bg-white transition cursor-pointer"
                      >
                        <option value="Dairy Cattle">Dairy Cattle / Livestock</option>
                        <option value="Maize Farming">Maize Cultivation</option>
                        <option value="Vegetables & Horticulture">Vegetables & Horticulture</option>
                        <option value="Poultry farming">Poultry Farming</option>
                        <option value="Mixed Agricultural Practices">Mixed Farming</option>
                      </select>
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-none bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-md hover:bg-[#1A5438] transition flex items-center justify-center gap-1.5 uppercase tracking-wider"
                    >
                      Proceed to Payment <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutStep("cart")}
                      className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A]"
                    >
                      ← Back to Cart
                    </button>
                  </form>
                )}

                {/* STEP 3: MULTI-CHANNEL PAYMENT GATEWAYS */}
                {checkoutStep === "payment" && (
                  <form onSubmit={handleProcessPayment} className="space-y-5 py-2">
                    
                    {/* Method Selector Tabs */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-[#6B7280]">Choose Payment Channel</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setSelectedMethod("mpesa"); setPhoneInput(""); }}
                          className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition ${
                            selectedMethod === "mpesa"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]"
                              : "border-[#E5E7EB] hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <span className="text-lg">🟢</span>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block">M-Pesa</strong>
                            <span className="text-[9px] text-[#6B7280]">STK Push query</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => { setSelectedMethod("airtel"); setPhoneInput(""); }}
                          className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition ${
                            selectedMethod === "airtel"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]"
                              : "border-[#E5E7EB] hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <span className="text-lg">🔴</span>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block">Airtel Money</strong>
                            <span className="text-[9px] text-[#6B7280]">Airtel Money Push</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("bank")}
                          className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition ${
                            selectedMethod === "bank"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]"
                              : "border-[#E5E7EB] hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <Landmark className="h-5 w-5 text-gray-500" />
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block">Bank Transfer</strong>
                            <span className="text-[9px] text-[#6B7280]">EFT / Bank Deposit</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("card")}
                          className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition ${
                            selectedMethod === "card"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]"
                              : "border-[#E5E7EB] hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <CreditCard className="h-5 w-5 text-gray-500" />
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block">Card Pay</strong>
                            <span className="text-[9px] text-[#6B7280]">Visa, Mastercard</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("gpay")}
                          className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition ${
                            selectedMethod === "gpay"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]"
                              : "border-[#E5E7EB] hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <span className="text-lg">📱</span>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block">G-Pay</strong>
                            <span className="text-[9px] text-[#6B7280]">Google Wallet</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedMethod("international")}
                          className={`p-3 rounded-none border text-left flex items-center gap-2.5 transition ${
                            selectedMethod === "international"
                              ? "border-[#2D6A4F] bg-[#2D6A4F]/5 text-[#2D6A4F]"
                              : "border-[#E5E7EB] hover:border-gray-300 text-gray-700"
                          }`}
                        >
                          <span className="text-lg">🌐</span>
                          <div className="text-left leading-none">
                            <strong className="text-xs font-bold block">International</strong>
                            <span className="text-[9px] text-[#6B7280]">PayPal / Stripe</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Method Content Inputs */}
                    <div className="bg-[#FAFAF8] border border-[#E5E7EB] rounded-none p-4">
                      
                      {/* M-PESA */}
                      {selectedMethod === "mpesa" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-[#2D6A4F] block">🟢 Safaricom M-Pesa STK Push</span>
                          <p className="text-[10px] text-[#6B7280] leading-relaxed">
                            Enter your Safaricom phone number. We will send an STK prompt demanding payment PIN on your device.
                          </p>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#6B7280] uppercase">M-Pesa Mobile Number</label>
                            <input
                              type="tel"
                              required
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="e.g. 0712345678"
                              className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                            />
                          </div>
                        </div>
                      )}

                      {/* AIRTEL MONEY */}
                      {selectedMethod === "airtel" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-red-600 block">🔴 Airtel Money Instant Checkout</span>
                          <p className="text-[10px] text-[#6B7280] leading-relaxed">
                            Enter your Airtel Money registered number. Confirm the prompt on your phone screen.
                          </p>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#6B7280] uppercase">Airtel Mobile Number</label>
                            <input
                              type="tel"
                              required
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              placeholder="e.g. 0732345678"
                              className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                            />
                          </div>
                        </div>
                      )}

                      {/* BANK TRANSFER */}
                      {selectedMethod === "bank" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-blue-600 block">🏢 Direct Bank Transfer Details</span>
                          <p className="text-[10px] text-[#6B7280] leading-relaxed">
                            Transfer the total amount to Mqulima bank account. Dispatch happens once transaction confirms.
                          </p>
                          <div className="bg-white border border-gray-150 rounded-none p-3 text-[10px] space-y-1 text-gray-700 font-mono">
                            <div><strong>Bank:</strong> KCB Bank Kenya</div>
                            <div><strong>Account Name:</strong> MQULIMA ECOSYSTEM LTD</div>
                            <div><strong>Account Number:</strong> 1209 8837 9901</div>
                            <div><strong>Branch:</strong> Nakuru Branch</div>
                            <div><strong>Reference:</strong> ID Number: {regIdNumber}</div>
                          </div>
                          <p className="text-[9px] text-[#F5A623] italic">
                            *Transfer receipts should be emailed to accounts@mqulima.com or uploaded on live chat.
                          </p>
                        </div>
                      )}

                      {/* CARD */}
                      {selectedMethod === "card" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-700 block">💳 Credit / Debit Card</span>
                          <div className="space-y-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-[#6B7280] uppercase">Card Number</label>
                              <input
                                type="text"
                                placeholder="4111 2222 3333 4444"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(e.target.value)}
                                className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#6B7280] uppercase">Expiry</label>
                                <input
                                  type="text"
                                  placeholder="MM/YY"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-[#6B7280] uppercase">CVV</label>
                                <input
                                  type="password"
                                  placeholder="123"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value)}
                                  className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* G-PAY */}
                      {selectedMethod === "gpay" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-700 block">📱 Google Pay Wallet</span>
                          <p className="text-[10px] text-[#6B7280] leading-relaxed">
                            Confirm transaction authentication in your Google Wallet app to instantly authorize from your primary payment card.
                          </p>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#6B7280] uppercase">Google Account Email</label>
                            <input
                              type="email"
                              required
                              placeholder="e.g. farmer@gmail.com"
                              className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                            />
                          </div>
                        </div>
                      )}

                      {/* INTERNATIONAL */}
                      {selectedMethod === "international" && (
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-gray-700 block">🌐 International Payments Gateways</span>
                          <p className="text-[10px] text-[#6B7280] leading-relaxed">
                            Process payments via Stripe or PayPal supporting international currencies. Live exchange rates calculated at checkout.
                          </p>
                          <div className="space-y-1">
                            <label className="text-[9px] font-bold text-[#6B7280] uppercase">Billing Country / Region</label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. United Kingdom"
                              className="w-full bg-white border border-[#E5E7EB] rounded-none px-3 py-2 text-xs text-[#1A1A1A] outline-none focus:border-[#2D6A4F]"
                            />
                          </div>
                        </div>
                      )}

                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-none bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-md hover:bg-[#1A5438] transition uppercase tracking-wider"
                    >
                      {selectedMethod === "bank" ? "Confirm Bank Transfer Order" : `Pay KES ${total.toLocaleString()}`}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutStep("register")}
                      className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A]"
                    >
                      ← Back to Profile Info
                    </button>
                  </form>
                )}

                {/* STEP 4: PROCESSING TRANSACTION */}
                {checkoutStep === "processing" && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 rounded-none border-4 border-[#2D6A4F]/20 border-t-[#2D6A4F] animate-spin" />
                      <span className="absolute text-xs font-bold text-[#2D6A4F]">{countdown}s</span>
                    </div>
                    <h3 className="mt-6 text-sm font-extrabold text-[#1A1A1A] uppercase tracking-wider">Verifying transaction...</h3>
                    <p className="mt-2 text-xs text-[#6B7280] max-w-xs leading-relaxed">
                      Please verify payment query on your mobile device. Verification happens automatically once code validation succeeds.
                    </p>
                  </div>
                )}

                {/* STEP 5: ORDER SUCCESS SCREEN */}
                {checkoutStep === "success" && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="grid h-16 w-16 place-items-center rounded-none bg-[#E8F5E9] text-[#2D6A4F] text-3xl animate-bounce">
                      <CheckCircle className="h-10 w-10" />
                    </div>
                    <h3 className="mt-6 text-sm font-black text-[#1A1A1A] uppercase tracking-wider">Purchase Successful!</h3>
                    
                    <div className="mt-4 bg-gray-50 border border-gray-150 p-4 rounded-none text-xs space-y-1.5 w-full text-left">
                      <span className="text-[9px] font-extrabold text-[#2D6A4F] uppercase tracking-wide block">ORDER & ACCOUNT DETAILS:</span>
                      <div><strong>Buyer Name:</strong> {regName}</div>
                      <div><strong>ID Number:</strong> {regIdNumber}</div>
                      <div><strong>County:</strong> {regCounty}</div>
                      <div><strong>Farming Mode:</strong> {regAgriType}</div>
                      <div className="h-px bg-gray-200 my-1" />
                      <div className="text-[10px] text-[#6B7280] leading-relaxed">
                        Your account has been registered. An agronomist will review your seed certification status and reach out to complete delivery dispatch details.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutStep("cart");
                      }}
                      className="mt-8 w-full rounded-none bg-[#2D6A4F] py-3 text-xs font-bold text-white shadow-lg uppercase tracking-wider hover:bg-[#1A5438]"
                    >
                      Done & Back to Shop
                    </button>
                  </div>
                )}

              </div>

              {/* Footer */}
              {checkoutStep === "cart" && cartItems.length > 0 && (
                <div className="p-6 border-t border-[#F0F0F0] bg-[#FAFAF8] space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#6B7280]">
                      <span>Subtotal</span>
                      <span className="font-bold text-[#1A1A1A]">
                        KES {subtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#6B7280]">
                      <span>VAT (16%)</span>
                      <span className="font-bold text-[#1A1A1A]">
                        KES {vatAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-[#6B7280]">
                      <span>Delivery Fee</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {deliveryFee === 0 ? "FREE" : `KES ${deliveryFee}`}
                      </span>
                    </div>
                    <div className="h-px bg-[#E5E7EB] my-2" />
                    <div className="flex justify-between text-xs font-bold text-[#1A1A1A]">
                      <span>Total Amount</span>
                      <span className="text-[#2D6A4F] font-extrabold font-mono text-sm">
                        KES {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={handleStartCheckout}
                      className="w-full rounded-none bg-[#F5A623] py-3 text-xs font-bold text-[#1A1A1A] hover:bg-[#E0951F] shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      Checkout via Website <ArrowRight className="h-4 w-4" />
                    </button>

                    <button
                      onClick={handleWhatsAppCartCheckout}
                      className="w-full rounded-none bg-[#25D366] hover:bg-[#20BA56] py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <MessageSquare className="h-4 w-4" /> Checkout via WhatsApp
                    </button>

                    <button
                      onClick={() => setInvoiceModalOpen(true)}
                      className="w-full rounded-none border border-[#2D6A4F] text-[#2D6A4F] hover:bg-[#2D6A4F]/10 py-3 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                    >
                      <FileText className="h-4 w-4" /> Get Proforma Invoice / Quotation
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          CART PROFORMA INVOICE PRINTABLE MODAL
      ══════════════════════════════════════════ */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs text-[#1A1A1A]">
          <div className="bg-white rounded-none max-w-2xl w-full p-6 shadow-2xl relative border border-gray-100 flex flex-col text-left max-h-[90vh] overflow-y-auto">
            
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-none bg-[#2D6A4F] text-white flex items-center justify-center font-bold text-sm">M</div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider">Cart Proforma Invoice Generator</h3>
              </div>
              <button 
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full transition text-[#6B7280] hover:text-[#1A1A1A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Input Billing Info Form */}
            <div className="bg-[#FAF9F5] rounded-none p-4 border border-[#F5A623]/20 grid grid-cols-2 gap-3 text-xs mt-4">
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider">Fill Buyer Details to populate Invoice</span>
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Customer Full Name</span>
                <input
                  type="text"
                  placeholder="e.g. Timothy Kiprono"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">ID Number</span>
                <input
                  type="text"
                  placeholder="e.g. 34567890"
                  value={regIdNumber}
                  onChange={(e) => setRegIdNumber(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Delivery Location / County</span>
                <input
                  type="text"
                  placeholder="e.g. Eldoret, Uasin Gishu"
                  value={regCounty}
                  onChange={(e) => setRegCounty(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F]"
                />
              </div>
              <div className="space-y-1 col-span-2 sm:col-span-1">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase">Nature of Agriculture</span>
                <select
                  value={regAgriType}
                  onChange={(e) => setRegAgriType(e.target.value)}
                  className="w-full bg-white border border-[#E8ECE9] rounded-none px-3 py-1.5 outline-none focus:border-[#2D6A4F] font-semibold cursor-pointer"
                >
                  <option value="Dairy Cattle">Dairy Cattle / Livestock</option>
                  <option value="Maize Farming">Maize Cultivation</option>
                  <option value="Vegetables & Horticulture">Vegetables & Horticulture</option>
                  <option value="Poultry farming">Poultry Farming</option>
                  <option value="Mixed Agricultural Practices">Mixed Farming</option>
                </select>
              </div>
            </div>

            {/* Printable Proforma Document Layout */}
            <div id="printable-proforma-cart" className="mt-6 border border-gray-200 rounded-none p-6 bg-white space-y-6 text-xs text-[#1A1A1A]">
              
              {/* Invoice Header */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-4">
                <div className="text-left">
                  <h4 className="text-sm font-black text-[#2D6A4F] uppercase">MQULIMA ECOSYSTEM</h4>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Agriculture for the future</p>
                  <p className="text-[10px] text-[#6B7280]">P.O Box 100-20100, Nakuru, Kenya</p>
                  <p className="text-[10px] text-[#6B7280]">Email: sales@mqulima.com | Phone: +254700000000</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-wider">PROFORMA INVOICE</h3>
                  <p className="text-[10px] font-bold text-[#2D6A4F] mt-1">{invoiceNumber}</p>
                  <p className="text-[10px] text-[#6B7280]">Date: {invoiceDate}</p>
                  <p className="text-[10px] text-[#6B7280]">Validity: 14 Days</p>
                </div>
              </div>

              {/* Customer Detail block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">PREPARED FOR:</span>
                  <strong className="text-xs text-[#1A1A1A] block mt-1">{regName || "Valued Mqulima Partner"}</strong>
                  <p className="text-[10px] text-[#6B7280]">ID Number: {regIdNumber || "N/A"}</p>
                  <p className="text-[10px] text-[#6B7280]">Location: {regCounty || "N/A"}</p>
                  <p className="text-[10px] text-[#6B7280]">Farming type: {regAgriType}</p>
                </div>
                <div className="text-left bg-gray-50 p-3 rounded-none border border-gray-150">
                  <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">DELIVERY NOTE:</span>
                  <p className="text-[10px] text-[#1A1A1A] mt-1">Deliver to {regCounty || "[Not Specified]"}.</p>
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Shipping carrier: Mqulima Logistical Dispatch Services.</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 text-[#6B7280] font-bold">
                    <th className="py-2">Product Details</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Unit Price</th>
                    <th className="py-2 text-right">Total Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.product.id} className="border-b border-gray-100">
                      <td className="py-2.5">
                        <strong className="text-xs text-[#1A1A1A]">{item.product.name}</strong>
                        <span className="text-[10px] text-[#6B7280] block">Unit: per {item.product.unit}</span>
                      </td>
                      <td className="py-2.5 text-center font-bold">{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono">KES {item.product.price.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono font-bold">KES {(item.product.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Total calculations */}
              <div className="flex justify-end pt-4">
                <div className="w-[220px] space-y-1.5 text-right text-xs">
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Subtotal:</span>
                    <span className="font-mono text-[#1A1A1A]">KES {subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>VAT (16%):</span>
                    <span className="font-mono text-[#1A1A1A]">KES {vatAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Delivery Fee:</span>
                    <span className="font-mono text-[#1A1A1A]">
                      {deliveryFee === 0 ? "FREE" : `KES ${deliveryFee}`}
                    </span>
                  </div>
                  <div className="h-px bg-gray-200 my-1" />
                  <div className="flex justify-between text-sm font-black text-[#2D6A4F]">
                    <span>GRAND TOTAL:</span>
                    <span className="font-mono">KES {total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Payment conditions terms */}
              <div className="border-t border-gray-100 pt-4 text-left">
                <span className="text-[9px] font-bold text-[#6B7280] uppercase tracking-wider block">INSTRUCTIONS & TERMS:</span>
                <ol className="list-decimal pl-4 mt-1 text-[9px] text-[#6B7280] space-y-0.5">
                  <li>Payment must be completed in full before delivery dispatch.</li>
                  <li>Payments can be cleared via M-Pesa Lipa na Kopo or direct bank deposit.</li>
                  <li>Verify products upon receipt. Returns are processed within 48 hours.</li>
                </ol>
              </div>

            </div>

            {/* Print Action Buttons */}
            <div className="mt-6 flex justify-between gap-3 border-t border-gray-100 pt-4">
              <span className="text-[10px] text-[#6B7280] italic flex items-center">
                *This is a computer generated document. No signature required.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-none text-xs font-bold text-[#6B7280] hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Initiating printing dialogue...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-4 py-2 bg-[#2D6A4F] hover:bg-[#1A5438] rounded-none text-xs font-bold text-white transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" />
                  Print / Download Invoice
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
