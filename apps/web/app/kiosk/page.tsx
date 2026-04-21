"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, QrCode, LogIn, LogOut, Users } from "lucide-react";
import api from "@/lib/api";

type Mode = "checkin" | "checkout";
type Step = "scan" | "confirm" | "success" | "error";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string | null;
}

interface ScanResult {
  parentId: string;
  students: Student[];
  checkedIn?: any[];
  checkedOut?: any[];
}

export default function KioskPage() {
  const [mode, setMode] = useState<Mode>("checkin");
  const [step, setStep] = useState<Step>("scan");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const scannerRef = useRef<any>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanningRef = useRef(false);

  // Mount flag + clock (client-only to avoid hydration mismatch)
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch (e) { /* ignore */ }
      scannerRef.current = null;
    }
  }, []);

  const resetToScan = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setScanResult(null);
    setErrorMsg("");
    scanningRef.current = false;
    setStep("scan");
  }, []);

  // Auto-reset after success/error
  useEffect(() => {
    if (step === "success" || step === "error") {
      resetTimerRef.current = setTimeout(resetToScan, 5000);
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [step, resetToScan]);

  // QR Scanner — use Html5Qrcode directly for auto camera start
  useEffect(() => {
    if (step !== "scan" || !mounted) return;

    let cancelled = false;

    const startScanner = async () => {
      // Dynamic import to avoid SSR issues
      const { Html5Qrcode } = await import("html5-qrcode");

      if (cancelled) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 }, aspectRatio: 1 },
          async (decodedText) => {
            if (scanningRef.current) return; // prevent double-scan
            scanningRef.current = true;

            try {
              await html5QrCode.stop();
            } catch (e) { /* ignore */ }
            scannerRef.current = null;

            try {
              const endpoint = mode === "checkin" ? "/attendance/qr/check-in" : "/attendance/qr/check-out";
              const { data } = await api.post(endpoint, { qrToken: decodedText });
              setScanResult(data);
              setStep("confirm");
            } catch (err: any) {
              setErrorMsg(err?.response?.data?.message || "Invalid QR code or scan failed.");
              setStep("error");
            }
          },
          () => { /* scan miss — normal, ignore */ }
        );
      } catch (err) {
        console.error("Camera start failed:", err);
        // Fallback: camera not available or permission denied
        setErrorMsg("Camera access denied or not available. Please allow camera permissions and try again.");
        setStep("error");
      }
    };

    // Small delay to ensure DOM element exists
    const timer = setTimeout(startScanner, 200);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [step, mounted, mode, stopScanner]);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const actionedStudents =
    mode === "checkin" ? scanResult?.checkedIn : scanResult?.checkedOut;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-slate-700">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Creative Kids Academy</h1>
          <p className="text-slate-400 text-sm mt-0.5">Parent Check-In / Check-Out Kiosk</p>
        </div>
        <div className="text-right" suppressHydrationWarning>
          <div className="text-4xl font-mono font-bold text-white" suppressHydrationWarning>
            {now ? formatTime(now) : "--:--:--"}
          </div>
          <div className="text-slate-400 text-sm mt-0.5" suppressHydrationWarning>
            {now ? formatDate(now) : ""}
          </div>
        </div>
      </header>

      {/* Mode Toggle */}
      <div className="flex justify-center mt-6 gap-3">
        <button
          onClick={() => { setMode("checkin"); stopScanner().then(resetToScan); }}
          className={`flex items-center gap-2 px-8 py-3 rounded-full text-lg font-semibold transition-all ${
            mode === "checkin"
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <LogIn className="h-5 w-5" />
          Check In
        </button>
        <button
          onClick={() => { setMode("checkout"); stopScanner().then(resetToScan); }}
          className={`flex items-center gap-2 px-8 py-3 rounded-full text-lg font-semibold transition-all ${
            mode === "checkout"
              ? "bg-amber-500 text-white shadow-lg shadow-amber-500/30"
              : "bg-slate-700 text-slate-300 hover:bg-slate-600"
          }`}
        >
          <LogOut className="h-5 w-5" />
          Check Out
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-8">
        {step === "scan" && (
          <div className="flex flex-col items-center gap-6 w-full max-w-lg">
            <div className="text-center">
              <QrCode className="h-12 w-12 text-slate-400 mx-auto mb-3" />
              <h2 className="text-2xl font-bold text-white">
                Scan Your QR Code to {mode === "checkin" ? "Check In" : "Check Out"}
              </h2>
              <p className="text-slate-400 mt-2">
                Open the parent app &rarr; My QR Code &rarr; show the code to the camera
              </p>
            </div>
            <div
              id="qr-reader"
              className="w-full rounded-2xl overflow-hidden border-2 border-slate-600 bg-slate-800"
              style={{ minHeight: 340 }}
            />
          </div>
        )}

        {step === "confirm" && scanResult && (
          <div className="flex flex-col items-center gap-6 w-full max-w-xl">
            <div className="flex items-center gap-3">
              <Users className="h-10 w-10 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                {mode === "checkin" ? "Checking In" : "Checking Out"}:{" "}
                {actionedStudents?.length ?? 0} student{(actionedStudents?.length ?? 0) !== 1 ? "s" : ""}
              </h2>
            </div>

            <div className="w-full grid gap-3">
              {scanResult.students.map((s) => {
                const actioned = (actionedStudents ?? []).find((a: any) => a.studentId === s.id || a.student?.id === s.id);
                return (
                  <div
                    key={s.id}
                    className="flex items-center justify-between bg-slate-800 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white">
                        {s.firstName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-lg">
                          {s.firstName} {s.lastName}
                        </div>
                      </div>
                    </div>
                    {actioned ? (
                      <span className="text-emerald-400 text-sm font-medium">
                        {mode === "checkin" ? "Checked In" : "Checked Out"}
                      </span>
                    ) : (
                      <span className="text-slate-500 text-sm">Already {mode === "checkin" ? "checked in" : "checked out"}</span>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setStep("success")}
              className="w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xl font-bold transition-colors shadow-lg"
            >
              Confirm — Done
            </button>
            <button onClick={resetToScan} className="text-slate-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <CheckCircle className="h-28 w-28 text-emerald-400" />
            <h2 className="text-4xl font-bold text-white">
              {mode === "checkin" ? "Check-In" : "Check-Out"} Complete!
            </h2>
            <p className="text-slate-400 text-xl">Have a wonderful day!</p>
            <p className="text-slate-500 text-sm">Resetting in 5 seconds...</p>
          </div>
        )}

        {step === "error" && (
          <div className="flex flex-col items-center gap-6 text-center">
            <XCircle className="h-28 w-28 text-red-400" />
            <h2 className="text-4xl font-bold text-white">Scan Failed</h2>
            <p className="text-slate-300 text-xl max-w-md">{errorMsg}</p>
            <p className="text-slate-500 text-sm">Resetting in 5 seconds...</p>
            <button
              onClick={resetToScan}
              className="px-8 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-slate-600 text-sm border-t border-slate-800">
        Creative Kids Academy - Kiosk Mode - {mode === "checkin" ? "Check In" : "Check Out"}
      </footer>
    </div>
  );
}
