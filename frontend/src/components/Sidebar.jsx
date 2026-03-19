import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  BarChart3,
  LogOut,
  Target,
  Rocket,
  Settings,
  Calendar,
  PanelLeftClose,
  ChevronLeft,
  Sun,
  Moon,
  User as UserIcon
} from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import API from "../api/axios";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/user/profile");
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch sidebar profile", err);
      }
    };
    fetchProfile();
  }, []);

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: Receipt, label: "Transactions", path: "/transactions" },
    { icon: FolderTree, label: "Categories", path: "/categories" },
    { icon: BarChart3, label: "Reports", path: "/reports" },
    { icon: Target, label: "Budgets", path: "/budgets" },
    { icon: Rocket, label: "Goals", path: "/goals" },
    { icon: Calendar, label: "Recurring", path: "/recurring" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <aside className={`relative z-20 flex flex-col justify-between bg-[var(--bg-card)] border-r border-[var(--border-color)] shadow-sm sidebar-transition ${sidebarOpen ? "w-64" : "w-20"}`}>
      <div>
        <div className={`flex items-center gap-3 px-4 h-16 border-b border-[var(--border-color)] ${sidebarOpen ? "justify-between" : "justify-center"}`}>
          {sidebarOpen ? (
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center">
                <img src="/logo.png" alt="Monetra Logo" className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-[var(--text-primary)] truncate tracking-tight text-lg">Monetra</span>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center mb-1">
               <img src="/logo.png" alt="M" className="w-full h-full object-cover" />
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="flex-shrink-0 p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-all ml-auto">
            {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 rotate-180" />}
          </button>
        </div>
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => !isActive && navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 font-bold" : "text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-emerald-600"}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-emerald-600" : ""}`} />
                {sidebarOpen && <span className="font-medium truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>
      
      <div className="p-3 border-t border-[var(--border-color)] space-y-1">
        {/* User Profile info */}
        <div 
          onClick={() => navigate("/settings")}
          className={`flex items-center gap-3 p-2 rounded-xl hover:bg-[var(--bg-main)] cursor-pointer transition-all mb-2 ${!sidebarOpen ? "justify-center" : ""}`}
        >
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-emerald-100 flex items-center justify-center border-2 border-emerald-500/20 shadow-sm group-hover:border-emerald-500 transition-all">
              {user?.profile_picture ? (
                <img 
                  src={`http://localhost:8080${user.profile_picture}`} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "https://ui-avatars.com/api/?name=" + (user.name || "User") + "&background=10b981&color=fff";
                  }}
                />
              ) : (
                <span className="text-emerald-700 font-bold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </span>
              )}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--bg-card)] rounded-full shadow-sm" />
          </div>
          
          {sidebarOpen && (
            <div className="flex flex-col min-w-0 animate-fade-in">
              <span className="text-xs font-black text-[var(--text-primary)] truncate tracking-tight">{user?.name || "User"}</span>
              <span className="text-[9px] text-[var(--text-secondary)] font-medium truncate opacity-70 italic">Premium Member</span>
            </div>
          )}
        </div>

        <button 
          onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-main)] transition-all"
        >
          {theme === 'light' ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
          {sidebarOpen && <span className="font-medium">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
        
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-[var(--text-secondary)] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 transition-all">
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {sidebarOpen && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
