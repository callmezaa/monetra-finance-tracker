import API from "../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  BarChart3,
  LogOut,
  TrendingUp,
  TrendingDown,
  ChevronLeft,
  PanelLeftClose,
  Plus,
  Sparkles,
  Search,
  Bell,
  Lightbulb,
  Calendar,
  Rocket, // Added Rocket
  ArrowUpRight, // Added ArrowUpRight
  AlertCircle, // Added AlertCircle
  Target, // Added Target
} from "lucide-react";
import Sidebar from "../components/Sidebar";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"];

function DashboardPage() {
  const navigate = useNavigate();


  const [summary, setSummary] = useState({
    total_income: 0,
    total_expense: 0,
    balance: 0,
  });

  const [transactions, setTransactions] = useState([]);
  const [userProfile, setUserProfile] = useState({ name: "User" });
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const [insights, setInsights] = useState(null);

  const fetchNotifications = () => {
    API.get("/notifications")
      .then(res => setNotifications(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error("Error fetching notifs:", err));
  };

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error("Error marking as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      fetchNotifications();
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const currentYear = new Date().getFullYear();

    Promise.all([
      API.get("/dashboard"),
      API.get("/transactions"),
      API.get("/user/profile"),
      API.get(`/reports/monthly?year=${currentYear}`),
      API.get(`/reports/by-category?year=${currentYear}&type=expense`),
      API.get("/notifications"),
      API.get("/insights")
    ])
      .then(([dashboardRes, transactionsRes, profileRes, monthlyRes, categoryRes, notifRes, insightsRes]) => {
        setSummary(dashboardRes.data);
        setTransactions(Array.isArray(transactionsRes.data) ? transactionsRes.data : []);
        setNotifications(Array.isArray(notifRes.data) ? notifRes.data : []);
        setInsights(insightsRes.data || null);
        
        if (profileRes.data && profileRes.data.name) {
          setUserProfile(profileRes.data);
        }

        if (monthlyRes.data && Array.isArray(monthlyRes.data.months)) {
          const currentMonthInfo = new Date().getMonth() + 1;
          const filteredMonths = monthlyRes.data.months.filter(
            (m) => m.month <= currentMonthInfo || m.income > 0 || m.expense > 0
          );
          setMonthlyData(filteredMonths);
        }

        if (categoryRes.data && Array.isArray(categoryRes.data.categories)) {
          setCategoryData(categoryRes.data.categories.slice(0, 5));
        }
      })
      .catch((err) => {
        console.error("Dashboard data fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
        API.post("/recurring/process").catch(() => {});
      });
  }, [navigate]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10">
        <header className="sticky top-0 z-30 bg-[var(--bg-header)] backdrop-blur-xl border-b border-[var(--border-color)] px-8 lg:px-10 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="animate-fade-in-up">
            <p className="text-[var(--text-secondary)] text-sm font-medium">{getGreeting()},</p>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              {userProfile.name} <span className="text-xl">👋</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 bg-[var(--bg-main)] border border-[var(--border-color)] focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 rounded-xl text-sm focus:outline-none transition-all placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
              />
            </div>
            <div className="relative">
              <button 
                onClick={() => setShowNotifDropdown(!showNotifDropdown)}
                className={`p-2.5 rounded-xl border transition-all ${showNotifDropdown ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 text-emerald-600' : 'bg-[var(--bg-card)] border-[var(--border-color)] hover:bg-[var(--bg-main)] text-[var(--text-secondary)]'}`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && <span className="absolute top-2 right-2.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>}
              </button>
              {showNotifDropdown && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[var(--bg-card)] rounded-3xl shadow-xl border border-[var(--border-color)] overflow-hidden animate-fade-in-up z-50">
                  <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-main)]/50">
                    <h3 className="font-bold text-[var(--text-primary)]">Notifications</h3>
                    <button onClick={markAllAsRead} className="text-xs font-bold text-emerald-600 hover:underline">Mark all read</button>
                  </div>
                  <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-10 text-center text-slate-400">
                        <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">No new notifications</p>
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} onClick={() => !n.is_read && markAsRead(n.id)} className={`p-4 border-b border-slate-50 flex gap-4 cursor-pointer transition-colors ${!n.is_read ? 'bg-emerald-50/50' : 'hover:bg-slate-50'}`}>
                          <div className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center ${n.type === 'budget_alert' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {n.type === 'budget_alert' ? <AlertCircle className="w-5 h-5" /> : <Rocket className="w-5 h-5" />}
                          </div>
                          <div className="flex-1 min-w-0">
                             <p className={`text-sm ${!n.is_read ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{n.message}</p>
                             <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-wider">{new Date(n.created_at).toLocaleString('id-ID')}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="relative group">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center font-bold text-emerald-600 border border-slate-200 shadow-sm group-hover:border-emerald-500 transition-all">
                {userProfile.profile_picture ? (
                  <img 
                    src={`http://localhost:8080${userProfile.profile_picture}`} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = "https://ui-avatars.com/api/?name=" + userProfile.name + "&background=10b981&color=fff";
                    }}
                  />
                ) : (
                  getInitials(userProfile.name)
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <LayoutDashboard className="w-16 h-16 text-[var(--text-primary)]" />
              </div>
              <p className="text-[var(--text-secondary)] text-[10px] font-bold uppercase tracking-wider mb-2">Total Balance</p>
              <p className="text-3xl font-black tracking-tight text-[var(--text-primary)]">Rp {Number(summary.balance).toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] bg-emerald-50 dark:bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
                <Sparkles className="w-3 h-3" /> Safe to spend
              </div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <p className="text-emerald-600 dark:text-emerald-500 text-[10px] font-bold uppercase tracking-wider mb-2">Monthly Income</p>
              <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">Rp {Number(summary.total_income).toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-1 text-[var(--text-secondary)] font-bold text-[10px] uppercase">
                <TrendingUp className="w-3 h-3 text-emerald-500 font-bold" /> Total received
              </div>
            </div>
            <div className="bg-[var(--bg-card)] rounded-2xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
              <p className="text-red-600 dark:text-red-500 text-[10px] font-bold uppercase tracking-wider mb-2">Monthly Expenses</p>
              <p className="text-3xl font-black tracking-tight text-red-600 dark:text-red-500">Rp {Number(summary.total_expense).toLocaleString()}</p>
              <div className="mt-4 flex items-center gap-1 text-[var(--text-secondary)] font-bold text-[10px] uppercase">
                <TrendingDown className="w-3 h-3 text-red-500" /> Total spent
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="lg:col-span-2 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-500" /> Cashflow Trend
              </h2>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="month_name" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `Rp${(v / 1000).toLocaleString()}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 h-full flex flex-col">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-500" /> Expense Breakdown
              </h2>
              <div className="flex-1 min-h-[180px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="total" nameKey="category_name" stroke="none">
                      {categoryData.map((e, i) => (<Cell key={i} fill={COLORS[i % COLORS.length]} />))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 space-y-2.5">
                {categoryData.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                      <span className="text-xs font-medium text-[var(--text-secondary)]">{c.category_name}</span>
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">Rp {Math.round(c.total / 1000)}k</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Financial Advice (Full Width) */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm p-6 lg:p-8 animate-fade-in-up transition-all group" style={{ animationDelay: "0.2s" }}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                    <Lightbulb className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-800">Smart Financial Advice</h2>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Powered by Analytics</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {insights?.advice && insights.advice.length > 0 ? (
                    insights.advice.map((adv, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-start gap-3 hover:bg-slate-100/80 transition-colors">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></div>
                        <p className="text-slate-600 text-[13px] leading-relaxed" dangerouslySetInnerHTML={{ __html: adv.replace(/\*\*(.*?)\*\*/g, '<b class="text-slate-800 font-bold">$1</b>') }}></p>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-400 text-sm italic">Analyzing your data...</p>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 lg:p-8 flex flex-col justify-center items-center text-center h-full">
                <p className="font-bold text-[10px] text-slate-400 uppercase tracking-widest mb-1">Spending Trend</p>
                <div className="flex items-baseline gap-1">
                  <p className={`text-4xl font-black ${(insights?.total_trend || 0) > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                    {(insights?.total_trend || 0) > 0 ? '+' : ''}{insights?.total_trend?.toFixed(1) || '0.0'}%
                  </p>
                </div>
                <div className={`mt-3 px-3 py-1 rounded-full font-bold text-[10px] border ${(insights?.total_trend || 0) > 10 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
                  {(insights?.total_trend || 0) > 10 ? 'ATTENTION NEEDED' : 'ON TRACK'}
                </div>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <div className="px-6 py-5 border-b border-[var(--border-color)] flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2 text-[var(--text-primary)]">
                <Receipt className="w-4 h-4 text-emerald-500" /> Recent Activity
              </h2>
              <button onClick={() => navigate("/transactions")} className="px-3 py-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors">
                View All
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50/50">
                  <tr>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Description</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider">Category</th>
                    <th className="px-6 py-4 text-[10px] font-bold uppercase text-slate-400 tracking-wider text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80">
                  {transactions
                    .filter(t => !searchTerm || (t.description || "").toLowerCase().includes(searchTerm.toLowerCase()) || (t.category || "").toLowerCase().includes(searchTerm.toLowerCase()))
                    .slice(0, 10)
                    .map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80 transition-all duration-200">
                        <td className="px-6 py-4 text-[13px] text-slate-500 font-medium">
                          {new Date(t.transaction_date).toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'})}
                        </td>
                        <td className="px-6 py-4 text-[13px] font-bold text-slate-800 flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${t.type === 'income' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {t.description || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 rounded-md bg-slate-100/80 text-slate-500 text-[10px] font-bold uppercase tracking-wider">{t.category || "-"}</span>
                        </td>
                        <td className={`px-6 py-4 text-sm text-right font-black tracking-tight ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                          {t.type === 'income' ? '+' : '-'} Rp {Number(t.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  {transactions.length === 0 && (
                    <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-400 text-sm">No recent transactions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;

