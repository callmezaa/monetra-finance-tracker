import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  Plus,
  Rocket,
  ArrowRight,
  TrendingUp,
  Trash2,
  Calendar,
  Target,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function GoalsPage() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isNewGoalModalOpen, setIsNewGoalModalOpen] = useState(false);
  const [isAddSavingModalOpen, setIsAddSavingModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);

  // Forms
  const [newGoal, setNewGoal] = useState({ name: "", target_amount: "", deadline: "" });
  const [savingAmount, setSavingAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchGoals = async () => {
    try {
      const res = await API.get("/goals");
      setGoals(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error("Failed to fetch goals", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchGoals().finally(() => setLoading(false));
  }, [navigate]);

  const calculateProgress = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm("Hapus goal ini?")) return;
    try {
      await API.delete(`/goals/${id}`);
      fetchGoals();
    } catch (err) {
      alert("Gagal menghapus goal");
    }
  };

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post("/goals", {
        name: newGoal.name,
        target_amount: Number(newGoal.target_amount),
        deadline: newGoal.deadline,
      });
      fetchGoals();
      setIsNewGoalModalOpen(false);
      setNewGoal({ name: "", target_amount: "", deadline: "" });
    } catch (err) {
      alert("Gagal membuat goal");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddSaving = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await API.post(`/goals/${activeGoal.id}/saving`, {
        amount: Number(savingAmount),
      });
      fetchGoals();
      setIsAddSavingModalOpen(false);
      setSavingAmount("");
      setActiveGoal(null);
    } catch (err) {
      alert("Gagal menambah tabungan");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Memuat goals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 w-full">
        <div className="p-8 lg:p-10 space-y-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Rocket className="w-7 h-7 text-emerald-600" />
                Saving Goals
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">Kejar impian Anda dengan target tabungan bertahap</p>
            </div>
            <button
              onClick={() => setIsNewGoalModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              New Goal
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {goals.map((goal) => {
              const pct = calculateProgress(goal.current_amount, goal.target_amount);
              const isCompleted = pct >= 100;

              return (
                <div key={goal.id} className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between min-h-[220px]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-xl font-bold text-[var(--text-primary)] truncate pr-4">{goal.name}</h3>
                      <button onClick={() => handleDeleteGoal(goal.id)} className="text-[var(--text-secondary)] hover:text-red-500 transition-colors tooltip flex-shrink-0" title="Delete Goal">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                    
                    <p className="text-emerald-600 dark:text-emerald-500 font-bold flex items-end gap-1 mb-6">
                      <span className="text-2xl">Rp {Number(goal.current_amount).toLocaleString()}</span>
                      <span className="text-sm text-[var(--text-secondary)] font-medium mb-1">/ Rp {Number(goal.target_amount).toLocaleString()}</span>
                    </p>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Progress</span>
                        <span className="text-xs font-black text-emerald-600 dark:text-emerald-500">{pct.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[var(--bg-main)] rounded-full h-2.5 overflow-hidden border border-[var(--border-color)]">
                        <div 
                          className={`h-2.5 rounded-full transition-all duration-1000 ease-out ${isCompleted ? 'bg-gradient-to-r from-emerald-400 to-teal-400' : 'bg-emerald-500'}`} 
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-[var(--border-color)] pt-4">
                    <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1">
                       <Calendar className="w-3 h-3" />
                      {goal.deadline ? `${new Date(goal.deadline).toLocaleDateString()}` : "No deadline"}
                    </span>
                    <button
                      disabled={isCompleted}
                      onClick={() => {
                        setActiveGoal(goal);
                        setIsAddSavingModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-500 text-xs font-black hover:bg-emerald-500 hover:text-white transition-all uppercase tracking-tighter"
                    >
                      {isCompleted ? "Goal Reached! 🎉" : "Add Funds"}
                    </button>
                  </div>
                </div>
              );
            })}
            
            {goals.length === 0 && (
               <div className="col-span-full py-20 text-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] border-dashed">
                 <div className="w-16 h-16 bg-[var(--bg-main)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <Target className="w-8 h-8 text-emerald-500/40" />
                 </div>
                 <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Belum ada target tabungan</h3>
                 <p className="text-[var(--text-secondary)]">Mulai kejar mimpimu dengan membuat goal pertamamu sekarang.</p>
               </div>
            )}
          </div>
        </div>
      </main>

      {/* MODAL: NEW GOAL */}
      {isNewGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in-up border border-[var(--border-color)]">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Rocket className="w-5 h-5 text-emerald-500" />
                Buat Goal Baru
              </h3>
            </div>
            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Nama Goal (cth: Liburan Jepang)</label>
                <input
                  type="text" required placeholder="Beli Laptop Impian"
                  value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Target Dana (Rp)</label>
                <input
                  type="number" required min="1" placeholder="10000000"
                  value={newGoal.target_amount} onChange={(e) => setNewGoal({ ...newGoal, target_amount: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] font-black focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2">Target Selesai (Opsional)</label>
                <input
                  type="date"
                  value={newGoal.deadline} onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-sm transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => setIsNewGoalModalOpen(false)}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)] font-bold transition-all"
                >Batal</button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-500/25 transition-all flex justify-center items-center gap-2"
                >
                  {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Simpan Goal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SAVING */}
      {isAddSavingModalOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-fade-in-up border border-[var(--border-color)]">
            <div className="px-6 py-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[var(--bg-main)]/50">
              <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Tambah Tabungan
              </h3>
            </div>
            <form onSubmit={handleAddSaving} className="p-6 space-y-4">
              <div className="bg-emerald-500/10 rounded-xl p-4 mb-4 border border-emerald-500/20">
                <p className="text-[10px] text-emerald-600 dark:text-emerald-500 font-black mb-1 uppercase tracking-widest">Goal Aktif</p>
                <p className="text-[var(--text-primary)] font-black text-lg">{activeGoal.name}</p>
                <div className="flex items-center justify-between mt-2">
                     <span className="text-xs text-[var(--text-secondary)] font-bold">Kekurangan:</span>
                     <span className="text-sm text-red-500 font-black">Rp {Number(activeGoal.target_amount - activeGoal.current_amount).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-secondary)] mb-2 uppercase tracking-tight">Nominal Disisihkan (Rp)</label>
                <input
                  type="number" required min="1" placeholder="500000"
                  value={savingAmount} onChange={(e) => setSavingAmount(e.target.value)}
                  className="w-full px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 text-xl font-black transition-all"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button" onClick={() => { setIsAddSavingModalOpen(false); setActiveGoal(null); setSavingAmount(""); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-main)] font-bold transition-all"
                >Batal</button>
                <button
                  type="submit" disabled={submitting}
                  className="flex-1 flex justify-center items-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition-all font-black shadow-lg shadow-emerald-500/25"
                >
                  {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Tambah <ArrowRight className="w-4 h-4" /></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GoalsPage;

