import { Link, useLocation } from "react-router-dom";
import { Trophy, Users, Shuffle, History } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Início", icon: Trophy },
  { to: "/equipes", label: "Equipes", icon: Users },
  { to: "/sorteio", label: "Sorteio", icon: Shuffle },
  { to: "/historico", label: "Histórico", icon: History },
];

export const AppHeader = () => {
  const { pathname } = useLocation();
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-xl sticky top-0 z-40">
      <div className="container flex items-center justify-between h-16 md:h-20">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary grid place-items-center shadow-glow group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <div className="font-display text-lg font-bold tracking-wide leading-none">SORTEIO</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Congresso Técnico</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 md:gap-2">
          {links.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  "flex items-center gap-2 px-3 md:px-4 py-2 rounded-md text-sm font-medium transition-all",
                  active
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
