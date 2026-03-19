import API from "../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  BarChart3,
  LogOut,
  PlusCircle,
  FileText,
  DollarSign,
  Calendar,
  FolderOpen,
  ArrowRight,
  ArrowLeft,
  Rocket,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function AddTransactionPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    description: "",
    amount: "",
    type: "expense",
    category_id: "",
    transaction_date: new Date().toISOString().split("T")[0],
  });

  // Calculate quick summary for visual side
  const summaryIncome = 0; 
  const summaryExpense = 0;

  const [categories, setCategories] = useState([]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/transactions", {
        ...form,
        amount: Number(form.amount),
        category_id: Number(form.category_id),
      });
      navigate("/transactions");
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    API.get("/categories")
      .then((res) => {
        setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [navigate]);

  const filteredCategories = categories.filter((c) => c.type === form.type);


  const inputClass =
    "w-full px-4 py-3 bg-white border border-slate-200 border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all";
  const labelClass = "block text-sm font-medium text-slate-600 mb-2";
  const selectClass =
    "w-full px-4 py-3 bg-white border border-slate-200 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all   [&>option]:text-slate-800";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10 w-full">
        <div className="p-8 lg:p-10 min-h-full flex flex-col xl:flex-row gap-8">
          
          {/* Left Side: Form */}
          <div className="flex-1 max-w-2xl">
            {/* Header */}
            <div className="mb-8 animate-fade-in-up">
              <button 
                onClick={() => navigate("/transactions")}
                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-emerald-500 font-bold mb-6 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Transaksi
              </button>
              <h1 className="text-2xl lg:text-3xl font-black text-[var(--text-primary)] flex items-center gap-2">
                <PlusCircle className="w-7 h-7 text-emerald-600" />
                Catat Transaksi Baru
              </h1>
              <p className="text-[var(--text-secondary)] mt-1 font-medium">Lacak setiap pemasukan dan pengeluaran Anda dengan mudah.</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 lg:p-8 border border-[var(--border-color)] animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Deskripsi
                  </span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Contoh: Gaji Bulanan atau Kopi"
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:[var(--text-secondary)]/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-bold"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Jumlah (Rp)
                  </span>
                </label>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  placeholder="0"
                  min="1"
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-black text-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-widest">Tipe</label>
                  <select name="type" value={form.type} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-bold">
                    <option value="expense">Pengeluaran (Expense)</option>
                    <option value="income">Pemasukan (Income)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      Kategori
                    </span>
                  </label>
                  <select name="category_id" value={form.category_id} onChange={handleChange} className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-bold" required>
                    <option value="">Pilih kategori</option>
                    {filteredCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {filteredCategories.length === 0 && (
                    <p className="text-amber-500 font-bold text-[10px] mt-2 uppercase tracking-tight">
                      Buat kategori {form.type} dulu di{" "}
                      <button type="button" onClick={() => navigate("/categories")} className="underline hover:text-amber-400">
                        Categories
                      </button>
                    </p>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-widest">
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Tanggal
                  </span>
                </label>
                <input
                  type="date"
                  name="transaction_date"
                  value={form.transaction_date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-bold"
                  required
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting || (filteredCategories.length === 0)}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 dark:disabled:bg-slate-800 disabled:cursor-not-allowed text-white font-black text-lg shadow-lg shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  {submitting ? (
                    <span className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      SIMPAN TRANSAKSI
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Side: Visual & Summary Preview */}
          <div className="hidden xl:flex flex-col w-[400px] shrink-0 gap-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <DollarSign className="w-32 h-32" />
              </div>
              
              <div className="relative z-10">
                <p className="text-emerald-100 font-black tracking-widest text-[10px] uppercase mb-4">Transaction Recap</p>
                <h2 className="text-4xl font-black mb-10 leading-none">
                  <span className="text-2xl mr-1">{form.type === "income" ? "+" : "-"}</span>
                  Rp {form.amount ? Number(form.amount).toLocaleString() : "0"}
                </h2>

                <div className="space-y-1">
                  <div className="flex justify-between items-center py-4 border-b border-white/10">
                    <span className="text-emerald-100/70 text-xs font-bold uppercase">Kategori</span>
                    <span className="font-black text-sm">
                      {form.category_id 
                        ? categories.find((c) => c.id === Number(form.category_id))?.name || "Memilih..." 
                        : "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4 border-b border-white/10">
                    <span className="text-emerald-100/70 text-xs font-bold uppercase">Tanggal</span>
                    <span className="font-black text-sm">
                      {new Date(form.transaction_date).toLocaleDateString("id-ID", { 
                         day: "numeric", month: "long", year: "numeric" 
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-4">
                    <span className="text-emerald-100/70 text-xs font-bold uppercase">Deskripsi</span>
                    <span className="font-black text-sm truncate max-w-[180px]" title={form.description}>
                      {form.description || "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-color)] shadow-sm flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                <Rocket className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-black text-[var(--text-primary)] mb-1">Mencatat Itu Penting!</h4>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed font-medium">
                  Semakin rapi Anda mencatat pengeluaran, semakin mudah Anda mengejar target tabungan dan mengelola aset bulanan Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddTransactionPage;

