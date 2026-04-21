"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  DollarSign,
  AlertTriangle,
  TrendingUp,
  CreditCard,
  Plus,
  ClipboardList,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Link from "next/link";

interface Stats {
  outstandingBalance: number;
  overdueCount: number;
  paidThisMonth: number;
  revenueByMonth: { month: string; revenue: number }[];
  currency?: string;
}

interface PaymentStats {
  totalCollected: number;
  totalTransactions: number;
  thisMonth: { amount: number; count: number };
  byMethod: { method: string; amount: number; count: number }[];
}

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
  invoice: {
    invoiceNumber: string;
    parent: { firstName: string; lastName: string };
  };
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function AdminPaymentsPage() {
  const [invoiceStats, setInvoiceStats] = useState<Stats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, payStatsRes, paymentsRes] = await Promise.all([
        api.get("/billing/invoices/stats"),
        api.get("/billing/payments/stats"),
        api.get("/billing/payments", { params: { limit: 10 } }),
      ]);
      setInvoiceStats(statsRes.data);
      setPaymentStats(payStatsRes.data);
      setRecentPayments(paymentsRes.data.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const fmt = (n?: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoiceStats?.currency ?? "USD",
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  const statusColor: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
    REFUNDED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments &amp; Billing</h1>
          <p className="text-gray-500 text-sm mt-1">Financial overview and management</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/payments/invoices"
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
            Create Invoice
          </Link>
          <Link
            href="/admin/payments/transactions"
            className="flex items-center gap-2 border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50"
          >
            <CreditCard className="w-4 h-4" />
            Record Payment
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Revenue This Month"
          value={fmt(invoiceStats?.paidThisMonth)}
          icon={TrendingUp}
          color="bg-green-500"
          subtitle="Paid invoices"
        />
        <StatCard
          title="Outstanding Balance"
          value={fmt(invoiceStats?.outstandingBalance)}
          icon={DollarSign}
          color="bg-indigo-500"
          subtitle="Unpaid invoices"
        />
        <StatCard
          title="Overdue Invoices"
          value={String(invoiceStats?.overdueCount ?? 0)}
          icon={AlertTriangle}
          color="bg-red-500"
          subtitle="Require attention"
        />
        <StatCard
          title="Total Collected"
          value={fmt(paymentStats?.totalCollected)}
          icon={CreditCard}
          color="bg-blue-500"
          subtitle={`${paymentStats?.totalTransactions ?? 0} transactions`}
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h2>
        {invoiceStats?.revenueByMonth && invoiceStats.revenueByMonth.length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={invoiceStats.revenueByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-40 text-gray-400">
            No revenue data yet
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/admin/payments/invoices"
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-indigo-300 transition-colors"
        >
          <div className="p-3 bg-indigo-50 rounded-lg">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Invoices</p>
            <p className="text-sm text-gray-500">Manage &amp; create invoices</p>
          </div>
        </Link>
        <Link
          href="/admin/payments/transactions"
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-indigo-300 transition-colors"
        >
          <div className="p-3 bg-green-50 rounded-lg">
            <CreditCard className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Transactions</p>
            <p className="text-sm text-gray-500">View payment history</p>
          </div>
        </Link>
        <Link
          href="/admin/payments/fee-types"
          className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:border-indigo-300 transition-colors"
        >
          <div className="p-3 bg-purple-50 rounded-lg">
            <DollarSign className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Fee Types</p>
            <p className="text-sm text-gray-500">Configure fee structures</p>
          </div>
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
          <Link href="/admin/payments/transactions" className="text-sm text-indigo-600 hover:underline">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="p-8 text-center text-gray-400">Loading...</div>
        ) : recentPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No transactions yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 text-xs uppercase border-b border-gray-100">
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Parent</th>
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentPayments.map((p) => (
                  <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-900">
                      {p.invoice?.parent
                        ? `${p.invoice.parent.firstName} ${p.invoice.parent.lastName}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-gray-600">
                      {p.invoice?.invoiceNumber ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-semibold text-gray-900">{fmt(p.amount)}</td>
                    <td className="px-5 py-3 text-gray-600">{p.method}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          statusColor[p.status] ?? "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
