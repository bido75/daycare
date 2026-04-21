"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CheckCircle, XCircle, QrCode, LogIn, LogOut, Users, Upload, Camera } from "lucide-react";
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
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [processing, setProcessing] = useState(false);
  const scannerRef = useRef<any>(null);
  const resetTimerRef = useRef<NodeJS.Timeout | null>(null);
  const scanningRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mount flag + clock
  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Check if camera is available (needs HTTPS or localhost)
  useEffect(() => {
    if (!mounted) return;
    const isSecure = window.location.protocol === "https:" || window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
    if (!isSecure) {
      setCameraAvailable(false);
      return;
    }
    navigator.mediaDevices?.getUserMedia({ video: true })
      .then((stream) => {
        stream.getTracks().forEach(t => t.stop());
        setCameraAvailable(true);
      })
      .catch(() => setCameraAvailable(false));
  }, [mounted]);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) await scannerRef.current.stop();
      } catch (e) { /* ignore */ }
      scannerRef.current = null;
    }
  }, []);

  const resetToScan = useCallback(() => {
    if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    setScanResult(null);
    setErrorMsg("");
    setProcessing(false);
    scanningRef.current = false;
    setStep("scan");
  }, []);

  // Process QR token (shared between camera scan and file upload)
  const processQrToken = useCallback(async (decodedText: string) => {
    try {
      setProcessing(true);
      const endpoint = mode === "checkin" ? "/attendance/qr/check-in" : "/attendance/qr/check-out";
      const { data } = await api.post(endpoint, { qrToken: decodedText });
      setScanResult(data);
      setStep("confirm");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || "Invalid QR code or scan failed.");
      setStep("error");
    } finally {
      setProcessing(false);
    }
  }, [mode]);

  // Auto-reset after success/error
  useEffect(() => {
    if (step === "success" || step === "error") {
      resetTimerRef.current = setTimeout(resetToScan, 5000);
    }
    return () => {
      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
    };
  }, [step, resetToScan]);

  // Camera-based QR Scanner (only when camera is available)
  useEffect(() => {
    if (step !== "scan" || !mounted || cameraAvailable !== true) return;

    let cancelled = false;

    const startScanner = async () => {
      const { Html5Qrcode } = await import("html5-qrcode");
      if (cancelled) return;

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 300, height: 300 }, aspectRatio: 1 },
          async (decodedText) => {
            if (scanningRef.current) return;
            scanningRef.current = true;
            try { await html5QrCode.stop(); } catch (e) { /* ignore */ }
            scannerRef.current = null;
            processQrToken(decodedText);
          },
          () => {}
        );
      } catch (err) {
        console.error("Camera failed:", err);
        setCameraAvailable(false);
      }
    };

    const timer = setTimeout(startScanner, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      stopScanner();
    };
  }, [step, mounted, cameraAvailable, mode, stopScanner, processQrToken]);

  // Handle file upload for QR scanning
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setProcessing(true);
      const { Html5Qrcode } = await import("html5-qrcode");
      const html5QrCode = new Html5Qrcode("qr-file-reader");
      const result = await html5QrCode.scanFile(file, true);
      html5QrCode.clear();
      await processQrToken(result);
    } catch (err) {
      setErrorMsg("Could not read QR code from image. Please try again with a clearer image.");
      setStep("error");
    } finally {
      setProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle paste for QR token (manual entry)
  const [manualToken, setManualToken] = useState("");
  const handleManualSubmit = () => {
    if (manualToken.trim()) {
      processQrToken(manualToken.trim());
    }
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  const formatDate = (d: Date) =>
    d.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  const actionedStudents =
    mode === "checkin" ? scanResult?.checkedIn : scanResult?.checkedOut;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hidden div for file-based QR scanning */}
      <div id="qr-file-reader" style={{ display: "none" }} />

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
                Open the parent app &rarr; My QR Code &rarr; {cameraAvailable ? "show the code to the camera" : "screenshot it and upload below"}
              </p>
            </div>

            {/* Camera scanner (when available) */}
            {cameraAvailable === true && (
              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden border-2 border-slate-600 bg-slate-800"
                style={{ minHeight: 340 }}
              />
            )}

            {/* File upload fallback (when camera not available) */}
            {cameraAvailable === false && (
              <div className="w-full space-y-4">
                <div className="bg-slate-800 border-2 border-dashed border-slate-600 rounded-2xl p-8 text-center">
                  <Camera className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                  <p className="text-slate-400 mb-2 text-sm">
                    Camera requires HTTPS. Use one of these options:
                  </p>

                  {/* Upload QR image */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="qr-upload"
                  />
                  <label
                    htmlFor="qr-upload"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-lg font-semibold cursor-pointer transition-colors"
                  >
                    <Upload className="h-5 w-5" />
                    {processing ? "Processing..." : "Upload QR Code Image"}
                  </label>

                  <p className="text-slate-500 text-xs mt-3">
                    Take a photo or screenshot of the parent&apos;s QR code
                  </p>
                </div>

                {/* Manual token paste */}
                <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                  <p className="text-slate-400 text-sm mb-3 text-center">Or paste the QR token directly:</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualToken}
                      onChange={(e) => setManualToken(e.target.value)}
                      placeholder="Paste QR token here..."
                      className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleManualSubmit}
                      disabled={!manualToken.trim() || processing}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-xl font-semibold transition-colors"
                    >
                      {mode === "checkin" ? "Check In" : "Check Out"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Loading state */}
            {cameraAvailable === null && (
              <div className="w-full rounded-2xl border-2 border-slate-600 bg-slate-800 flex items-center justify-center" style={{ minHeight: 340 }}>
                <p className="text-slate-400">Checking camera availability...</p>
              </div>
            )}
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
