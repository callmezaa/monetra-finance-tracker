import API from "../api/axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieChartIcon,
  FileText,
  Table as TableIcon,
  BarChart3,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import html2canvas from "html2canvas";

const INCOME_COLOR = "#10b981";
const EXPENSE_COLOR = "#ef4444";
const PIE_COLORS = ["#10b981", "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6", "#8b5cf6", "#a855f7", "#d946ef", "#ec4899", "#f43f5e"];

function ReportsPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  const [monthlyData, setMonthlyData] = useState({ months: [], year: year });
  const [expenseByCategory, setExpenseByCategory] = useState({ categories: [], total: 0 });
  const [incomeByCategory, setIncomeByCategory] = useState({ categories: [], total: 0 });
  const [summary, setSummary] = useState(null);
  const [exporting, setExporting] = useState(false);

  const fetchReports = () => {
    setLoading(true);
    const params = { year };
    Promise.all([
      API.get("/reports/monthly", { params }),
      API.get("/reports/by-category", { params: { ...params, type: "expense" } }),
      API.get("/reports/by-category", { params: { ...params, type: "income" } }),
      API.get("/reports/summary", { params }),
    ])
      .then(([monthlyRes, expenseRes, incomeRes, summaryRes]) => {
        setMonthlyData(monthlyRes.data);
        setExpenseByCategory(expenseRes.data);
        setIncomeByCategory(incomeRes.data);
        setSummary(summaryRes.data);
      })
      .catch((err) => console.error("Reports fetch failed", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    fetchReports();
  }, [navigate, year]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      if (format === "csv") {
        exportToCSV();
      } else if (format === "pdf") {
        await exportToPDF();
      }
    } catch (error) {
      console.error("Export failed", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Period/Category", "Type", "Amount (IDR)", "Percentage"];
    const rows = [];

    // Monthly Summary
    rows.push(["MONTHLY SUMMARY", "", "", ""]);
    chartData.forEach((m) => {
      rows.push([m.month, "Income", m.income, ""]);
      rows.push(["", "Expense", m.expense, ""]);
      rows.push(["", "Balance", m.balance, ""]);
    });
    rows.push(["", "", "", ""]);

    // Category Expense
    rows.push(["EXPENSE BY CATEGORY", "", "", ""]);
    expensePieData.forEach((c) => {
      const percentage = expenseByCategory.total > 0 ? ((c.value / expenseByCategory.total) * 100).toFixed(1) + "%" : "0%";
      rows.push([c.name, "Expense", c.value, percentage]);
    });
    rows.push(["", "TOTAL EXPENSE", expenseByCategory.total, "100%"]);
    rows.push(["", "", "", ""]);

    // Category Income
    rows.push(["INCOME BY CATEGORY", "", "", ""]);
    incomePieData.forEach((c) => {
      const percentage = incomeByCategory.total > 0 ? ((c.value / incomeByCategory.total) * 100).toFixed(1) + "%" : "0%";
      rows.push([c.name, "Income", c.value, percentage]);
    });
    rows.push(["", "TOTAL INCOME", incomeByCategory.total, "100%"]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Monetra_Report_${year}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Helper to add charts
    const addChartToDoc = async (id, yPos, height = 60) => {
      const el = document.getElementById(id);
      if (el) {
        const canvas = await html2canvas(el, { 
          scale: 2, 
          backgroundColor: null,
          logging: false,
          useCORS: true
        });
        const imgData = canvas.toDataURL("image/png");
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pageWidth - 40;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        doc.addImage(imgData, "PNG", 20, yPos, imgWidth, Math.min(imgHeight, height));
        return yPos + Math.min(imgHeight, height) + 10;
      }
      return yPos;
    };

    // Header
    doc.setFillColor(16, 185, 129); // Emerald 600
    doc.rect(0, 0, pageWidth, 40, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("MONETRA FINANCIAL REPORT", 20, 25);
    doc.setFontSize(10);
    doc.text(`YEAR: ${year} | DATA AS OF ${new Date().toLocaleDateString()}`, 20, 32);

    // Summary Section
    doc.setTextColor(15, 23, 42); // Slate 900
    doc.setFontSize(14);
    doc.text("Executive Summary", 20, 55);
    
    autoTable(doc, {
      startY: 60,
      head: [["Metric", "Value"]],
      body: [
        ["Total Income", `Rp ${Number(summary.total_income).toLocaleString()}`],
        ["Total Expense", `Rp ${Number(summary.total_expense).toLocaleString()}`],
        ["Net Balance", `Rp ${Number(summary.balance).toLocaleString()}`],
        ["Monthly Avg Expense", `Rp ${Number(summary.avg_expense).toLocaleString()}`],
        ["Savings Rate", `${Math.round(Math.max(0, summary.total_income > 0 ? (summary.total_income - summary.total_expense) / summary.total_income * 100 : 0))}%`],
      ],
      theme: "striped",
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Chart: Trend
    doc.setFontSize(14);
    doc.text("Financial Trends", 20, doc.lastAutoTable.finalY + 15);
    const nextY = await addChartToDoc("trend-chart", doc.lastAutoTable.finalY + 20, 70);

    // Monthly Data Table
    doc.setFontSize(14);
    doc.text("Monthly Breakdown", 20, nextY + 5);
    
    autoTable(doc, {
      startY: nextY + 10,
      head: [["Month", "Income", "Expense", "Balance"]],
      body: chartData.map(m => [
        m.month, 
        `Rp ${m.income.toLocaleString()}`, 
        `Rp ${m.expense.toLocaleString()}`, 
        `Rp ${m.balance.toLocaleString()}`
      ]),
      headStyles: { fillColor: [20, 184, 166] }, // Teal 500
    });

    // Category Breakdown Page
    doc.addPage();
    doc.setFontSize(18);
    doc.setTextColor(16, 185, 129);
    doc.text("Category Insights", 20, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Expense Distribution", 20, 35);
    const pieY = await addChartToDoc("expense-pie", 40, 60);

    autoTable(doc, {
      startY: pieY,
      head: [["Category", "Total", "Percentage"]],
      body: expensePieData.map(c => [
        c.name, 
        `Rp ${c.value.toLocaleString()}`, 
        `${((c.value / (expenseByCategory.total || 1)) * 100).toFixed(1)}%`
      ]),
      headStyles: { fillColor: [239, 68, 68] }, // Red 500
    });

    const incomeYStart = doc.lastAutoTable.finalY + 20;
    if (incomeYStart > 220) doc.addPage();
    
    doc.setFontSize(12);
    doc.text("Income Distribution", 20, incomeYStart > 220 ? 20 : incomeYStart);
    const finalPieY = await addChartToDoc("income-pie", incomeYStart > 220 ? 25 : incomeYStart + 5, 60);

    autoTable(doc, {
      startY: finalPieY,
      head: [["Category", "Total", "Percentage"]],
      body: incomePieData.map(c => [
        c.name, 
        `Rp ${c.value.toLocaleString()}`, 
        `${((c.value / (incomeByCategory.total || 1)) * 100).toFixed(1)}%`
      ]),
      headStyles: { fillColor: [16, 185, 129] },
    });

    doc.save(`Monetra_Analysis_${year}.pdf`);
  };

  const chartData = monthlyData.months?.map((m) => ({
    month: m.month_name,
    income: Number(m.income || 0),
    expense: Number(m.expense || 0),
    balance: Number(m.balance || 0),
  })) || [];

  const expensePieData = expenseByCategory.categories?.map((c) => ({
    name: c.category_name,
    value: Number(c.total || 0),
  })) || [];

  const incomePieData = incomeByCategory.categories?.map((c) => ({
    name: c.category_name,
    value: Number(c.total || 0),
  })) || [];

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  if (loading && !summary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
          <p className="text-slate-500">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 text-[var(--text-primary)]">
        <div className="p-8 lg:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-emerald-600" />
                Reports
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">Analisis pemasukan dan pengeluaran Anda</p>
            </div>
            
            <div className="flex items-center gap-3">
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 h-11 font-bold"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>

              <div className="flex bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-sm h-11">
                <button 
                  onClick={() => handleExport("pdf")}
                  disabled={exporting}
                  className="px-4 flex items-center gap-2 text-[var(--text-secondary)] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 border-r border-[var(--border-color)] transition-all font-bold text-sm disabled:opacity-50"
                  title="Download PDF Report"
                >
                  <FileText className="w-4 h-4" />
                  {exporting ? "..." : "PDF"}
                </button>
                <button 
                  onClick={() => handleExport("csv")}
                  disabled={exporting}
                  className="px-4 flex items-center gap-2 text-[var(--text-secondary)] hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-600 transition-all font-bold text-sm disabled:opacity-50"
                  title="Download CSV Report"
                >
                  <TableIcon className="w-4 h-4" />
                  {exporting ? "..." : "CSV"}
                </button>
              </div>
            </div>
          </div>

          {/* Summary cards & Health Status */}
          {summary && (
            <div className="space-y-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Financial Health Scorecard */}
                <div className="lg:col-span-2 bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl shadow-emerald-900/20 relative overflow-hidden group">
                  <div className="absolute top-[-20px] right-[-20px] w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <p className="text-emerald-100/80 text-xs font-black uppercase tracking-widest mb-1">Financial Health Status</p>
                      <h3 className="text-3xl font-black mb-2 flex items-center gap-2">
                        {(() => {
                          const ratio = summary.total_income > 0 ? (summary.total_expense / summary.total_income) : 1;
                          if (ratio < 0.5) return <>EXCELLENT <div className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" /></>;
                          if (ratio < 0.8) return <>STABLE <div className="w-2 h-2 rounded-full bg-blue-300 animate-pulse" /></>;
                          return <>CAUTION <div className="w-2 h-2 rounded-full bg-amber-300 animate-pulse" /></>;
                        })()}
                      </h3>
                      <p className="text-emerald-50/70 text-sm max-w-sm leading-relaxed">
                        {(() => {
                          const ratio = summary.total_income > 0 ? (summary.total_expense / summary.total_income) : 1;
                          if (ratio < 0.5) return "Pengeluaran Anda sangat terkendali. Anda memiliki ruang gerak finansial yang luas.";
                          if (ratio < 0.8) return "Keuangan Anda dalam kondisi sehat. Tetap pertahankan pola pengeluaran ini.";
                          return "Pengeluaran Anda mendekati total pemasukan. Pertimbangkan untuk mengevaluasi kategori pengeluaran terbesar.";
                        })()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs font-bold text-emerald-100/60 uppercase mb-1">Savings Rate</p>
                        <div className="relative w-24 h-24 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-white/10" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-emerald-300" 
                              strokeDasharray={2 * Math.PI * 40}
                              strokeDashoffset={2 * Math.PI * 40 * (1 - Math.max(0, summary.total_income > 0 ? (summary.total_income - summary.total_expense) / summary.total_income : 0))}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute text-xl font-black">
                            {Math.round(Math.max(0, summary.total_income > 0 ? (summary.total_income - summary.total_expense) / summary.total_income * 100 : 0))}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Quick Actions/Insight */}
                <div className="bg-[var(--bg-card)] rounded-3xl p-6 border border-[var(--border-color)] flex flex-col justify-center gap-4 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                      <TrendingUp className="w-24 h-24" />
                   </div>
                   <p className="text-[var(--text-secondary)] text-xs font-black uppercase tracking-widest">Avg Growth Insight</p>
                   <div>
                      <p className="text-3xl font-black text-[var(--text-primary)]">
                        {summary.avg_expense > 0 ? `+${((summary.avg_expense / 1000000).toFixed(1))}M` : '0'}
                      </p>
                      <p className="text-[var(--text-secondary)] text-sm font-medium mt-1">Average monthly spending flow.</p>
                   </div>
                   <div className="flex items-center gap-2 text-emerald-500 font-bold text-sm">
                      <TrendingDown className="w-4 h-4" />
                      <span>Optimized Flow</span>
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-5 border border-[var(--border-color)] hover:border-emerald-500 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                  <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest relative z-10 text-opacity-70">Total Income</p>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-500 mt-1 relative z-10 tracking-tight">Rp {Number(summary.total_income || 0).toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-5 border border-[var(--border-color)] hover:border-red-500 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                  <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest relative z-10 text-opacity-70">Total Expense</p>
                  <p className="text-2xl font-black text-red-600 dark:text-red-500 mt-1 relative z-10 tracking-tight">Rp {Number(summary.total_expense || 0).toLocaleString()}</p>
                </div>
                <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-5 border border-[var(--border-color)] hover:border-blue-500 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-500" />
                  <p className="text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest relative z-10 text-opacity-70">Net Balance</p>
                  <p className={`text-2xl font-black mt-1 relative z-10 tracking-tight ${(summary.balance || 0) >= 0 ? "text-emerald-600 dark:text-emerald-500" : "text-red-600 dark:text-red-500"}`}>
                    Rp {Number(summary.balance || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Monthly chart */}
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Income vs Expense Trend
            </h2>
            <div className="h-80 w-full" id="trend-chart">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} opacity={0.5} />
                    <XAxis dataKey="month" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                      labelStyle={{ color: "var(--text-primary)", fontWeight: "bold" }}
                      itemStyle={{ fontSize: '12px' }}
                      formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, ""]}
                    />
                    <Legend iconType="circle" />
                    <Bar dataKey="income" name="Income" fill={INCOME_COLOR} radius={[6, 6, 0, 0]} barSize={20} />
                    <Bar dataKey="expense" name="Expense" fill={EXPENSE_COLOR} radius={[6, 6, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[var(--text-secondary)] italic">Tidak ada data transaksi</div>
              )}
            </div>
          </div>

          {/* Pie charts */}
          <div className="grid md:grid-cols-2 gap-6 pb-10">
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-red-600" />
                Expense Breakdown
              </h2>
              <div className="h-72" id="expense-pie">
                {expensePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expensePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {expensePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: "bold" }}
                        formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--text-secondary)] italic">Tidak ada pengeluaran</div>
                )}
              </div>
              {expenseByCategory.total > 0 && (
                <div className="bg-[var(--bg-main)]/50 rounded-xl p-3 mt-4 flex items-center justify-between border border-[var(--border-color)]">
                    <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Expense</span>
                    <span className="text-sm font-black text-red-600 mr-4">Rp {Number(expenseByCategory.total).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-6 flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-emerald-600" />
                Income Breakdown
              </h2>
              <div className="h-72" id="income-pie">
                {incomePieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incomePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                        nameKey="name"
                        stroke="none"
                      >
                        {incomePieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: "16px", boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ color: "var(--text-primary)", fontSize: "12px", fontWeight: "bold" }}
                        formatter={(value) => [`Rp ${Number(value).toLocaleString()}`, ""]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-[var(--text-secondary)] italic">Tidak ada pemasukan</div>
                )}
              </div>
              {incomeByCategory.total > 0 && (
                <div className="bg-[var(--bg-main)]/50 rounded-xl p-3 mt-4 flex items-center justify-between border border-[var(--border-color)]">
                <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">Total Income</span>
                <span className="text-sm font-black text-emerald-600 mr-4">Rp {Number(incomeByCategory.total).toLocaleString()}</span>
            </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReportsPage;

