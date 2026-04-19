import Link from "next/link";
import { Heart } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col">
      {/* Header */}
      <header className="py-4 px-6 flex justify-center border-b border-border bg-background">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <Heart className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">Creative Kids Academy</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground border-t border-border bg-background">
        © {new Date().getFullYear()} Creative Kids Academy. All rights reserved.
      </footer>
    </div>
  );
}
