"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "react-qr-code";
import { Download, RefreshCw, QrCode, Info } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function ParentQrCodePage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const qrRef = useRef<HTMLDivElement>(null);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/attendance/qr-token/me");
      setToken(data.token);
    } catch {
      toast.error("Failed to load QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();
  }, []);

  const downloadQr = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = "checkin-qr-code.png";
      link.href = pngUrl;
      link.click();
    };
    img.src = url;
    toast.success("QR code downloaded!");
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My QR Code</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Use this QR code at the kiosk to check your child in or out.
        </p>
      </div>

      <div className="max-w-md mx-auto">
        {/* QR Card */}
        <div className="bg-card border rounded-2xl p-8 text-center shadow-sm">
          <div className="flex items-center justify-center gap-2 mb-6">
            <QrCode className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-lg">Check-In QR Code</h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-52">
              <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : token ? (
            <div ref={qrRef} className="flex justify-center mb-6 p-4 bg-white rounded-xl border">
              <QRCode value={token} size={220} />
            </div>
          ) : (
            <div className="h-52 flex items-center justify-center text-muted-foreground">
              Could not load QR code.
            </div>
          )}

          <div className="flex gap-3 mt-2">
            <button
              onClick={downloadQr}
              disabled={!token || loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-border bg-background hover:bg-muted text-sm font-medium transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>
            <button
              onClick={fetchToken}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-5 bg-blue-50 border border-blue-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900 text-sm mb-2">How to use your QR code</h3>
              <ol className="text-blue-800 text-sm space-y-1.5 list-decimal list-inside">
                <li>Go to the kiosk at the daycare entrance</li>
                <li>Select <strong>Check In</strong> or <strong>Check Out</strong></li>
                <li>Hold your QR code up to the camera</li>
                <li>Confirm the student(s) on screen</li>
                <li>Done — the kiosk will confirm success!</li>
              </ol>
              <p className="text-blue-700 text-xs mt-3">
                Your QR code is valid for 24 hours. Tap Refresh to generate a new one if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
