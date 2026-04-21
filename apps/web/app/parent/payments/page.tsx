"use client";

import { useEffect, useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import api from "@/lib/api";
import { Download, X, CreditCard, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: string;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  dueDate: string;
  createdAt: string;
  items: {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  payments: {
    id: string;
    amount: number;
    method: string;
    status: string;
    paidAt?: string;
    receipt?: { id: string; receiptNumber: string };
  }[];
}

const fmt = (n?: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n ?? 0
  );

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-700",
  VOID: "bg-gray-100 text-gray-500",
  PARTIALLY_PAID: "bg-blue-100 text-blue-700",
  DRAFT: "bg-gray-100 text-gray-600",
};

// Stripe checkout form
function CheckoutForm({
  clientSecret,
  invoiceNumber,
  amount,
  onSuccess,
  onClose,
}: {
  clientSecret: string;
  invoiceNumber: string;
  amount: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setErrorMsg("");

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (result.error) {
      setErrorMsg(result.error.message ?? "Payment failed");
      setProcessing(false);
    } else if (result.paymentIntent?.status === "succeeded") {
      toast.success("Payment successful!");
      onSuccess();
    }
    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-indigo-50 rounded-lg p-4">
        <p className="text-sm text-gray-600">
          Invoice <span className="font-mono font-medium">{invoiceNumber}</span>
        </p>
        <p className="text-2xl font-bold text-indigo-700 mt-1">{fmt(amount)}</p>
      </div>
      <PaymentElement />
      {errorMsg && (
        <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{errorMsg}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700 disabled:opacity-60"
      >
        {processing ? "Processing..." : `Pay ${fmt(amount)}`}
      </button>
    </form>
  );
}

export default function ParentPaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/billing/invoices", { params: { limit: 50 } });
      setInvoices(res.data.data || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const handlePay = async (invoice: Invoice) => {
    try {
      const res = await api.post("/billing/payments/create-intent", {
        invoiceId: invoice.id,
      });
      setClientSecret(res.data.clientSecret);
      setPaymentAmount(res.data.amount);
      setPayingInvoice(invoice);
      setPaymentSuccess(false);
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to initiate payment");
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPayingInvoice(null);
      setClientSecret(null);
      fetchInvoices();
    }, 2000);
  };

  const handleDownloadReceipt = async (receiptId: string, receiptNumber: string) => {
    try {
      const res = await api.get(`/billing/receipts/${receiptId}/pdf`, {
        responseType: "blob",
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${receiptNumber}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download receipt");
    }
  };

  const pendingInvoices = invoices.filter((inv) =>
    ["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(inv.status)
  );
  const totalOutstanding = pendingInvoices.reduce(
    (sum, inv) => sum + inv.balanceDue,
    0
  );
  const paidInvoices = invoices.filter((inv) => inv.status === "PAID");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="text-sm text-gray-500 mt-1">View invoices and payment history</p>
      </div>

      {/* Outstanding Balance Card */}
      {totalOutstanding > 0 && (
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white">
          <p className="text-indigo-200 text-sm">Outstanding Balance</p>
          <p className="text-4xl font-bold mt-1">{fmt(totalOutstanding)}</p>
          <p className="text-indigo-200 text-sm mt-2">
            {pendingInvoices.length} invoice
            {pendingInvoices.length !== 1 ? "s" : ""} pending
          </p>
        </div>
      )}

      {/* Current Invoices */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Current Invoices</h2>
        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : invoices.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No invoices yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-medium text-indigo-600">
                      {inv.invoiceNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[inv.status] ?? "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Due: {new Date(inv.dueDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{fmt(inv.totalAmount)}</p>
                  {inv.balanceDue > 0 && inv.balanceDue < inv.totalAmount && (
                    <p className="text-xs text-gray-400">
                      Balance: {fmt(inv.balanceDue)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50"
                  >
                    Details
                  </button>
                  {["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(inv.status) && (
                    <button
                      onClick={() => handlePay(inv)}
                      className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment History */}
      {paidInvoices.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Payment History</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 text-xs bg-gray-50 border-b">
                    <th className="px-5 py-3">Invoice</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-5 py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paidInvoices.map((inv) =>
                    inv.payments
                      .filter((p) => p.status === "COMPLETED")
                      .map((p) => (
                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-5 py-3 font-mono text-indigo-600 text-xs">
                            {inv.invoiceNumber}
                          </td>
                          <td className="px-5 py-3 font-medium text-gray-900">
                            {fmt(p.amount)}
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">
                            {p.paidAt ? new Date(p.paidAt).toLocaleDateString() : "—"}
                          </td>
                          <td className="px-5 py-3">
                            {p.receipt ? (
                              <button
                                onClick={() =>
                                  handleDownloadReceipt(
                                    p.receipt!.id,
                                    p.receipt!.receiptNumber
                                  )
                                }
                                className="flex items-center gap-1 text-indigo-600 hover:underline text-xs"
                              >
                                <Download className="w-3 h-3" />
                                {p.receipt.receiptNumber}
                              </button>
                            ) : (
                              <span className="text-gray-300 text-xs">—</span>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <div>
                <h2 className="text-lg font-semibold">
                  Invoice {selectedInvoice.invoiceNumber}
                </h2>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    STATUS_COLORS[selectedInvoice.status]
                  }`}
                >
                  {selectedInvoice.status}
                </span>
              </div>
              <button onClick={() => setSelectedInvoice(null)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-400 text-xs border-b">
                    <th className="text-left pb-2">Description</th>
                    <th className="text-right pb-2">Qty</th>
                    <th className="text-right pb-2">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedInvoice.items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50">
                      <td className="py-2">{item.description}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right font-medium">
                        {fmt(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Total</span>
                  <span>{fmt(selectedInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Paid</span>
                  <span>{fmt(selectedInvoice.paidAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-indigo-600 border-t pt-2">
                  <span>Balance Due</span>
                  <span>{fmt(selectedInvoice.balanceDue)}</span>
                </div>
              </div>
              {["PENDING", "OVERDUE", "PARTIALLY_PAID"].includes(selectedInvoice.status) && (
                <button
                  onClick={() => {
                    setSelectedInvoice(null);
                    handlePay(selectedInvoice);
                  }}
                  className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-indigo-700"
                >
                  Pay {fmt(selectedInvoice.balanceDue)}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stripe Payment Modal */}
      {payingInvoice && clientSecret && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold">Complete Payment</h2>
              {!paymentSuccess && (
                <button
                  onClick={() => {
                    setPayingInvoice(null);
                    setClientSecret(null);
                  }}
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              )}
            </div>
            <div className="p-6">
              {paymentSuccess ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900">Payment Successful!</h3>
                  <p className="text-gray-500 text-sm mt-2">
                    Your payment has been processed.
                  </p>
                </div>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{ clientSecret, appearance: { theme: "stripe" } }}
                >
                  <CheckoutForm
                    clientSecret={clientSecret}
                    invoiceNumber={payingInvoice.invoiceNumber}
                    amount={paymentAmount}
                    onSuccess={handlePaymentSuccess}
                    onClose={() => {
                      setPayingInvoice(null);
                      setClientSecret(null);
                    }}
                  />
                </Elements>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
