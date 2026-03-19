import API from "../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function RecurringPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [recurringTransactions, setRecurringTransactions] = useState([]);

  const fetchData = async () => {
    try {
      const recRes = await API.get("/recurring");
      setRecurringTransactions(Array.isArray(recRes.data) ? recRes.data : []);
    } catch (err) {
      console.error("Failed to fetch data", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus transaksi berulang ini?")) return;
    try {
      await API.delete(`/recurring/${id}`);
      fetchData();
    } catch (err) {
      alert("Gagal menghapus");
    }
  };

  const handleToggle = async (id) => {
    try {
      await API.post(`/recurring/${id}/toggle`);
      fetchData();
    } catch (err) {
      alert("Gagal mengubah status");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Memuat transaksi berulang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10 text-[var(--text-primary)]">
        <div className="p-8 lg:p-10 space-y-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-in-up">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <Calendar className="w-8 h-8 text-emerald-600" />
                Recurring Transactions
              </h1>
              <p className="text-[var(--text-secondary)]">Kelola tagihan dan transaksi rutin Anda secara otomatis</p>
            </div>
            <button
              onClick={() => navigate("/add-recurring")}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <Plus className="w-5 h-5" />
              Add Recurring
            </button>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recurringTransactions.length === 0 ? (
              <div className="col-span-full py-20 bg-[var(--bg-card)] rounded-3xl border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-main)] flex items-center justify-center">
                  <Clock className="w-10 h-10 text-[var(--text-secondary)]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">No Recurring Transactions</h3>
                  <p className="text-[var(--text-secondary)] max-w-xs mx-auto mt-2">Mulai tambahkan tagihan bulanan atau langganan Anda di sini.</p>
                </div>
                <button
                  onClick={() => navigate("/add-recurring")}
                  className="text-emerald-600 dark:text-emerald-500 font-bold hover:underline flex items-center gap-1"
                >
                  Create your first one <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              recurringTransactions.map((item, idx) => (
                <div key={item.id} className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-color)] shadow-sm hover:shadow-md transition-all animate-fade-in-up group" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${item.type === 'income' ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500'}`}>
                      {item.type === 'income' ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => handleToggle(item.id)} className={`p-2 rounded-xl transition-all ${item.is_active ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-[var(--bg-main)] text-[var(--text-secondary)]'}`} title={item.is_active ? "Nonaktifkan" : "Aktifkan"}>
                        {item.is_active ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 rounded-xl bg-[var(--bg-main)] text-[var(--text-secondary)] hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-black text-[var(--text-primary)] text-lg truncate" title={item.description}>{item.description}</h3>
                      <p className="text-[var(--text-secondary)] text-xs font-bold uppercase tracking-wider">{item.category_name}</p>
                    </div>
                    
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest mb-1">Amount</p>
                        <p className={`text-xl font-black ${item.type === 'income' ? 'text-emerald-600 dark:text-emerald-500' : 'text-[var(--text-primary)]'}`}>
                          {item.type === 'income' ? '+' : '-'} Rp {Number(item.amount).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest mb-1">Next Date</p>
                        <p className="text-[var(--text-primary)] font-bold">{new Date(item.next_occurrence).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></span>
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-tighter">{item.is_active ? 'Active' : 'Paused'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-main)] border border-[var(--border-color)]">
                        <AlertCircle className={`w-3.5 h-3.5 ${item.auto_add ? 'text-blue-500' : 'text-amber-500'}`} />
                        <span className="text-[9px] font-black text-[var(--text-secondary)] uppercase">{item.auto_add ? 'Auto-Add' : 'Reminder'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default RecurringPage;

