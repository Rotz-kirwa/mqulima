import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2, Minus, Plus, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../../lib/cart-context";

export function CartDrawer() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart
  } = useCart();

  const [checkoutStep, setCheckoutStep] = useState<"cart" | "phone" | "pin-wait" | "success">("cart");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [pinCountdown, setPinCountdown] = useState(5);

  const subtotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const deliveryFee = subtotal > 2000 ? 0 : 250;
  const total = subtotal + deliveryFee;

  // Reset steps when drawer opens/closes
  useEffect(() => {
    if (!cartOpen) {
      setCheckoutStep("cart");
    }
  }, [cartOpen]);

  // STK Push Countdown Simulator
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (checkoutStep === "pin-wait" && pinCountdown > 0) {
      timer = setTimeout(() => {
        setPinCountdown((c) => c - 1);
      }, 1000);
    } else if (checkoutStep === "pin-wait" && pinCountdown === 0) {
      setCheckoutStep("success");
      clearCart();
      toast.success("Order Placed Successfully!", {
        description: "Payment confirmed via M-Pesa.",
      });
    }
    return () => clearTimeout(timer);
  }, [checkoutStep, pinCountdown, clearCart]);

  const handleStartCheckout = () => {
    setCheckoutStep("phone");
  };

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^(07|01|254)\d{8}$/.test(mpesaPhone.trim())) {
      toast.error("Please enter a valid Kenyan phone number (e.g. 0712345678)");
      return;
    }
    setPinCountdown(5);
    setCheckoutStep("pin-wait");
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
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#1A1A1A]">
                  {checkoutStep === "cart" && `My Shopping Cart (${cartItems.length})`}
                  {checkoutStep === "phone" && "M-Pesa Checkout"}
                  {checkoutStep === "pin-wait" && "Processing Payment"}
                  {checkoutStep === "success" && "Success"}
                </h2>
                <button
                  onClick={() => setCartOpen(false)}
                  className="text-[#6B7280] hover:text-[#1A1A1A] transition"
                  aria-label="Close cart"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Items / Checkout Form */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {checkoutStep === "cart" && (
                  <>
                    {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-20">
                        <span className="text-4xl">🛒</span>
                        <h3 className="mt-4 text-sm font-bold text-[#1A1A1A]">Your cart is empty</h3>
                        <p className="mt-1 text-xs text-[#6B7280] max-w-[200px]">
                          Browse our agrovet products and add items to your cart.
                        </p>
                        <button
                          onClick={() => setCartOpen(false)}
                          className="mt-6 rounded-lg bg-[#1A6B3C] px-5 py-2 text-xs font-bold text-white shadow-md"
                        >
                          Start Shopping
                        </button>
                      </div>
                    ) : (
                      cartItems.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-4 py-3 border-b border-[#F0F0F0] last:border-none"
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-[#FAFAF8] border border-[#E5E7EB] p-1">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="h-full w-full object-contain"
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
                                <span className="px-2 text-xs font-bold text-[#1A1A1A]">{item.quantity}</span>
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
                      ))
                    )}
                  </>
                )}

                {checkoutStep === "phone" && (
                  <form onSubmit={handleSubmitPhone} className="space-y-4 py-4 text-left">
                    <div className="rounded-xl bg-[#E8F5E9] p-4 text-xs text-[#1A6B3C] border border-[#1A6B3C]/10">
                      <strong className="font-bold">M-Pesa STK Push Simulator</strong>
                      <p className="mt-1 leading-relaxed">
                        We will send a mock STK push query to your phone. Enter your phone number below.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280]">
                        M-Pesa Mobile Number
                      </label>
                      <input
                        type="tel"
                        required
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="e.g. 0712345678"
                        className="w-full rounded-xl border border-[#E5E7EB] bg-[#FAFAF8] px-4 py-3 text-xs text-[#1A1A1A] outline-none transition focus:border-[#1A6B3C] focus:bg-white"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#1A6B3C] py-3 text-xs font-bold text-white shadow-lg transition-transform hover:scale-[1.01]"
                    >
                      Request Payment Push
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutStep("cart")}
                      className="w-full text-center text-xs font-bold text-[#6B7280] hover:text-[#1A1A1A] mt-2"
                    >
                      ← Cancel & View Cart
                    </button>
                  </form>
                )}

                {checkoutStep === "pin-wait" && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="relative flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-4 border-[#1A6B3C]/20 border-t-[#1A6B3C] animate-spin" />
                      <span className="absolute text-xs font-bold text-[#1A6B3C]">{pinCountdown}s</span>
                    </div>
                    <h3 className="mt-6 text-sm font-extrabold text-[#1A1A1A]">STK Push Sent</h3>
                    <p className="mt-2 text-xs text-[#6B7280] max-w-xs leading-relaxed">
                      Please check your phone at <strong className="text-[#1A1A1A]">{mpesaPhone}</strong> and enter your M-Pesa PIN to complete the transaction of <strong className="text-[#1A6B3C]">KES {Math.round(total).toLocaleString()}</strong>.
                    </p>
                  </div>
                )}

                {checkoutStep === "success" && (
                  <div className="h-full flex flex-col items-center justify-center text-center py-10">
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-[#E8F5E9] text-3xl animate-bounce">
                      ✅
                    </div>
                    <h3 className="mt-6 text-base font-black text-[#1A1A1A]">Order Placed!</h3>
                    <p className="mt-2 text-xs text-[#6B7280] max-w-xs leading-relaxed">
                      Thank you for shopping at Mqulima. Your payment was verified. An agronomist will contact you for delivery details.
                    </p>
                    <button
                      onClick={() => {
                        setCartOpen(false);
                        setCheckoutStep("cart");
                      }}
                      className="mt-8 w-full rounded-xl bg-[#1A6B3C] py-3 text-xs font-bold text-white shadow-lg"
                    >
                      Continue Shopping
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
                      <span>Delivery Fee</span>
                      <span className="font-bold text-[#1A1A1A]">
                        {deliveryFee === 0 ? "FREE" : `KES ${deliveryFee}`}
                      </span>
                    </div>
                    <div className="h-px bg-[#E5E7EB] my-2" />
                    <div className="flex justify-between text-sm font-bold text-[#1A1A1A]">
                      <span>Total</span>
                      <span className="text-[#2D6A4F] font-extrabold font-mono">
                        KES {total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleStartCheckout}
                    className="w-full rounded-xl bg-[#F5A623] py-3 text-xs font-bold text-[#1A1A1A] hover:bg-[#E0951F] shadow-md transition-transform flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Checkout with M-Pesa <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
