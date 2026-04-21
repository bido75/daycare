export default function KioskLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white overflow-hidden">
      {children}
    </div>
  );
}
