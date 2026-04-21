"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";

let cachedCurrency: string | null = null;
let fetchPromise: Promise<string> | null = null;

async function fetchCurrency(): Promise<string> {
  if (cachedCurrency) return cachedCurrency;
  if (fetchPromise) return fetchPromise;

  fetchPromise = api
    .get("/settings/fee_structure")
    .then((res) => {
      const data = res.data?.data ?? res.data;
      cachedCurrency = (data?.currency as string) ?? "USD";
      return cachedCurrency!;
    })
    .catch(() => {
      fetchPromise = null;
      return "USD";
    });

  return fetchPromise;
}

export function useCurrency() {
  const [currency, setCurrency] = useState<string>(cachedCurrency ?? "USD");

  useEffect(() => {
    fetchCurrency().then(setCurrency);
  }, []);

  const fmt = (n?: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(n ?? 0);

  return { currency, fmt };
}
