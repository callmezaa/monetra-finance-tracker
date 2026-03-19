import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Target,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function BudgetsPage() {
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBudget, setNewBudget] = useState({ category_id: "", limit: "" });
  const [submitting, setSubmitting] = useState(false);

  const fetchBudgets = async () => {
    try {
      const res = await API.get("/budgets");
      setBudgets(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch budgets", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch categories", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    Promise.all([fetchBudgets(), fetchCategories()]).finally(() => {
      setLoading(false);
    });
  }, [navigate]);

  const handleCreateBudget = async (e) => {
    e.preventDefault();
    if (!newBudget.category_id || !newBudget.limit) return;
    
    setSubmitting(true);
    try {
      await API.post("/budgets", {
        category_id: Number(newBudget.category_id),
        amount: Number(newBudget.limit),
      });
      await fetchBudgets();
      setIsModalOpen(false);
      setNewBudget({ category_id: "", limit: "" });
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan anggaran");
    } finally {
      setSubmitting(false);
    }
  };

  const renderProgressBar = (spent, limit) => {
    const percentage = Math.min((spent / limit) * 100, 100);
    
    let colorClass = "bg-emerald-500";
    let statusText = "Safe";
    let statusIcon = <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
    
    if (percentage > 100 || spent > limit) {
      colorClass = "bg-red-500";
      statusText = "Exceeded";
      statusIcon = <AlertTriangle className="w-4 h-4 text-red-600" />;
    } else if (percentage >= 85) {
      colorClass = "bg-amber-500";
      statusText = "Near Limit";
      statusIcon = <AlertTriangle className="w-4 h-4 text-amber-600" />;
    }

    return (
      <div className="mt-4">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm font-bold flex items-center gap-1.5 ${
            percentage > 100 || spent > limit ? "text-red-500" : percentage >= 85 ? "text-amber-500" : "text-emerald-500"
          }`}>
            {statusIcon}
            {statusText} ({percentage.toFixed(0)}%)
          </span>
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Rp {Number(spent).toLocaleString()} / <span className="text-[var(--text-primary)] font-bold">Rp {Number(limit).toLocaleString()}</span>
          </span>
        </div>
        <div className="w-full bg-[var(--bg-main)] rounded-full h-2.5 overflow-hidden border border-[var(--border-color)]">
          <div 
            className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${colorClass}`} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const expenseCategories = categories.filter(c => c.type === "expense");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Loading budgets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10 w-full">
        <div className="p-8 lg:p-10 space-y-8">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target className="w-7 h-7 text-emerald-600" />
                Budgets
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">Atur dan pantau anggaran bulanan Anda</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Create Budget
            </button>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {budgets.map((budget) => (
              <div key={budget.id} className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:shadow-md transition-all group relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)]">{budget.category_name}</h3>
                      <p className="text-xs text-[var(--text-secondary)] font-medium">Monthly Budget</p>
                    </div>
                  </div>
                </div>
                
                {renderProgressBar(budget.spent, budget.amount)}
              </div>
            ))}
            
            {budgets.length === 0 && (
               <div className="col-span-full py-16 text-center bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl border-dashed">
                 <Target className="w-12 h-12 mx-auto mb-4 text-emerald-500/30" />
                 <h3 className="text-lg font-medium text-[var(--text-primary)] mb-2">Belum ada anggaran bulanan</h3>
                 <p className="text-[var(--text-secondary)]">Buat budget untuk membantu mengontrol pengeluaran Anda.</p>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal / Dialog for adding Budget */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-600" />
                Tambah Anggaran
              </h3>
            </div>
            <form onSubmit={handleCreateBudget} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Kategori Pengeluaran</label>
                <select
                  required
                  value={newBudget.category_id}
                  onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-medium"
                >
                  <option value="">Pilih Kategori</option>
                  {expenseCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                  {expenseCategories.length === 0 && (
                    <option value="" disabled>Belum ada kategori pengeluaran</option>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Batas Anggaran (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="2000000"
                  value={newBudget.limit}
                  onChange={(e) => setNewBudget({ ...newBudget, limit: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)] hover:text-[var(--text-primary)] transition-all font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white transition-all font-bold shadow-lg shadow-emerald-500/25"
                >
                  {submitting ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Simpan"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetsPage;

