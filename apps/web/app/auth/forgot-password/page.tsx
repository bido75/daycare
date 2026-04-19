"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import api from "@/lib/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", data);
      setSent(true);
      toast.success("Reset link sent — check your email.");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Forgot your password?</h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      {sent ? (
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <span className="text-2xl">📧</span>
          </div>
          <p className="text-sm text-muted-foreground">
            If that email is registered, you&apos;ll receive a reset link shortly.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
            <input
              type="email"
              autoComplete="email"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? "Sending..." : "Send Reset Link"}
          </button>

          <p className="text-center">
            <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to login
            </Link>
          </p>
        </form>
      )}
    </div>
  );
}
