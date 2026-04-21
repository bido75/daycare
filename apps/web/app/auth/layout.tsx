"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";

interface AcademyProfile {
  name?: string;
  logo?: string;
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const [academy, setAcademy] = useState<AcademyProfile>({});

  useEffect(() => {
    const baseUrl = `http://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:4000/api`;
    fetch(`${baseUrl}/settings/public/academy_profile`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data) setAcademy(data.data);
      })
      .catch(() => {});
  }, []);

  const academyName = academy.name || "Creative Kids Academy";

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex justify-center border-b border-border bg-background">
        <Link href="/" className="flex items-center gap-2">
          {academy.logo ? (
            <img src={academy.logo} alt="Logo" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <Heart className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          <span className="font-bold text-lg text-foreground">{academyName}</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-background">
        © {new Date().getFullYear()} {academyName}. All rights reserved.
      </footer>
    </div>
  );
}
