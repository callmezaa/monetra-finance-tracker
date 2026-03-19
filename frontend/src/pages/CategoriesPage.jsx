import API from "../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  BarChart3,
  LogOut,
  FolderOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function CategoriesPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", type: "expense" });
  const [editingId, setEditingId] = useState(null);
  const [categories, setCategories] = useState([]);

  const fetchCategories = () => {
    API.get("/categories")
      .then((res) => {
        setCategories(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchCategories();
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({ name: cat.name, type: cat.type });
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ name: "", type: "expense" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus kategori ini? Semua transaksi terkait mungkin akan terpengaruh.")) return;

    try {
      await API.delete(`/categories/${id}`);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menghapus kategori");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    try {
      if (editingId) {
        await API.put(`/categories/${editingId}`, { name: form.name.trim(), type: form.type });
        setEditingId(null);
      } else {
        await API.post("/categories", { name: form.name.trim(), type: form.type });
      }
      setForm({ name: "", type: "expense" });
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.error || "Gagal menyimpan kategori");
    }
  };

  const incomeCategories = categories.filter((c) => c.type === "income");
  const expenseCategories = categories.filter((c) => c.type === "expense");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Loading categories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10">
        <div className="p-8 lg:p-10 space-y-8">
          {/* Header */}
          <div className="animate-fade-in-up">
            <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
              <FolderOpen className="w-7 h-7 text-emerald-600" />
              Categories
            </h1>
            <p className="text-[var(--text-secondary)] mt-1">Kelola kategori pemasukan dan pengeluaran Anda</p>
          </div>

          {/* Add/Edit category form */}
          <div className={`bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border transition-all animate-fade-in-up ${editingId ? 'border-amber-400 ring-2 ring-amber-100 dark:ring-amber-500/20' : 'border-[var(--border-color)]'}`}>
            <h3 className="font-semibold text-[var(--text-primary)] mb-4">
              {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Nama kategori"
                className="flex-1 min-w-0 px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] placeholder:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
                required
              />
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="px-4 py-3 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-medium"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold transition-all shadow-lg ${
                    editingId 
                    ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/25' 
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25'
                  }`}
                >
                  {editingId ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {editingId ? 'Simpan' : 'Tambah'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center justify-center px-4 py-3 rounded-xl bg-[var(--bg-main)] hover:bg-[var(--border-color)] text-[var(--text-secondary)] transition-all border border-[var(--border-color)]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Categories grid */}
          <div className="grid md:grid-cols-2 gap-6 pb-12">
            {/* Income categories */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden animate-fade-in-up hover:shadow-md transition-all">
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center gap-3 bg-emerald-50/50 dark:bg-emerald-500/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
                </div>
                <h3 className="font-semibold text-emerald-600 dark:text-emerald-500">Income Categories</h3>
              </div>
              <ul className="divide-y divide-[var(--border-color)]">
                {incomeCategories.length === 0 ? (
                  <li className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    <ArrowUpRight className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Belum ada kategori income</p>
                  </li>
                ) : (
                  incomeCategories.map((cat) => (
                    <li key={cat.id} className="group px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-main)] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 flex-shrink-0" />
                        <span className="text-[var(--text-primary)] font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(cat)}
                          className="p-2 text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>

            {/* Expense categories */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden animate-fade-in-up hover:shadow-md transition-all">
              <div className="px-6 py-4 border-b border-[var(--border-color)] flex items-center gap-3 bg-red-50/50 dark:bg-red-500/5">
                <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-500/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="font-semibold text-red-600 dark:text-red-500">Expense Categories</h3>
              </div>
              <ul className="divide-y divide-[var(--border-color)]">
                {expenseCategories.length === 0 ? (
                  <li className="px-6 py-12 text-center text-[var(--text-secondary)]">
                    <ArrowDownRight className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p>Belum ada kategori expense</p>
                  </li>
                ) : (
                  expenseCategories.map((cat) => (
                    <li key={cat.id} className="group px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-main)] transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-400 flex-shrink-0" />
                        <span className="text-[var(--text-primary)] font-medium">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEdit(cat)}
                          className="p-2 text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-lg transition-all"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default CategoriesPage;

