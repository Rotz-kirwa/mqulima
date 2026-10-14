import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ShoppingBag,
  CheckCircle,
  ShieldCheck,
  Loader2,
  MessageSquare,
  FileText,
  Printer,
  User,
  Phone,
  Mail,
  MapPin,
  Truck,
  Sparkles,
  Lock,
  Receipt,
  Building2,
  Store,
  CreditCard,
  Smartphone
} from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { useAuth } from "@/hooks/useAuth";
import { trackEvent } from "@/lib/events";
import {
  ALL_KENYA_COUNTIES,
  getMajorTownsForCounty
} from "@/lib/kenya-locations";

export type FulfillmentType = "delivery" | "pickup";

export interface MqulimaDepot {
  id: string;
  name: string;
  town: string;
  county: string;
  address: string;
  hours: string;
}

export const MQULIMA_DEPOT_LOCATIONS: MqulimaDepot[] = [
  {
    id: "nairobi-cbd",
    name: "Nairobi CBD Main Hub",
    town: "Nairobi CBD",
    county: "Nairobi",
    address: "Tom Mboya St / Haile Selassie Ave, Agro Centre",
    hours: "Mon - Sat: 8:00 AM - 6:00 PM"
  },
  {
    id: "eldoret-hub",
    name: "Eldoret Regional Depot",
    town: "Eldoret",
    county: "Uasin Gishu",
    address: "Uganda Road, Farmers Agro Mall",
    hours: "Mon - Sat: 8:00 AM - 5:30 PM"
  },
  {
    id: "nakuru-depot",
    name: "Nakuru Central Depot",
    town: "Nakuru",
    county: "Nakuru",
    address: "George Morara Rd, Opp. Agri-Board",
    hours: "Mon - Sat: 8:00 AM - 5:30 PM"
  },
  {
    id: "kitale-depot",
    name: "Kitale Depot & Farm Hub",
    town: "Kitale",
    county: "Trans Nzoia",
    address: "Posta Road, Trans Nzoia Agro Plaza",
    hours: "Mon - Sat: 8:00 AM - 5:00 PM"
  },
  {
    id: "thika-depot",
    name: "Thika Agro Hub",
    town: "Thika",
    county: "Kiambu",
    address: "Commercial Street, Near Stage",
    hours: "Mon - Sat: 8:00 AM - 5:30 PM"
  },
  {
    id: "kisumu-depot",
    name: "Kisumu Lakeside Depot",
    town: "Kisumu",
    county: "Kisumu",
    address: "Oginga Odinga St, Farmer Junction",
    hours: "Mon - Sat: 8:00 AM - 5:00 PM"
  },
  {
    id: "meru-depot",
    name: "Meru Farmers Hub",
    town: "Meru",
    county: "Meru",
    address: "Njuri Ncheke Street, Central Plaza",
    hours: "Mon - Sat: 8:00 AM - 5:00 PM"
  },
  {
    id: "mombasa-depot",
    name: "Mombasa Coastal Depot",
    town: "Mombasa",
    county: "Mombasa",
    address: "Jomo Kenyatta Ave, Agro Store",
    hours: "Mon - Sat: 8:00 AM - 5:00 PM"
  }
];

export function CartDrawer() {
  const {
    cartItems,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    clearCart
  } = useCart();

  const { user } = useAuth();

  // Navigation steps:
  // 0: Cart items view
  // 1: Checkout view (single-screen exact requested flow)
  // 5: Order Success / Dispatch confirmed
  const [step, setStep] = useState<number>(0);

  // Form Fields - Contact Information
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");

  // Fulfillment method: delivery to nearest town vs pickup at the store (defaults to pickup: FREE)
  const [fulfillmentMethod, setFulfillmentMethod] = useState<FulfillmentType>("pickup");
  const [selectedDepotId, setSelectedDepotId] = useState<string>("nairobi-cbd");

  const selectedDepot = useMemo(() => {
    return (
      MQULIMA_DEPOT_LOCATIONS.find((d) => d.id === selectedDepotId) ||
      MQULIMA_DEPOT_LOCATIONS[0]
    );
  }, [selectedDepotId]);

  // Form Fields - Delivery Location (County -> Major Town)
  const [county, setCounty] = useState("Nairobi");
  const [town, setTown] = useState("Nairobi CBD");
  const [customTown, setCustomTown] = useState("");
  const [village, setVillage] = useState("");
  const [instructions, setInstructions] = useState("");

  // Payment method selection (each option standalone in a grid card, unified via Paystack collection)
  const [paymentMethod, setPaymentMethod] = useState<
    "mpesa" | "airtel" | "visa" | "mastercard" | "ncba" | "pesalink"
  >("mpesa");

  // Order submission & status states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  // Proforma Invoice Modal
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");

  // Airtel Money Direct Charge Modal & Status
  const [showAirtelModal, setShowAirtelModal] = useState(false);
  const [airtelPromptData, setAirtelPromptData] = useState<{
    orderId: string;
    reference: string;
    amount: number;
    phone: string;
    displayText?: string;
  } | null>(null);
  const [airtelChecking, setAirtelChecking] = useState(false);
  const [airtelPaid, setAirtelPaid] = useState(false);

  // Available major commercial towns derived from chosen county
  const townsList = useMemo(() => {
    return getMajorTownsForCounty(county);
  }, [county]);

  // Sync major town when county changes
  const handleCountyChange = (newCounty: string) => {
    setCounty(newCounty);
    const availableTowns = getMajorTownsForCounty(newCounty);
    setTown(availableTowns[0] || "");
    setCustomTown("");
  };

  const handleTownChange = (newTown: string) => {
    setTown(newTown);
    if (newTown !== "Other Town / Center") {
      setCustomTown("");
    }
  };

  // Initialize invoice metadata
  useEffect(() => {
    setInvoiceNumber(`MQ-CART-${Math.floor(100000 + Math.random() * 900000)}`);
    setInvoiceDate(
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    );
  }, []);

  // Pre-fill user data from account or localStorage
  useEffect(() => {
    try {
      if (user) {
        if (user.name && !fullName) setFullName(user.name);
        if (user.phone && !phoneNumber) setPhoneNumber(user.phone);
        if (user.email && !email) setEmail(user.email);
      }

      const stored = localStorage.getItem("mqulima_user_account");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (!fullName && parsed.name) setFullName(parsed.name);
        if (!phoneNumber && parsed.phone) setPhoneNumber(parsed.phone);
        if (!email && parsed.email) setEmail(parsed.email);
        if (parsed.fulfillmentMethod === "pickup" || parsed.fulfillmentMethod === "delivery") {
          setFulfillmentMethod(parsed.fulfillmentMethod);
        }
        if (parsed.selectedDepotId) {
          setSelectedDepotId(parsed.selectedDepotId);
        }
        if (parsed.county) setCounty(parsed.county);
        if (parsed.town) setTown(parsed.town);
        else if (parsed.locationArea) setTown(parsed.locationArea);
        else if (parsed.subCounty) setTown(parsed.subCounty);
        if (parsed.village) setVillage(parsed.village);
        if (parsed.instructions) setInstructions(parsed.instructions);
      }
    } catch (e) {
      console.warn("Could not load stored checkout details", e);
    }
  }, [user]);

  // Reset steps when drawer opens/closes
  useEffect(() => {
    if (!cartOpen) {
      // If order was finished, reset to step 0 on close
      if (step === 5) {
        setStep(0);
      }
      setIsSubmitting(false);
    }
  }, [cartOpen, step]);

  // Live polling for Airtel Money payment confirmation
  useEffect(() => {
    if (!showAirtelModal || !airtelPromptData?.reference || airtelPaid) return;

    let pollCount = 0;
    const maxPolls = 40; // Poll for 2 minutes (every 3 seconds)
    const interval = setInterval(async () => {
      pollCount++;
      if (pollCount > maxPolls) {
        clearInterval(interval);
        return;
      }

      try {
        const { verifyPaystackPaymentStatus } = await import("@/lib/api/paystack.server");
        const res = await verifyPaystackPaymentStatus({
          data: { reference: airtelPromptData.reference }
        });

        if (res.success && res.paid) {
          setAirtelPaid(true);
          clearInterval(interval);
          trackEvent("purchase_completed", {
            order_id: airtelPromptData.reference,
            transaction_id: airtelPromptData.reference,
            value: grandTotal,
            currency: "KES",
            payment_method: "airtel",
          });
          toast.success("Airtel Money payment confirmed!");
          setTimeout(() => {
            setShowAirtelModal(false);
            setStep(3); // Transition to Step 3: Dispatch & Tracking
          }, 1500);
        }
      } catch (e) {
        // Continue polling silently
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [showAirtelModal, airtelPromptData?.reference, airtelPaid]);

  const handleManualAirtelCheck = async () => {
    if (!airtelPromptData?.reference) return;
    setAirtelChecking(true);
    try {
      const { verifyPaystackPaymentStatus } = await import("@/lib/api/paystack.server");
      const res = await verifyPaystackPaymentStatus({
        data: { reference: airtelPromptData.reference }
      });
      if (res.success && res.paid) {
        setAirtelPaid(true);
        trackEvent("purchase_completed", {
          order_id: airtelPromptData.reference,
          transaction_id: airtelPromptData.reference,
          value: grandTotal,
          currency: "KES",
          payment_method: "airtel",
        });
        toast.success("Payment confirmed!");
        setTimeout(() => {
          setShowAirtelModal(false);
          setStep(3);
        }, 1200);
      } else {
        toast.info(res.error || "Payment not yet confirmed. Please ensure you entered your PIN on your phone.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to verify payment status.");
    } finally {
      setAirtelChecking(false);
    }
  };

  // Price calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (acc, item) => acc + item.product.price * item.quantity,
      0
    );
  }, [cartItems]);

  // Delivery fee: KSh 300 for courier delivery to nearest town, FREE for store pickup
  const deliveryFee = fulfillmentMethod === "pickup" ? 0 : 300;
  const grandTotal = subtotal + deliveryFee;

  // Validation function
  const validateForm = (): boolean => {
    if (!fullName.trim()) {
      toast.error("Please enter your Full Name.");
      return false;
    }

    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, "");
    if (!cleanPhone) {
      toast.error("Please enter your Phone Number.");
      return false;
    }

    // Kenyan phone format check: 07XXXXXXXX, 01XXXXXXXX, 2547XXXXXXXX, +2547XXXXXXXX, etc.
    const kenyanPhoneRegex = /^(?:\+254|254|0)?([17]\d{8})$/;
    if (!kenyanPhoneRegex.test(cleanPhone)) {
      toast.error("Please enter a valid Kenyan phone number (e.g. +254 7XX XXX XXX or 0712 345 678).");
      return false;
    }

    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        toast.error("Please enter a valid email address or leave it empty.");
        return false;
      }
    }

    if (fulfillmentMethod === "delivery") {
      if (!county.trim()) {
        toast.error("Please select your Delivery County.");
        return false;
      }

      const resolvedTown =
        town === "Other Town / Center" ? customTown.trim() : town.trim();
      if (!resolvedTown) {
        toast.error("Please select or enter your Major Town / Delivery Hub.");
        return false;
      }
    }

    // Save to local storage for returning convenience
    try {
      const resolvedTown =
        fulfillmentMethod === "pickup"
          ? `${selectedDepot.name} (${selectedDepot.address})`
          : town === "Other Town / Center"
          ? customTown.trim()
          : town.trim();

      const resolvedCounty =
        fulfillmentMethod === "pickup" ? selectedDepot.county : county.trim();

      localStorage.setItem(
        "mqulima_user_account",
        JSON.stringify({
          name: fullName.trim(),
          phone: phoneNumber.trim(),
          email: email.trim(),
          county: resolvedCounty,
          town: resolvedTown,
          village: village.trim(),
          instructions: instructions.trim(),
          fulfillmentMethod,
          selectedDepotId
        })
      );
    } catch (e) {
      console.warn("Storage write failed", e);
    }

    return true;
  };

  // Handle Place Order & Pay
  const handlePlaceOrderAndPay = async () => {
    if (cartItems.length === 0) {
      toast.error("Your cart is empty. Please add items before checking out.");
      return;
    }

    if (!validateForm()) return;

    trackEvent("checkout_started", {
      value: grandTotal,
      currency: "KES",
      items_count: cartItems.length,
      payment_method: paymentMethod,
    });

    setIsSubmitting(true);

    try {
      const resolvedTown =
        fulfillmentMethod === "pickup"
          ? `${selectedDepot.name} (${selectedDepot.address})`
          : town === "Other Town / Center"
          ? customTown.trim()
          : town.trim();

      const resolvedCounty =
        fulfillmentMethod === "pickup" ? selectedDepot.county : county.trim();

      const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
      const { createShopOrder } = await import("@/lib/api/shop.server");

      const orderItems = cartItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.image || item.product.imageUrls?.[0] || "/placeholder-product.png"
      }));

      // 1. Create shop order in Postgres database
      const res = await createShopOrder({
        data: {
          items: orderItems,
          subtotal,
          total: grandTotal,
          deliveryFee,
          fullName: fullName.trim(),
          phone: phoneNumber.trim(),
          nationalId: "N/A",
          email: email.trim() || undefined,
          county: resolvedCounty,
          town: resolvedTown,
          subCounty: resolvedTown,
          locationArea: resolvedTown,
          village: fulfillmentMethod === "pickup" ? undefined : (village.trim() || undefined),
          instructions: instructions.trim() || undefined,
          paymentMethod: paymentMethod,
          shippingOption: fulfillmentMethod === "pickup" ? "pickup" : "standard",
          csrfToken: getCsrfTokenFromCookie()
        }
      });

      if (!res.success || !res.orderId) {
        throw new Error(res.error || "Failed to create your order. Please try again.");
      }

      setCreatedOrderId(res.orderId);

      // 2. Process payment according to selected standalone channel
      // Paystack requires a customer email; fall back to a phone-based valid dummy if empty
      const customerEmail =
        email.trim() && email.includes("@")
          ? email.trim().toLowerCase()
          : user?.email && user.email.includes("@")
          ? user.email.trim().toLowerCase()
          : `${phoneNumber.replace(/[^0-9]/g, "") || "shopper"}@mqulima.com`;

      // CRITICAL FIX: Airtel Money must NOT lead to M-Pesa!
      // In Paystack Kenya, the hosted checkout hardcodes the mobile money tab to "M-PESA".
      // By using Paystack's Charge API directly with provider 'atl', we trigger the authentic
      // Airtel Money prompt on their phone and show the dedicated Airtel verification modal.
      if (paymentMethod === "airtel") {
        const { chargePaystackMobileMoney } = await import("@/lib/api/paystack.server");
        const chargeRes = await chargePaystackMobileMoney({
          data: {
            orderId: res.orderId,
            phone: phoneNumber.trim(),
            email: customerEmail,
            provider: "atl"
          }
        });

        if (!chargeRes.success) {
          setIsSubmitting(false);
          toast.error((chargeRes as any).error || "Failed to initiate Airtel Money charge. Please try again.");
          return;
        }

        setAirtelPromptData({
          orderId: res.orderId,
          reference: chargeRes.reference || `MQ_AIRTEL_${res.orderId.replace(/-/g, "").slice(0, 8)}`,
          amount: grandTotal,
          phone: phoneNumber.trim(),
          displayText: chargeRes.displayText || `Authorization prompt dispatched to ${phoneNumber.trim()}`
        });
        setShowAirtelModal(true);
        setIsSubmitting(false);
        clearCart();
        toast.success("Airtel Money payment initiated! Check your phone.");
        return;
      }

      // For other channels (M-Pesa, Visa, Mastercard, NCBA, PesaLink):
      // Route via Paystack hosted checkout with appropriately pre-filtered channels
      const { initiatePaystackCheckout } = await import("@/lib/api/paystack.server");

      let paystackChannels: string[] = ["mobile_money", "card", "bank"];
      if (paymentMethod === "mpesa") {
        paystackChannels = ["mobile_money"];
      } else if (paymentMethod === "visa" || paymentMethod === "mastercard") {
        paystackChannels = ["card"];
      } else if (paymentMethod === "ncba" || paymentMethod === "pesalink") {
        paystackChannels = ["bank", "bank_transfer", "mobile_money", "card"];
      }

      const payRes = await initiatePaystackCheckout({
        data: {
          orderId: res.orderId,
          email: customerEmail,
          channels: paystackChannels
        }
      });

      if (payRes.success && payRes.authorizationUrl) {
        toast.success("Order placed! Redirecting to secure payment...");
        clearCart();
        window.location.href = payRes.authorizationUrl;
        return;
      } else {
        throw new Error(
          (payRes as any)?.error || "Failed to initialize Paystack payment gateway."
        );
      }
    } catch (err: any) {
      console.error("Checkout error:", err);
      setIsSubmitting(false);
      toast.error(err.message || "An error occurred during checkout. Please try again.");
    }
  };

  // WhatsApp Checkout alternative with database tracking and SMS confirmation
  const handleWhatsAppCheckout = async () => {
    let itemRows = "";
    cartItems.forEach((item, index) => {
      itemRows += `${index + 1}. ${item.product.name} × ${item.quantity} - KSh ${(
        item.product.price * item.quantity
      ).toLocaleString()}\n`;
    });

    const resolvedTown =
      fulfillmentMethod === "pickup"
        ? `${selectedDepot.name} (${selectedDepot.address})`
        : town === "Other Town / Center"
        ? (customTown.trim() || "Local Center")
        : town;

    const resolvedCounty =
      fulfillmentMethod === "pickup" ? selectedDepot.county : county.trim();

    const fulfillmentDetails =
      fulfillmentMethod === "pickup"
        ? `\n*Fulfillment:* Pick up at the Store (FREE)\n*Store / Depot:* ${selectedDepot.name}\n*Address:* ${selectedDepot.address}\n*Operating Hours:* ${selectedDepot.hours}`
        : `\n*Fulfillment:* Delivery to Nearest Town\n*County:* ${county}\n*Town / Delivery Hub:* ${resolvedTown}${
            village ? `\n*Estate/Landmark:* ${village}` : ""
          }`;

    const customerDetails = fullName
      ? `\n*Customer Details:*\nName: ${fullName}\nPhone: ${phoneNumber}${fulfillmentDetails}${
          instructions ? `\n*Notes/Instructions:* ${instructions}` : ""
        }\n`
      : "";

    let assignedOrderId = "";

    // If customer details are provided, register order in DB for tracking and SMS confirmation
    if (fullName.trim() && phoneNumber.trim()) {
      try {
        const { getCsrfTokenFromCookie } = await import("@/lib/csrf-client");
        const { createShopOrder } = await import("@/lib/api/shop.server");

        const orderItems = cartItems.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.image || item.product.imageUrls?.[0] || "/placeholder-product.png"
        }));

        const res = await createShopOrder({
          data: {
            items: orderItems,
            subtotal,
            total: grandTotal,
            deliveryFee,
            fullName: fullName.trim(),
            phone: phoneNumber.trim(),
            email: email.trim() || undefined,
            nationalId: "N/A",
            county: resolvedCounty,
            town: resolvedTown,
            subCounty: resolvedTown,
            locationArea: resolvedTown,
            village: fulfillmentMethod === "pickup" ? undefined : (village.trim() || undefined),
            instructions: instructions.trim() || undefined,
            paymentMethod: "mpesa",
            shippingOption: fulfillmentMethod === "pickup" ? "pickup" : "standard",
            checkoutChannel: "whatsapp",
            csrfToken: getCsrfTokenFromCookie()
          }
        });

        if (res.success && res.orderId) {
          assignedOrderId = res.orderId.slice(0, 8).toUpperCase();
          toast.success("WhatsApp order recorded! Confirmation SMS dispatched.");
          clearCart();
        }
      } catch (e) {
        console.warn("Could not pre-record WhatsApp order in DB:", e);
      }
    }

    const orderRefText = assignedOrderId ? `*Order Reference:* #${assignedOrderId}\n` : "";
    const message = `Hello Mqulima, I'd like to place an order:\n\n${orderRefText}*Items:*\n${itemRows}\n*Delivery / Fulfillment:* ${
      fulfillmentMethod === "pickup" ? "FREE (Store Pickup)" : `KSh ${deliveryFee.toLocaleString()}`
    }\n*TOTAL:* KSh ${grandTotal.toLocaleString()}${customerDetails}\nPlease confirm availability and payment details.`;

    window.open(`https://wa.me/254723346134?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <>
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden font-sans">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity cursor-pointer"
              onClick={() => {
                if (step !== 5 && !isSubmitting) setCartOpen(false);
              }}
            />

            <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 z-50">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 26, stiffness: 240 }}
                className="w-screen max-w-md bg-white shadow-2xl flex flex-col text-left h-full"
              >
                {/* Clean Top Accent Line - Leaf Green */}
                <div className="h-1.5 w-full bg-[#2EB85C] shrink-0" />

                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 bg-white shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {step === 1 ? (
                        <button
                          onClick={() => setStep(0)}
                          className="w-9 h-9 rounded-xl bg-[#2EB85C] hover:bg-[#279B42] text-white flex items-center justify-center transition shadow-xs cursor-pointer active:scale-95"
                          title="Back to Cart"
                        >
                          <ArrowLeft size={18} strokeWidth={2.5} />
                        </button>
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#F0FAF4] text-[#2EB85C] flex items-center justify-center shadow-xs">
                          <ShoppingBag size={18} strokeWidth={2.2} />
                        </div>
                      )}
                      <div>
                        <h2 className="text-base font-bold text-slate-900 tracking-tight">
                          {step === 5 ? "Order Confirmed" : step === 1 ? "Checkout & Payment" : "Shopping Cart"}
                        </h2>
                        <p className="text-xs text-slate-500 font-medium">
                          {step === 5 ? "Your package is queued for dispatch" : step === 1 ? "Select payment & confirm delivery details" : `${cartItems.length} items ready in basket`}
                        </p>
                      </div>
                    </div>

                    {!isSubmitting && (
                      <button
                        onClick={() => setCartOpen(false)}
                        className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition p-2 rounded-xl border border-transparent hover:border-slate-200 cursor-pointer"
                        aria-label="Close"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>

                  {/* Step Progress Indicators - 3 Streamlined Steps */}
                  <div className="mt-3.5 grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      disabled={step === 5}
                      onClick={() => setStep(0)}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-center ${
                        step === 0
                          ? "bg-[#2EB85C] text-white shadow-xs cursor-default"
                          : step === 5
                          ? "bg-[#F0FAF4] text-[#2EB85C] cursor-default font-bold"
                          : "bg-[#F3F4F6] text-slate-600 hover:bg-slate-200 cursor-pointer"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step === 0 ? "bg-white text-[#2EB85C]" : step === 5 ? "bg-[#2EB85C] text-white" : "bg-slate-300 text-slate-700"
                      }`}>{step === 5 ? "✓" : "1"}</span>
                      <span>Cart</span>
                    </button>
                    <button
                      type="button"
                      disabled={step === 5 || cartItems.length === 0}
                      onClick={() => cartItems.length > 0 && setStep(1)}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition text-center ${
                        step === 1
                          ? "bg-[#2EB85C] text-white shadow-xs cursor-default"
                          : step === 5
                          ? "bg-[#F0FAF4] text-[#2EB85C] cursor-default font-bold"
                          : "bg-[#F3F4F6] text-slate-600 hover:bg-slate-200 cursor-pointer"
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step === 1 ? "bg-white text-[#2EB85C]" : step === 5 ? "bg-[#2EB85C] text-white" : "bg-slate-300 text-slate-700"
                      }`}>{step === 5 ? "✓" : "2"}</span>
                      <span>Checkout</span>
                    </button>
                    <div className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-center transition ${
                      step === 5
                        ? "bg-[#2EB85C] text-white shadow-xs"
                        : "bg-[#F3F4F6] text-slate-400"
                    }`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        step === 5 ? "bg-white text-[#2EB85C]" : "bg-slate-300 text-slate-600"
                      }`}>3</span>
                      <span>Dispatch</span>
                    </div>
                  </div>
                </div>

                {/* Scrollable Content Body */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-6 text-slate-800">
                  {/* STEP 0: CART VIEW */}
                  {step === 0 && (
                    <div className="space-y-4">
                      {cartItems.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-20">
                          <div className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center text-4xl mb-3 shadow-inner">
                            🛒
                          </div>
                          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Your cart is empty</h3>
                          <p className="text-xs text-slate-500 mt-1 max-w-[220px]">
                            Browse our certified seeds, fertilizers, feeds and agrochemical catalog.
                          </p>
                          <button
                            onClick={() => setCartOpen(false)}
                            className="mt-6 bg-[#2EB85C] hover:bg-[#279B42] text-white text-sm font-bold px-6 py-3 rounded-xl transition shadow-[0_4px_16px_rgba(46,184,92,0.3)] cursor-pointer"
                          >
                            Explore Agro Shop
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                            <span className="text-xs font-semibold text-[#2EB85C] bg-[#F0FAF4] border border-[#2EB85C]/20 px-3 py-1 rounded-full">
                              {cartItems.length} {cartItems.length === 1 ? "Product" : "Products"} in Cart
                            </span>
                            <button
                              onClick={clearCart}
                              className="text-xs text-red-600 hover:text-red-700 font-bold transition hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <Trash2 size={12} className="text-red-600" />
                              <span>Clear all items</span>
                            </button>
                          </div>

                          {cartItems.map((item) => (
                            <div
                              key={item.product.id}
                              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-slate-200/80 hover:border-[#2EB85C]/40 shadow-xs transition"
                            >
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#F3F4F6] border border-slate-200/60 p-0.5">
                                <img
                                  src={item.product.image || "/placeholder-product.png"}
                                  alt={item.product.name}
                                  className="h-full w-full object-cover rounded-lg"
                                  onError={(e) => {
                                    e.currentTarget.src = "/placeholder-product.png";
                                  }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 truncate">
                                  {item.product.name}
                                </h4>
                                {item.product.brand && (
                                  <span className="text-[10px] font-medium text-slate-600 bg-[#F3F4F6] px-2 py-0.5 rounded-md inline-block mt-1">
                                    Brand: {item.product.brand}
                                  </span>
                                )}
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-sm font-bold text-[#2EB85C] font-mono">
                                    KSh {item.product.price.toLocaleString()}
                                  </span>
                                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-[#F3F4F6]">
                                    <button
                                      onClick={() =>
                                        updateQuantity(item.product.id, item.quantity - 1)
                                      }
                                      className="p-1.5 text-slate-600 hover:bg-white hover:text-[#2EB85C] transition cursor-pointer"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus size={11} />
                                    </button>
                                    <span className="px-2.5 text-xs font-bold text-slate-900">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() =>
                                        updateQuantity(item.product.id, item.quantity + 1)
                                      }
                                      className="p-1.5 text-slate-600 hover:bg-white hover:text-[#2EB85C] transition cursor-pointer"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus size={11} />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.product.id)}
                                className="text-red-600 hover:text-white bg-red-100 hover:bg-red-600 self-start p-2 rounded-xl border border-red-300 transition-all duration-150 cursor-pointer shadow-2xs group"
                                aria-label="Remove item"
                                title="Remove item"
                              >
                                <Trash2 size={16} className="text-red-600 group-hover:text-white transition-colors" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* STEP 1: CLEAN MODERN CHECKOUT (MATCHING SHARED IMAGE THEME) */}
                  {step === 1 && (
                    <div className="space-y-4">
                      {/* 1. Contact Information Card */}
                      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#F0FAF4] text-[#2EB85C] flex items-center justify-center font-bold">
                              <User size={15} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Contact Information
                            </h3>
                          </div>
                          <span className="text-[10px] font-semibold text-[#2EB85C] bg-[#F0FAF4] px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <ShieldCheck size={11} />
                            Direct Receipt
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Full Name */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">
                              Full Name <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder="Popoola Opeyemi"
                              className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition"
                            />
                          </div>

                          {/* Phone Number */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-semibold text-slate-700 block">
                                Phone Number <span className="text-red-500">*</span>
                              </label>
                              <span className="text-[10px] font-semibold text-[#2EB85C] bg-[#F0FAF4] px-2 py-0.5 rounded-full">
                                M-Pesa STK Prompt
                              </span>
                            </div>
                            <input
                              type="tel"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              placeholder="+254 7XX XXX XXX or 07XX XXX XXX"
                              className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-sm font-mono font-medium text-slate-900 placeholder:text-slate-400 outline-none transition"
                            />
                          </div>

                          {/* Email (Optional) */}
                          <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-700 block">
                              Email Address <span className="text-slate-400 font-normal text-[11px]">(Optional for PDF receipt)</span>
                            </label>
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="john@email.com"
                              className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 2. Fulfillment Details based on selection made in Step 1 */}
                      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#F0FAF4] text-[#2EB85C] flex items-center justify-center font-bold">
                              {fulfillmentMethod === "pickup" ? (
                                <Store size={15} />
                              ) : (
                                <Truck size={15} />
                              )}
                            </div>
                            <div>
                              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                                {fulfillmentMethod === "pickup"
                                  ? "Store Pickup Station"
                                  : "Delivery Destination"}
                              </h3>
                              <span className="text-[10px] text-slate-400 font-medium block">
                                {fulfillmentMethod === "pickup" ? "Free Depot Collection (KSh 0)" : "Regional Courier (+KSh 300)"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setFulfillmentMethod(
                                fulfillmentMethod === "pickup" ? "delivery" : "pickup"
                              )
                            }
                            className="text-[10px] font-semibold text-[#2EB85C] hover:text-[#279B42] bg-[#F0FAF4] hover:bg-[#e4f6ec] px-2.5 py-1 rounded-full border border-[#2EB85C]/25 transition cursor-pointer"
                          >
                            {fulfillmentMethod === "pickup"
                              ? "Switch to Delivery (+300)"
                              : "Switch to Free Pickup"}
                          </button>
                        </div>

                        {/* Form Fields: Delivery to Nearest Town */}
                        {fulfillmentMethod === "delivery" ? (
                          <div className="space-y-3 pt-1">
                            {/* County */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 block">
                                County <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={county}
                                  onChange={(e) => handleCountyChange(e.target.value)}
                                  className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 outline-none appearance-none cursor-pointer transition pr-8"
                                >
                                  {ALL_KENYA_COUNTIES.map((c) => (
                                    <option key={c} value={c}>
                                      {c} County
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={15}
                                  className="absolute right-3.5 top-3.5 text-[#2EB85C] pointer-events-none"
                                />
                              </div>
                            </div>

                            {/* Major Town / Delivery Hub */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 block">
                                Major Town / Delivery Hub <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={town}
                                  onChange={(e) => handleTownChange(e.target.value)}
                                  className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 outline-none appearance-none cursor-pointer transition pr-8"
                                >
                                  {townsList.map((t) => (
                                    <option key={t} value={t}>
                                      {t}
                                    </option>
                                  ))}
                                  <option value="Other Town / Center">Other Town / Center</option>
                                </select>
                                <ChevronDown
                                  size={15}
                                  className="absolute right-3.5 top-3.5 text-[#2EB85C] pointer-events-none"
                                />
                              </div>

                              {town === "Other Town / Center" && (
                                <input
                                  type="text"
                                  value={customTown}
                                  onChange={(e) => setCustomTown(e.target.value)}
                                  placeholder="Enter your specific town, market center or stage"
                                  className="w-full mt-2 bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-900 outline-none transition"
                                />
                              )}
                            </div>

                            {/* Estate / Village (Optional) */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 block">
                                Estate / Village / Landmark{" "}
                                <span className="text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={village}
                                onChange={(e) => setVillage(e.target.value)}
                                placeholder="E.g. Near town stage or farm landmark"
                                className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-xs font-medium text-slate-900 outline-none transition"
                              />
                            </div>

                            {/* Delivery Instructions (Optional) */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 block">
                                Delivery Instructions{" "}
                                <span className="text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="E.g. Call upon arrival, leave with storekeeper (optional)"
                                className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-xs font-medium text-slate-900 outline-none transition"
                              />
                            </div>

                            {/* Dispatch Speed Banner */}
                            <div className="bg-[#F0FAF4] border border-[#2EB85C]/20 rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#2EB85C] font-semibold">
                              <Truck size={16} className="text-[#2EB85C] shrink-0" />
                              <span>Fast regional courier delivery within 24-48 hrs across Kenya.</span>
                            </div>
                          </div>
                        ) : (
                          /* Form Fields: Pick up at the Store */
                          <div className="space-y-3 pt-1">
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 block">
                                Select Pickup Store / Depot <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                <select
                                  value={selectedDepotId}
                                  onChange={(e) => setSelectedDepotId(e.target.value)}
                                  className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-xs font-semibold text-slate-900 outline-none appearance-none cursor-pointer transition pr-8"
                                >
                                  {MQULIMA_DEPOT_LOCATIONS.map((d) => (
                                    <option key={d.id} value={d.id}>
                                      {d.name} — {d.town} ({d.county} County)
                                    </option>
                                  ))}
                                </select>
                                <ChevronDown
                                  size={15}
                                  className="absolute right-3.5 top-3.5 text-[#2EB85C] pointer-events-none"
                                />
                              </div>
                            </div>

                            {/* Selected Depot Info Card */}
                            <div className="p-3.5 rounded-xl bg-[#F0FAF4] border border-[#2EB85C]/25 space-y-1.5 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                  <Store size={14} className="text-[#2EB85C]" />
                                  {selectedDepot.name}
                                </span>
                                <span className="bg-[#2EB85C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                  FREE Pickup
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-600 font-medium">
                                <strong className="text-slate-700">Location:</strong> {selectedDepot.address}
                              </p>
                              <p className="text-[11px] text-slate-600 font-medium">
                                <strong className="text-slate-700">Operating Hours:</strong> {selectedDepot.hours}
                              </p>
                              <p className="text-[10px] text-[#2EB85C] font-semibold pt-1 border-t border-[#2EB85C]/15">
                                ✓ Items will be safely packed &amp; ready for collection within 2-4 hours.
                              </p>
                            </div>

                            {/* Pickup Notes / Person Collecting (Optional) */}
                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-slate-700 block">
                                Pickup Notes / Person Collecting{" "}
                                <span className="text-slate-400 font-normal">(Optional)</span>
                              </label>
                              <input
                                type="text"
                                value={instructions}
                                onChange={(e) => setInstructions(e.target.value)}
                                placeholder="E.g. Person collecting or estimated pickup date (optional)"
                                className="w-full bg-[#F3F4F6] border border-transparent focus:border-[#2EB85C] focus:bg-white rounded-xl px-4 py-3 text-xs font-medium text-slate-900 outline-none transition"
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 3. Payment Method Selection (Individual Standalone Cards unified in single Paystack collection) */}
                      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs space-y-3.5">
                        <div className="flex items-center justify-between pb-1">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-[#F0FAF4] text-[#2EB85C] flex items-center justify-center font-bold">
                              <CreditCard size={15} />
                            </div>
                            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                              Payment Method
                            </h3>
                          </div>
                          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/60 text-[10px] font-bold text-blue-700">
                            <ShieldCheck size={11} className="text-blue-600" />
                            <span>Paystack Unified</span>
                          </div>
                        </div>

                        {/* Paystack Collection Clarification */}
                        <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2 flex items-center justify-between text-[11px] text-slate-600">
                          <span>Select your preferred channel. All options enter one secure <strong>Paystack</strong> collection.</span>
                        </div>

                        {/* 1. MOBILE PAYMENTS */}
                        <div className="space-y-1.5 pt-1">
                          <div className="bg-[#DCE5EC] dark:bg-slate-800 text-[#4A6572] dark:text-slate-300 text-[10px] font-black uppercase tracking-wider py-1 text-center rounded-md">
                            Mobile Payments
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* M-Pesa Tile */}
                            <div
                              id="payment-method-mpesa"
                              role="button"
                              tabIndex={0}
                              onClick={() => setPaymentMethod("mpesa")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setPaymentMethod("mpesa");
                              }}
                              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                                paymentMethod === "mpesa"
                                  ? "border-2 border-[#00A859] ring-2 ring-[#00A859]/20 shadow-md scale-[1.01]"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="h-16 bg-white flex items-center justify-center relative p-2">
                                {paymentMethod === "mpesa" && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#00A859] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                )}
                                <div className="flex items-center">
                                  <span className="text-base font-black tracking-tight text-[#00A859]">M-</span>
                                  <span className="w-2.5 h-4 bg-[#E60000] rounded-xs mx-0.5 inline-block transform -skew-x-12 shadow-2xs" />
                                  <span className="text-base font-black tracking-tight text-[#00A859]">PESA</span>
                                </div>
                              </div>
                              <div
                                className={`py-1.5 px-2 text-center text-xs font-bold transition-colors ${
                                  paymentMethod === "mpesa"
                                    ? "bg-[#00A859] text-white"
                                    : "bg-[#457B9D] text-white group-hover:bg-[#396988]"
                                }`}
                              >
                                M-Pesa
                              </div>
                            </div>

                            {/* Airtel Money Tile */}
                            <div
                              id="payment-method-airtel"
                              role="button"
                              tabIndex={0}
                              onClick={() => setPaymentMethod("airtel")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setPaymentMethod("airtel");
                              }}
                              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                                paymentMethod === "airtel"
                                  ? "border-2 border-[#ED1C24] ring-2 ring-[#ED1C24]/20 shadow-md scale-[1.01]"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="h-16 bg-white flex items-center justify-center relative p-2">
                                {paymentMethod === "airtel" && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#ED1C24] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                )}
                                <div className="flex flex-col items-center justify-center -space-y-0.5">
                                  <div className="flex items-center gap-1">
                                    <div className="w-4.5 h-4.5 rounded-full bg-[#ED1C24] flex items-center justify-center text-white font-black text-[11px] shadow-2xs">
                                      a
                                    </div>
                                    <span className="text-sm font-black text-[#ED1C24] tracking-tight">airtel</span>
                                  </div>
                                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                    money
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`py-1.5 px-2 text-center text-xs font-bold transition-colors ${
                                  paymentMethod === "airtel"
                                    ? "bg-[#ED1C24] text-white"
                                    : "bg-[#457B9D] text-white group-hover:bg-[#396988]"
                                }`}
                              >
                                Airtel Money
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 2. CARDS */}
                        <div className="space-y-1.5 pt-1">
                          <div className="bg-[#DCE5EC] dark:bg-slate-800 text-[#4A6572] dark:text-slate-300 text-[10px] font-black uppercase tracking-wider py-1 text-center rounded-md">
                            Cards
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* Visa Tile */}
                            <div
                              id="payment-method-visa"
                              role="button"
                              tabIndex={0}
                              onClick={() => setPaymentMethod("visa")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setPaymentMethod("visa");
                              }}
                              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                                paymentMethod === "visa"
                                  ? "border-2 border-[#1A1F71] ring-2 ring-[#1A1F71]/20 shadow-md scale-[1.01]"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="h-16 bg-white flex items-center justify-center relative p-2">
                                {paymentMethod === "visa" && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#1A1F71] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                )}
                                <div className="text-2xl font-black italic tracking-tighter text-[#1A1F71]">
                                  VIS<span className="text-[#F7B600]">A</span>
                                </div>
                              </div>
                              <div
                                className={`py-1.5 px-2 text-center text-xs font-bold transition-colors ${
                                  paymentMethod === "visa"
                                    ? "bg-[#1A1F71] text-white"
                                    : "bg-[#457B9D] text-white group-hover:bg-[#396988]"
                                }`}
                              >
                                Visa
                              </div>
                            </div>

                            {/* Mastercard Tile */}
                            <div
                              id="payment-method-mastercard"
                              role="button"
                              tabIndex={0}
                              onClick={() => setPaymentMethod("mastercard")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setPaymentMethod("mastercard");
                              }}
                              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                                paymentMethod === "mastercard"
                                  ? "border-2 border-[#EB001B] ring-2 ring-[#EB001B]/20 shadow-md scale-[1.01]"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="h-16 bg-white flex items-center justify-center relative p-2">
                                {paymentMethod === "mastercard" && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#EB001B] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                )}
                                <div className="flex flex-col items-center justify-center -space-y-0.5">
                                  <div className="flex items-center -space-x-1.5">
                                    <span className="w-5 h-5 rounded-full bg-[#EB001B] inline-block shadow-2xs" />
                                    <span className="w-5 h-5 rounded-full bg-[#F79E1B] inline-block opacity-95 shadow-2xs" />
                                  </div>
                                  <span className="text-[7.5px] font-bold text-slate-700 tracking-tight lowercase">
                                    mastercard
                                  </span>
                                </div>
                              </div>
                              <div
                                className={`py-1.5 px-2 text-center text-xs font-bold transition-colors ${
                                  paymentMethod === "mastercard"
                                    ? "bg-[#EB001B] text-white"
                                    : "bg-[#457B9D] text-white group-hover:bg-[#396988]"
                                }`}
                              >
                                Mastercard
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 3. BANK TRANSFER */}
                        <div className="space-y-1.5 pt-1">
                          <div className="bg-[#DCE5EC] dark:bg-slate-800 text-[#4A6572] dark:text-slate-300 text-[10px] font-black uppercase tracking-wider py-1 text-center rounded-md">
                            Bank Transfer &amp; STK
                          </div>
                          <div className="grid grid-cols-2 gap-2.5">
                            {/* NCBA Bank Tile */}
                            <div
                              id="payment-method-ncba"
                              role="button"
                              tabIndex={0}
                              onClick={() => setPaymentMethod("ncba")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setPaymentMethod("ncba");
                              }}
                              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                                paymentMethod === "ncba"
                                  ? "border-2 border-[#002B49] ring-2 ring-[#002B49]/20 shadow-md scale-[1.01]"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="h-16 bg-white flex items-center justify-center relative p-2">
                                {paymentMethod === "ncba" && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#002B49] text-[#D4AF37] flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                )}
                                <div className="flex items-center gap-1.5">
                                  <div className="w-5.5 h-5.5 rounded-md bg-[#002B49] flex items-center justify-center text-[#D4AF37] font-black text-[9px] shadow-2xs border border-[#D4AF37]/30">
                                    NC
                                  </div>
                                  <span className="text-xs font-black text-[#002B49] tracking-wider">NCBA</span>
                                </div>
                              </div>
                              <div
                                className={`py-1.5 px-2 text-center text-xs font-bold transition-colors ${
                                  paymentMethod === "ncba"
                                    ? "bg-[#002B49] text-[#D4AF37]"
                                    : "bg-[#457B9D] text-white group-hover:bg-[#396988]"
                                }`}
                              >
                                NCBA Bank
                              </div>
                            </div>

                            {/* PesaLink Tile */}
                            <div
                              id="payment-method-pesalink"
                              role="button"
                              tabIndex={0}
                              onClick={() => setPaymentMethod("pesalink")}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") setPaymentMethod("pesalink");
                              }}
                              className={`group rounded-xl overflow-hidden border transition-all duration-200 cursor-pointer flex flex-col bg-white ${
                                paymentMethod === "pesalink"
                                  ? "border-2 border-[#0083CA] ring-2 ring-[#0083CA]/20 shadow-md scale-[1.01]"
                                  : "border-slate-200 hover:border-slate-300 hover:shadow-xs"
                              }`}
                            >
                              <div className="h-16 bg-white flex items-center justify-center relative p-2">
                                {paymentMethod === "pesalink" && (
                                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#0083CA] text-white flex items-center justify-center text-[9px] font-bold shadow-xs">
                                    ✓
                                  </span>
                                )}
                                <div className="flex items-center gap-0.5">
                                  <div className="w-3.5 h-3.5 rounded-full bg-[#0083CA] flex items-center justify-center mr-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-white" />
                                  </div>
                                  <span className="text-xs font-black text-[#0083CA] tracking-tight">pesa</span>
                                  <span className="text-xs font-black text-[#E60000] tracking-tight">link</span>
                                </div>
                              </div>
                              <div
                                className={`py-1.5 px-2 text-center text-xs font-bold transition-colors ${
                                  paymentMethod === "pesalink"
                                    ? "bg-[#0083CA] text-white"
                                    : "bg-[#457B9D] text-white group-hover:bg-[#396988]"
                                }`}
                              >
                                PesaLink
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 4. Cost Breakdown Card (EXACTLY MATCHING SCREEN 1 FROM SHARED IMAGE) */}
                      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-sm space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">Cost Of Purchase:</span>
                          <span className="font-mono font-bold text-slate-900">
                            KSh {subtotal.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-medium">
                            {fulfillmentMethod === "pickup" ? "Pickup Fee:" : "Shipping Fee:"}
                          </span>
                          <span
                            className={`font-mono font-bold ${
                              fulfillmentMethod === "pickup"
                                ? "text-[#2EB85C]"
                                : "text-slate-900"
                            }`}
                          >
                            {fulfillmentMethod === "pickup"
                              ? "FREE (Store Pickup)"
                              : `KSh ${deliveryFee.toLocaleString()}`}
                          </span>
                        </div>
                        <div className="h-px bg-slate-100 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-900 text-sm">Total</span>
                          <span className="font-mono text-lg font-bold text-slate-900">
                            KSh {grandTotal.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Primary Action Button: DYNAMIC BRAND STYLING & PAYSTACK UNIFIED */}
                      <div className="pt-2 space-y-3">
                        <button
                          type="button"
                          onClick={handlePlaceOrderAndPay}
                          disabled={isSubmitting}
                          className={`w-full font-bold text-sm py-4 rounded-xl active:scale-[0.99] transition cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider disabled:opacity-75 disabled:cursor-not-allowed ${
                            paymentMethod === "mpesa"
                              ? "bg-[#00A859] hover:bg-[#00843D] text-white shadow-[0_4px_16px_rgba(0,168,89,0.3)]"
                              : paymentMethod === "airtel"
                              ? "bg-[#ED1C24] hover:bg-[#C9141B] text-white shadow-[0_4px_16px_rgba(237,28,36,0.3)]"
                              : paymentMethod === "visa"
                              ? "bg-[#1A1F71] hover:bg-[#121650] text-white shadow-[0_4px_16px_rgba(26,31,113,0.3)]"
                              : paymentMethod === "mastercard"
                              ? "bg-[#EB001B] hover:bg-[#C40016] text-white shadow-[0_4px_16px_rgba(235,0,27,0.3)]"
                              : paymentMethod === "ncba"
                              ? "bg-[#002B49] hover:bg-[#001D32] text-[#D4AF37] shadow-[0_4px_16px_rgba(0,43,73,0.3)]"
                              : "bg-[#0083CA] hover:bg-[#006CA7] text-white shadow-[0_4px_16px_rgba(0,131,202,0.3)]"
                          }`}
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 size={18} className="animate-spin text-white" />
                              <span>Processing Order...</span>
                            </>
                          ) : (
                            <>
                              <Lock size={16} />
                              <span>
                                {paymentMethod === "mpesa"
                                  ? `Pay via M-Pesa (KSh ${grandTotal.toLocaleString()})`
                                  : paymentMethod === "airtel"
                                  ? `Pay via Airtel Money (KSh ${grandTotal.toLocaleString()})`
                                  : paymentMethod === "visa"
                                  ? `Pay with Visa (KSh ${grandTotal.toLocaleString()})`
                                  : paymentMethod === "mastercard"
                                  ? `Pay with Mastercard (KSh ${grandTotal.toLocaleString()})`
                                  : paymentMethod === "ncba"
                                  ? `Pay via NCBA Bank (KSh ${grandTotal.toLocaleString()})`
                                  : `Pay via PesaLink (KSh ${grandTotal.toLocaleString()})`}
                              </span>
                            </>
                          )}
                        </button>

                        {/* Security assurance */}
                        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
                          <span className="flex items-center gap-1.5">
                            <ShieldCheck size={14} className="text-[#2EB85C]" /> Paystack Unified Collection
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1.5">
                            <Sparkles size={14} className="text-[#2EB85C]" /> Instant Prompt
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 5: ORDER SUCCESS SCREEN (CLEAN MINIMALIST DESIGN) */}
                  {step === 5 && (
                    <div className="h-full flex flex-col items-center justify-center text-center py-10">
                      <div className="grid h-20 w-20 place-items-center rounded-full bg-[#2EB85C] text-white ring-8 ring-[#2EB85C]/15 shadow-sm animate-bounce">
                        <CheckCircle className="h-10 w-10" />
                      </div>
                      <h3 className="mt-5 text-base font-bold text-slate-900">
                        Order Placed Successfully!
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs">
                        Your transaction has been confirmed and submitted to our regional fulfillment center.
                      </p>

                      <div className="mt-5 rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs w-full text-left">
                        <div className="bg-[#F0FAF4] p-3 text-slate-900 border-b border-slate-100 flex justify-between items-center font-bold text-xs">
                          <span>Fulfillment Receipt</span>
                          {createdOrderId && (
                            <span className="font-mono font-bold text-xs bg-[#2EB85C] text-white px-2.5 py-0.5 rounded-lg shadow-xs">
                              #{createdOrderId.slice(0, 8).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="p-4 text-xs space-y-2.5 bg-white">
                          <div className="flex justify-between">
                            <strong className="text-slate-500 font-medium">Customer:</strong>
                            <span className="font-bold text-slate-900">{fullName}</span>
                          </div>
                          <div className="flex justify-between">
                            <strong className="text-slate-500 font-medium">Phone:</strong>
                            <span className="font-mono font-bold text-slate-900">{phoneNumber}</span>
                          </div>
                          <div className="flex justify-between">
                            <strong className="text-slate-500 font-medium">Fulfillment:</strong>
                            <span className="font-bold text-slate-900 text-right">
                              {fulfillmentMethod === "pickup"
                                ? "Pick up at Store (FREE)"
                                : "Delivery to Nearest Town"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <strong className="text-slate-500 font-medium">
                              {fulfillmentMethod === "pickup" ? "Pickup Depot:" : "Destination:"}
                            </strong>
                            <span className="font-bold text-slate-900 text-right">
                              {fulfillmentMethod === "pickup"
                                ? `${selectedDepot.name} (${selectedDepot.address})`
                                : `${county} County, ${town === "Other Town / Center" ? customTown : town}`}
                            </span>
                          </div>
                          {instructions && (
                            <div className="flex justify-between">
                              <strong className="text-slate-500 font-medium">
                                {fulfillmentMethod === "pickup" ? "Pickup Notes:" : "Instructions:"}
                              </strong>
                              <span className="text-slate-800 text-right">{instructions}</span>
                            </div>
                          )}
                          <div className="h-px bg-slate-100 my-1" />
                          <div className="text-[11px] text-[#2EB85C] bg-[#F0FAF4] border border-[#2EB85C]/20 p-2.5 rounded-xl flex items-center gap-2 font-medium">
                            {fulfillmentMethod === "pickup" ? (
                              <>
                                <Store size={15} className="text-[#2EB85C] shrink-0" />
                                <span>Your order is reserved. We will SMS/call you when ready for collection.</span>
                              </>
                            ) : (
                              <>
                                <Truck size={15} className="text-[#2EB85C] shrink-0" />
                                <span>Our regional agronomist is processing your package for prompt dispatch.</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setCartOpen(false);
                          setStep(0);
                        }}
                        className="mt-6 w-full rounded-xl bg-[#2EB85C] hover:bg-[#279B42] py-3.5 text-sm font-bold text-white shadow-[0_4px_16px_rgba(46,184,92,0.3)] transition cursor-pointer"
                      >
                        Return to Shop
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer for Step 0 (Cart View) */}
                {step === 0 && cartItems.length > 0 && (
                  <div className="p-4 sm:p-5 border-t border-slate-200/80 bg-white shrink-0 space-y-3">
                    {/* Delivery / Store Pickup Option in Step 1 Cart */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#2EB85C]" />
                          <span>Delivery or Store Pickup</span>
                        </label>
                        <span className="text-[10px] font-semibold text-[#2EB85C] bg-[#F0FAF4] px-2 py-0.5 rounded-full border border-[#2EB85C]/20">
                          {fulfillmentMethod === "pickup" ? "Free Collection" : "Regional Courier"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Option 1: Pick up at Store (FREE) */}
                        <div
                          onClick={() => setFulfillmentMethod("pickup")}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                            fulfillmentMethod === "pickup"
                              ? "border-2 border-[#2EB85C] bg-[#F0FAF4]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                fulfillmentMethod === "pickup"
                                  ? "bg-[#2EB85C] text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Store size={15} />
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                fulfillmentMethod === "pickup"
                                  ? "border-[#2EB85C] bg-[#2EB85C]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {fulfillmentMethod === "pickup" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-left">
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              Pick up at Store
                            </p>
                            <p className="text-[10px] text-[#2EB85C] font-bold mt-0.5">
                              FREE (KSh 0)
                            </p>
                          </div>
                        </div>

                        {/* Option 2: Delivery to Nearest Town */}
                        <div
                          onClick={() => setFulfillmentMethod("delivery")}
                          className={`p-2.5 sm:p-3 rounded-xl border text-left cursor-pointer transition flex flex-col justify-between ${
                            fulfillmentMethod === "delivery"
                              ? "border-2 border-[#2EB85C] bg-[#F0FAF4]"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                fulfillmentMethod === "delivery"
                                  ? "bg-[#2EB85C] text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              <Truck size={15} />
                            </div>
                            <div
                              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                fulfillmentMethod === "delivery"
                                  ? "border-[#2EB85C] bg-[#2EB85C]"
                                  : "border-slate-300 bg-white"
                              }`}
                            >
                              {fulfillmentMethod === "delivery" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-white" />
                              )}
                            </div>
                          </div>
                          <div className="mt-2 text-left">
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              Delivery to Town
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                              Courier · KSh 300
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost of Purchase Card matching shared design */}
                    <div className="rounded-2xl p-4 bg-white border border-slate-200/90 shadow-xs space-y-2.5 text-xs">
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Cost Of Purchase</span>
                        <span className="font-mono font-bold text-slate-900">
                          KSh {subtotal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span>Delivery / Fulfillment</span>
                          <span className="text-[9px] bg-[#F0FAF4] text-[#2EB85C] font-semibold px-2 py-0.5 rounded-md border border-[#2EB85C]/20">
                            {fulfillmentMethod === "pickup" ? "Store Pickup" : "Town Courier"}
                          </span>
                        </span>
                        <span
                          className={`font-mono font-bold ${
                            fulfillmentMethod === "pickup" ? "text-[#2EB85C]" : "text-slate-900"
                          }`}
                        >
                          {fulfillmentMethod === "pickup" ? "FREE" : `KSh ${deliveryFee.toLocaleString()}`}
                        </span>
                      </div>
                      <div className="h-px bg-slate-100 my-1" />
                      <div className="flex justify-between items-baseline pt-0.5">
                        <span className="text-xs font-bold text-slate-900">Total</span>
                        <span className="font-mono text-base font-bold text-slate-900">
                          KSh {grandTotal.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <button
                      id="proceed-to-checkout-btn"
                      onClick={() => setStep(1)}
                      className="w-full bg-[#2EB85C] hover:bg-[#279B42] text-white py-3.5 text-sm font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(46,184,92,0.3)] cursor-pointer active:scale-[0.99]"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight size={16} />
                    </button>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                      <button
                        onClick={handleWhatsAppCheckout}
                        className="bg-[#F0FAF4] hover:bg-[#e4f6ec] text-[#2EB85C] border border-[#2EB85C]/25 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare size={14} /> WhatsApp Order
                      </button>
                      <button
                        onClick={() => setInvoiceModalOpen(true)}
                        className="bg-[#F3F4F6] hover:bg-slate-200 text-slate-700 border border-slate-200/80 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <FileText size={14} /> Proforma Invoice
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Cart Proforma Invoice Modal */}
      {invoiceModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs text-[#1A1A1A]">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-7 shadow-2xl relative border border-slate-200/90 flex flex-col text-left max-h-[90vh] overflow-y-auto">
            {/* Top Solid Accent Bar */}
            <div className="h-1 w-full bg-[#2EB85C] rounded-full mb-4 shrink-0" />

            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-[#2EB85C] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                  M
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Proforma Invoice Proposal
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Official quote &amp; payment reference slip</p>
                </div>
              </div>
              <button
                onClick={() => setInvoiceModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-400 hover:text-slate-800 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Buyer Details */}
            <div className="rounded-2xl overflow-hidden border border-slate-200/90 bg-white shadow-xs mt-4">
              <div className="bg-[#F0FAF4] text-slate-900 p-3 flex items-center justify-between font-bold text-xs border-b border-slate-100">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <User size={14} className="text-[#2EB85C]" />
                  Buyer Information
                </span>
                <span className="bg-[#2EB85C] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                  Pre-filled
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-3 text-xs bg-white">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Customer Name
                  </span>
                  <input
                    type="text"
                    placeholder="John Kamau"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-[#F3F4F6] border border-transparent rounded-xl px-3 py-2 outline-none focus:border-[#2EB85C] focus:bg-white text-slate-900 text-xs font-medium transition"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Phone Number
                  </span>
                  <input
                    type="text"
                    placeholder="+254 7XX XXX XXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full bg-[#F3F4F6] border border-transparent rounded-xl px-3 py-2 outline-none focus:border-[#2EB85C] focus:bg-white text-slate-900 text-xs font-mono font-medium transition"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">County</span>
                  <input
                    type="text"
                    placeholder="Nairobi"
                    value={county}
                    onChange={(e) => setCounty(e.target.value)}
                    className="w-full bg-[#F3F4F6] border border-transparent rounded-xl px-3 py-2 outline-none focus:border-[#2EB85C] focus:bg-white text-slate-900 text-xs font-medium transition"
                  />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Major Town / Center
                  </span>
                  <input
                    type="text"
                    placeholder="Eldoret / Kitale"
                    value={town === "Other Town / Center" ? customTown : town}
                    onChange={(e) => setTown(e.target.value)}
                    className="w-full bg-[#F3F4F6] border border-transparent rounded-xl px-3 py-2 outline-none focus:border-[#2EB85C] focus:bg-white text-slate-900 text-xs font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Printable Cart Invoice */}
            <div
              id="printable-cart-proforma"
              className="mt-5 border border-slate-200/90 rounded-2xl p-6 bg-white space-y-6 text-xs text-slate-800 shadow-xs"
            >
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="text-left">
                  <h4 className="text-base font-bold text-[#2EB85C] tracking-tight">MQULIMA HUB</h4>
                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">Agriculture E-Commerce &amp; Advisory Network</p>
                  <p className="text-[10px] text-slate-400">Nairobi, Kenya • info@mqulima.com</p>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-bold text-slate-900">PROFORMA INVOICE</h3>
                  <p className="text-[10px] font-mono font-bold text-[#2EB85C] bg-[#F0FAF4] border border-[#2EB85C]/20 px-2 py-0.5 rounded-md inline-block mt-1">
                    {invoiceNumber}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-1 font-medium">Date: {invoiceDate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
                    INVOICED TO:
                  </span>
                  <strong className="text-xs text-slate-900 font-bold block mt-1">
                    {fullName || "Valued Farmer / Buyer"}
                  </strong>
                  <p className="text-[11px] text-slate-600 font-medium">
                    {fulfillmentMethod === "pickup"
                      ? `Fulfillment: Store Pickup at ${selectedDepot.name}, ${selectedDepot.address} (${selectedDepot.town})`
                      : `Destination: ${county} County, ${town === "Other Town / Center" ? customTown : town}${village ? `, ${village}` : ""}`}
                  </p>
                  {phoneNumber && (
                    <p className="text-[11px] text-slate-600 font-mono font-medium">Contact: {phoneNumber}</p>
                  )}
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700 font-bold text-[11px]">
                    <th className="py-2.5 px-2">Item Description</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-right">Unit Price</th>
                    <th className="py-2.5 px-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {cartItems.map((item) => (
                    <tr key={item.product.id} className="border-b border-slate-100">
                      <td className="py-3 px-2">
                        <strong className="text-xs text-slate-900">{item.product.name}</strong>
                        {item.product.brand && (
                          <span className="block text-[10px] text-slate-400 font-medium">
                            Brand: {item.product.brand}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-slate-950 font-mono">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-2 text-right font-mono text-slate-600">
                        KES {item.product.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-2 text-right font-mono font-bold text-[#2EB85C]">
                        KES {(item.product.price * item.quantity).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex justify-end pt-3">
                <div className="w-[260px] space-y-2 text-right text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Cost Of Purchase:</span>
                    <span className="font-mono font-bold text-slate-900">
                      KES {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>{fulfillmentMethod === "pickup" ? "Store Pickup Fee:" : "Shipping Fee:"}</span>
                    <span className="font-mono font-bold text-slate-900">
                      {fulfillmentMethod === "pickup" ? "KES 0 (FREE)" : `KES ${deliveryFee.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="h-px bg-slate-100 my-1" />
                  <div className="p-3 bg-[#F0FAF4] border border-[#2EB85C]/30 rounded-xl flex justify-between items-center text-slate-900 font-bold shadow-xs">
                    <span className="text-xs">Total:</span>
                    <span className="font-mono text-base font-bold text-[#2EB85C]">KES {grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <span className="text-[10px] text-slate-400 font-medium italic">
                *Official proforma document generated via Mqulima Hub. Valid for 7 days.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setInvoiceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    toast.success("Opening print portal...");
                    setTimeout(() => window.print(), 300);
                  }}
                  className="px-5 py-2.5 bg-[#2EB85C] hover:bg-[#279B42] rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 shadow-[0_4px_14px_rgba(46,184,92,0.3)] cursor-pointer"
                >
                  <Printer size={15} /> Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Airtel Money Direct STK Prompt & Payment Verification Modal */}
      {showAirtelModal && airtelPromptData && (
        <div className="fixed inset-0 z-50 overflow-y-auto font-sans flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs text-[#1A1A1A]">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-200 flex flex-col text-left overflow-hidden">
            {/* Top Red Header Strip */}
            <div className="h-1.5 w-full bg-[#ED1C24] -mt-6 -mx-6 mb-5 shrink-0" />

            {/* Header with authentic Airtel Branding */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-[#ED1C24] flex items-center justify-center text-white font-black text-lg shadow-sm">
                  a
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-base font-black text-slate-900 tracking-tight">
                      Airtel Money
                    </h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ED1C24]/10 text-[#ED1C24]">
                      Kenya
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium">Direct Mobile Money Prompt</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAirtelModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Body */}
            {airtelPaid ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle size={36} />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Confirmed!</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Your Airtel Money payment was received successfully.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl text-xs font-mono text-slate-600">
                  Ref: {airtelPromptData.reference}
                </div>
              </div>
            ) : (
              <div className="py-4 space-y-4">
                {/* Live Prompt Status Banner */}
                <div className="p-4 rounded-2xl bg-red-50/70 border border-red-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ED1C24] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ED1C24]"></span>
                    </span>
                    <span className="text-xs font-bold text-[#ED1C24] uppercase tracking-wider">
                      Authorization Prompt Sent
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    A prompt has been sent to your Airtel phone:{" "}
                    <strong className="text-slate-900 font-mono">{airtelPromptData.phone}</strong>.
                    Please check your phone screen and enter your{" "}
                    <strong className="text-[#ED1C24]">Airtel Money PIN</strong> to complete payment.
                  </p>
                </div>

                {/* Amount & Reference Details */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500">Payable Amount:</span>
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      KSh {airtelPromptData.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-400">Order Ref:</span>
                    <span className="font-mono text-slate-600">{airtelPromptData.reference}</span>
                  </div>
                </div>

                {/* Interoperability / USSD Fallback */}
                <div className="rounded-xl border border-slate-200/80 p-3 space-y-1.5 text-left bg-white">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>💡</span> Didn&apos;t receive prompt? Pay via Airtel USSD:
                  </p>
                  <ol className="text-[11px] text-slate-600 space-y-0.5 list-decimal list-inside pl-0.5 font-medium leading-relaxed">
                    <li>Dial <strong className="text-slate-900">*334#</strong> on your Airtel line</li>
                    <li>Select <strong className="text-slate-900">Paybill</strong> or <strong className="text-slate-900">Send to M-Pesa</strong></li>
                    <li>Business No: <strong className="text-slate-900 font-mono">400200</strong></li>
                    <li>Account No: <strong className="text-slate-900 font-mono">{airtelPromptData.reference}</strong></li>
                    <li>Enter Amount <strong className="text-slate-900">KSh {airtelPromptData.amount.toLocaleString()}</strong> &amp; your PIN</li>
                  </ol>
                </div>

                {/* Polling / Manual Status Check Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleManualAirtelCheck}
                    disabled={airtelChecking}
                    className="w-full py-3.5 rounded-xl bg-[#ED1C24] hover:bg-[#C9141B] text-white font-bold text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(237,28,36,0.3)] cursor-pointer disabled:opacity-75"
                  >
                    {airtelChecking ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Verifying with Airtel...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} />
                        <span>I Have Entered My PIN / Check Status</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowAirtelModal(false);
                      setStep(3); // View dispatch & order tracking
                    }}
                    className="w-full py-2.5 text-center text-xs text-slate-500 hover:text-slate-800 font-medium transition cursor-pointer"
                  >
                    Continue to Order Dispatch Screen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
