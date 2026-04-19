"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { Suspense } from "react";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormData = z.infer<typeof schema>;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    if (!token) {
      toast.error("Invalid reset link. Please request a new one.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password: data.password });
      toast.success("Password updated! Please log in.");
      router.push("/auth/login");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Reset failed. The link may have expired.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-8">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-foreground mb-1">Set a new password</h1>
        <p className="text-sm text-muted-foreground">Enter your new password below.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">New Password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="At least 8 characters"
            {...register("password")}
          />
          {errors.password && <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Confirm New Password</label>
          <input
            type="password"
            autoComplete="new-password"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Re-enter password"
            {...register("confirmPassword")}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-xs text-destructive">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? "Saving..." : "Reset Password"}
        </button>
      </form>

      <p className="mt-4 text-center">
        <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
          Back to login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center text-muted-foreground">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
