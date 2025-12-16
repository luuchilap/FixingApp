import { Header } from "./Header";
import { Footer } from "./Footer";

export function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex-1 px-4 pb-8 pt-4">{children}</main>
      <Footer />
    </div>
  );
}


