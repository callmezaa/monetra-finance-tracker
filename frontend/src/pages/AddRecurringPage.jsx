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
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  ArrowRight,
  Calendar,
  FileText,
  FolderOpen,
  Rocket,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function AddRecurringPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);

  const [form, setForm] = useState({
    description: "",
    amount: "",
    category_id: "",
    type: "expense",
    frequency: "monthly",
    day_of_month: 1,
    auto_add: true,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleToggleAutoAdd = () => {
    setForm({ ...form, auto_add: !form.auto_add });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/recurring", {
        ...form,
        amount: Number(form.amount),
        category_id: Number(form.category_id),
        day_of_month: Number(form.day_of_month),
      });
      navigate("/recurring");
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan transaksi berulang");
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
    "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium";
  const labelClass = "block text-sm font-bold text-slate-600 mb-2 uppercase tracking-wider";
  const selectClass =
    "w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl text-slate-800 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold select-custom";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Mempersiapkan halaman...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10 w-full">
        <div className="p-8 lg:p-10 min-h-full flex flex-col xl:flex-row gap-8 max-w-7xl mx-auto">
          
          <div className="flex-1 max-w-2xl animate-fade-in-up">
            <div className="mb-8">
              <button 
                onClick={() => navigate("/recurring")}
                className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-emerald-500 font-black mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                Back to Recurring List
              </button>
              <h1 className="text-3xl font-black text-[var(--text-primary)] flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <PlusCircle className="w-7 h-7 text-emerald-600" />
                </div>
                Create Recurring
              </h1>
              <p className="text-[var(--text-secondary)] mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Atur otomatisasi transaksi rutin lo.</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-[var(--bg-card)] rounded-[32px] shadow-sm p-8 border border-[var(--border-color)]">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button 
                  type="button" 
                  onClick={() => setForm({...form, type: 'expense'})} 
                  className={`py-5 rounded-2xl font-black transition-all flex flex-col items-center gap-2 border-2 ${form.type === 'expense' ? 'bg-red-500/10 text-red-600 border-red-500 shadow-lg shadow-red-500/10' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-card)]'}`}
                >
                  <TrendingDown className="w-7 h-7" /> 
                  <span className="text-xs tracking-widest">EXPENSE</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setForm({...form, type: 'income'})} 
                  className={`py-5 rounded-2xl font-black transition-all flex flex-col items-center gap-2 border-2 ${form.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-[var(--bg-main)] text-[var(--text-secondary)] border-transparent hover:bg-[var(--bg-card)]'}`}
                >
                  <TrendingUp className="w-7 h-7" /> 
                  <span className="text-xs tracking-widest">INCOME</span>
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-[0.2em]">Description</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/50">
                      <FileText className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      name="description"
                      value={form.description}
                      onChange={handleChange}
                      placeholder="e.g. Netflix, Internet"
                      className="w-full px-5 py-4 pl-14 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] placeholder:[var(--text-secondary)]/30 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-[0.2em]">Amount (Rp)</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/50 font-black">Rp</div>
                      <input
                        type="number"
                        name="amount"
                        value={form.amount}
                        onChange={handleChange}
                        placeholder="0"
                        className="w-full px-5 py-4 pl-14 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black text-lg"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-[0.2em]">Repeat Date</label>
                    <div className="relative">
                      <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/50">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <input
                        type="number"
                        name="day_of_month"
                        min="1"
                        max="31"
                        value={form.day_of_month}
                        onChange={handleChange}
                        className="w-full px-5 py-4 pl-14 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-[var(--text-secondary)] mb-2 uppercase tracking-[0.2em]">Category</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]/50">
                      <FolderOpen className="w-5 h-5" />
                    </div>
                    <select 
                      name="category_id" 
                      value={form.category_id} 
                      onChange={handleChange} 
                      className="w-full px-5 py-4 pl-14 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-black select-custom" 
                      required
                    >
                      <option value="">Pilih kategori</option>
                      {filteredCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {filteredCategories.length === 0 && (
                    <p className="text-amber-500 font-black text-[9px] mt-3 flex items-center gap-2 uppercase tracking-tight">
                      <AlertCircle className="w-4 h-4" />
                      Belum ada kategori {form.type}. 
                      <button type="button" onClick={() => navigate("/categories")} className="underline ml-1 hover:text-amber-400">Bikin dulu yuk!</button>
                    </p>
                  )}
                </div>

                <div className="p-6 bg-[var(--bg-main)] rounded-[24px] border border-[var(--border-color)] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[var(--bg-card)] rounded-2xl flex items-center justify-center shadow-sm border border-[var(--border-color)]">
                      <Rocket className={`w-6 h-6 ${form.auto_add ? 'text-blue-500 animate-pulse' : 'text-[var(--text-secondary)]/30'}`} />
                    </div>
                    <div>
                      <p className="font-black text-[var(--text-primary)] text-sm">Auto-add Transaction</p>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-tight">Record on due date.</p>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={handleToggleAutoAdd}
                    className={`relative w-14 h-7 rounded-full transition-all duration-300 ${form.auto_add ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all duration-300 ${form.auto_add ? 'right-1' : 'left-1'}`}></div>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={submitting || filteredCategories.length === 0}
                  className="w-full flex items-center justify-center gap-3 py-5 rounded-[24px] bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-black text-lg shadow-xl shadow-emerald-600/20 transition-all transform hover:-translate-y-1 active:translate-y-0"
                >
                  {submitting ? (
                    <div className="w-7 h-7 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      SAVE RECURRING
                      <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="hidden xl:flex flex-col w-80 shrink-0 gap-6 pt-24 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"></div>
              
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mb-8">Live Preview</p>
              
              <div className="space-y-8">
                <div>
                  <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-2">Total Recurring</p>
                  <p className="text-2xl font-black truncate leading-none">
                    Rp {form.amount ? Number(form.amount).toLocaleString() : "0"}
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-emerald-400 border border-white/5">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Repeats</p>
                      <p className="font-black text-xs">Setiap Tanggal {form.day_of_month}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-blue-400 border border-white/5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Mode</p>
                      <p className="font-black text-xs">{form.auto_add ? 'Otomatis' : 'Manual'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="pt-8 border-t border-white/5">
                  <p className="text-[10px] text-slate-500 leading-relaxed font-black italic uppercase tracking-tighter opacity-60">
                    "Sistem yang pusing mikirin tagihan, lo tinggal santuy."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AddRecurringPage;

