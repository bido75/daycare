"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  FileText,
  ArrowLeftRight,
  AlertTriangle,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
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
}

const PIE_COLORS = ["#4f46e5", "#e5e7eb"];

export default function FinanceDashboard() {
  const [invoiceStats, setInvoiceStats] = useState<Stats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fmt = (n?: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoiceStats?.currency ?? "USD",
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [iRes, pRes] = await Promise.all([
        api.get("/billing/invoices/stats"),
        api.get("/billing/payments/stats"),
      ]);
      setInvoiceStats(iRes.data);
      setPaymentStats(pRes.data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalInvoiced = (invoiceStats?.paidThisMonth ?? 0) + (invoiceStats?.outstandingBalance ?? 0);
  const pieData = [
    { name: "Collected", value: paymentStats?.totalCollected ?? 0 },
    { name: "Outstanding", value: invoiceStats?.outstandingBalance ?? 0 },
  ];

  const metrics = [
    { label: "Total Invoiced (Month)", value: fmt(totalInvoiced), icon: FileText, color: "bg-blue-500" },
    { label: "Transactions This Month", value: String(paymentStats?.thisMonth.count ?? "–"), icon: ArrowLeftRight, color: "bg-green-500" },
    { label: "Outstanding Balances", value: fmt(invoiceStats?.outstandingBalance), icon: AlertTriangle, color: "bg-orange-500" },
    { label: "Payments Received", value: fmt(paymentStats?.totalCollected), icon: CreditCard, color: "bg-purple-500" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Financial Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Summary of billing and payment activity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-6 flex items-start gap-4">
              <div className={`p-3 rounded-lg ${m.color}`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{m.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{loading ? "–" : m.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">Revenue Trend</h2>
          </div>
          {invoiceStats?.revenueByMonth && invoiceStats.revenueByMonth.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={invoiceStats.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={(v) => `$${v}`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`$${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400">No revenue data yet</div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Collected vs Outstanding</h2>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, index) => (
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href: "/finance/invoices", label: "Manage Invoices", icon: FileText, color: "bg-blue-50 text-blue-600" },
          { href: "/finance/transactions", label: "View Transactions", icon: ArrowLeftRight, color: "bg-green-50 text-green-600" },
          { href: "/finance/outstanding", label: "Outstanding Balances", icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
          { href: "/finance/fee-types", label: "Fee Types", icon: CreditCard, color: "bg-purple-50 text-purple-600" },
        ].map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href} href={link.href} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-3 hover:border-indigo-300 transition-colors">
              <div className={`p-2 rounded-lg ${link.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium text-gray-900 text-sm">{link.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
