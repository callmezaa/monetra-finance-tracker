import API from "../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Receipt,
  FolderTree,
  BarChart3,
  LogOut,
  ChevronLeft,
  PanelLeftClose,
  Plus,
  ReceiptText,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  ArrowUpDown,
  Filter,
} from "lucide-react";
import Sidebar from "../components/Sidebar";

function TransactionsPage() {
  const navigate = useNavigate();


  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Sort State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [sortBy, setSortBy] = useState("date_desc"); // "date_desc", "date_asc", "amount_desc", "amount_asc"

  // Derive unique categories for the dropdown from the transactions
  const uniqueCategories = Array.from(new Set(transactions.map(t => t.category || t.category_id).filter(Boolean)));

  const fetchTransactions = () => {
    API.get("/transactions")
      .then((res) => {
        setTransactions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchTransactions();
  }, [navigate]);

  const deleteTransaction = (id) => {
    if (!confirm("Hapus transaksi ini?")) return;
    API.delete(`/transactions/${id}`)
      .then(() => fetchTransactions())
      .catch(() => alert("Gagal menghapus transaksi"));
  };

  const filteredAndSortedTransactions = transactions
    .filter((t) => {
      // Name Match
      const matchesSearch = (t.description || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      // Type Match
      const matchesType = filterType === "all" || t.type === filterType;
      
      // Category Match
      const cat = t.category || t.category_id || "";
      const matchesCategory = filterCategory === "all" || cat === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "amount_desc") return Number(b.amount) - Number(a.amount);
      if (sortBy === "amount_asc") return Number(a.amount) - Number(b.amount);
      
      const dateA = new Date(a.transaction_date || a.created_at).getTime();
      const dateB = new Date(b.transaction_date || b.created_at).getTime();

      if (sortBy === "date_asc") return dateA - dateB;
      // Default: date_desc
      return dateB - dateA;
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-200/20 dark:bg-emerald-500/10 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-slate-200/20 dark:bg-slate-500/10 rounded-full blur-3xl animate-float-delayed" />
        <div className="absolute bottom-20 right-1/4 w-64 h-64 bg-teal-200/20 dark:bg-teal-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10 px-8 lg:px-10 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ReceiptText className="w-7 h-7 text-emerald-600" />
                Transactions
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">Riwayat pemasukan dan pengeluaran Anda</p>
            </div>
            <button
              onClick={() => navigate("/add-transaction")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-500/25 transition-all"
            >
              <Plus className="w-5 h-5" />
              Add Transaction
            </button>
          </div>

          {/* Filters & Sorting Bar */}
          <div className="bg-[var(--bg-card)] p-4 rounded-2xl shadow-sm border border-[var(--border-color)] flex flex-col lg:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-[var(--text-secondary)] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari deskripsi transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm placeholder:text-[var(--text-secondary)] placeholder:opacity-50"
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                <Filter className="w-4 h-4 text-[var(--text-secondary)]" />
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                <FolderTree className="w-4 h-4 text-[var(--text-secondary)]" />
                <select 
                  value={filterCategory} 
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer max-w-[120px] sm:max-w-none"
                >
                  <option value="all">Semua Kategori</option>
                  {uniqueCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 px-3 py-2.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-xl">
                <ArrowUpDown className="w-4 h-4 text-[var(--text-secondary)]" />
                <select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-sm font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="date_desc">Terbaru</option>
                  <option value="date_asc">Terlama</option>
                  <option value="amount_desc">Nominal Tertinggi</option>
                  <option value="amount_asc">Nominal Terendah</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions table */}
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm border border-[var(--border-color)] overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--border-color)]">
                    <th className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Description</th>
                    <th className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider hidden sm:table-cell">Category</th>
                    <th className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider hidden md:table-cell">Type</th>
                    <th className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider text-right">Amount</th>
                    <th className="px-6 py-4 text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedTransactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="px-6 py-16 text-center text-[var(--text-secondary)]">
                        <ReceiptText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                        <p>Belum ada transaksi</p>
                        <button
                          onClick={() => navigate("/add-transaction")}
                          className="mt-4 text-emerald-600 dark:text-emerald-500 hover:underline font-medium"
                        >
                          Tambah transaksi pertama
                        </button>
                      </td>
                    </tr>
                  )}
                  {filteredAndSortedTransactions.map((t) => (
                    <tr key={t.id} className="border-b border-[var(--border-color)] opacity-80 hover:bg-[var(--bg-main)] transition-colors group">
                      <td className="px-6 py-4 text-[var(--text-secondary)] whitespace-nowrap">
                        {t.transaction_date
                          ? new Date(t.transaction_date).toLocaleDateString()
                          : t.created_at
                            ? new Date(t.created_at).toLocaleDateString()
                            : "-"}
                      </td>
                      <td className="px-6 py-4 text-[var(--text-primary)] font-medium">{t.description || "-"}</td>
                      <td className="px-6 py-4 text-[var(--text-secondary)] hidden sm:table-cell">{t.category || t.category_id || "-"}</td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium ${
                          t.type === "income"
                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500"
                            : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-500"
                        }`}>
                          {t.type === "income" ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                          {t.type}
                        </span>
                      </td>
                      <td className={`px-6 py-4 text-right font-semibold ${t.type === "income" ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}>
                        {t.type === "income" ? "+" : "-"} Rp {Number(t.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => deleteTransaction(t.id)}
                          className="inline-flex p-2 rounded-lg text-[var(--text-secondary)] hover:bg-red-100 dark:hover:bg-red-500/10 hover:text-red-600 transition-all"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default TransactionsPage;

