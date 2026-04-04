import { useState, useRef, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/src/lib/utils";
import { Activity, Shield, Home, UserCircle, LogOut, Moon, Sun, Settings, LogIn } from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "@/src/context/AuthContext";

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isRegistered, user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navItems = [
    { name: "Accueil", path: "/", icon: Home },
    { name: "Thématique", path: "/vault", icon: Shield },
    { name: "Inscription", path: "/register", icon: UserCircle },
    { name: "Admin", path: "/admin", icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-surface transition-colors duration-300">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20">
        <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            <span className="font-headline text-lg md:text-xl font-bold tracking-tighter text-on-surface">
              Biopsie des Organes
            </span>
          </div>
          
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "font-headline text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.path
                    ? "text-primary"
                    : "text-on-surface-variant"
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-full hover:bg-surface-container-highest transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5 text-on-surface-variant" />
              ) : (
                <Moon className="h-5 w-5 text-on-surface-variant" />
              )}
            </button>
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                  isRegistered ? "bg-primary text-on-primary ring-2 ring-primary/20" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-container-highest/80"
                )}
                aria-label="Menu utilisateur"
              >
                <UserCircle className="h-5 w-5" />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-surface border border-outline/10 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-3 border-b border-outline/10 bg-surface-container-lowest">
                    <p className="text-sm font-semibold text-on-surface">
                      {isRegistered ? `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Résident" : "Visiteur"}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {isRegistered ? "Accès autorisé" : "Non connecté"}
                    </p>
                  </div>
                  <div className="p-1">
                    {!isRegistered ? (
                      <>
                        <button 
                          onClick={() => { setIsProfileOpen(false); navigate("/login"); }}
                          className="w-full text-left flex items-center px-3 py-2.5 text-sm text-on-surface rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <LogIn className="w-4 h-4 mr-2" /> Se Connecter
                        </button>
                        <button 
                          onClick={() => { setIsProfileOpen(false); navigate("/register"); }}
                          className="w-full text-left flex items-center px-3 py-2.5 text-sm text-on-surface rounded-xl hover:bg-primary/10 hover:text-primary transition-colors mt-1"
                        >
                          <UserCircle className="w-4 h-4 mr-2" /> S'inscrire
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setIsProfileOpen(false); navigate("/profile"); }}
                          className="w-full text-left flex items-center px-3 py-2.5 text-sm text-on-surface rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                        >
                          <Settings className="w-4 h-4 mr-2" /> Mon Profil
                        </button>
                        <button 
                          onClick={() => { logout(); setIsProfileOpen(false); navigate("/"); }}
                          className="w-full text-left flex items-center px-3 py-2.5 text-sm text-error rounded-xl hover:bg-error/10 transition-colors mt-1"
                        >
                          <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Navigation (Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-lg border-t border-outline-variant/20 pb-safe">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors",
                  isActive ? "text-primary" : "text-on-surface-variant"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-headline font-medium uppercase tracking-widest">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
