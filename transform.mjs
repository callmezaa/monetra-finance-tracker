import fs from 'fs';
import path from 'path';

const pagesDir = './frontend/src/pages';
const files = [
  'DashboardPage.jsx',
  'TransactionsPage.jsx',
  'SettingsPage.jsx',
  'AddTransactionPage.jsx',
  'BudgetsPage.jsx',
  'CategoriesPage.jsx',
  'ReportsPage.jsx'
];

const classMap = [
  // Page background
  ['bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900/30', 'bg-slate-50'],
  
  // Decorative backgrounds
  ['bg-emerald-500/5', 'bg-emerald-200/20'],
  ['bg-slate-500/5', 'bg-slate-200/20'],
  ['bg-teal-500/5', 'bg-teal-200/20'],
  
  // Sidebar
  ['bg-white/10 backdrop-blur-xl border-r border-white/10', 'bg-white border-r border-slate-200 shadow-sm'],
  
  // Navigation active and inactive
  ['bg-emerald-500/20 text-emerald-300', 'bg-emerald-50 text-emerald-600'],
  ['text-slate-400 hover:bg-white/5 hover:text-white', 'text-slate-500 hover:bg-slate-50 hover:text-emerald-600'],
  
  // Container cards
  ['bg-white/10 backdrop-blur-xl rounded-2xl', 'bg-white rounded-2xl shadow-sm'],
  ['bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10', 'bg-white rounded-2xl p-6 border border-slate-200 shadow-sm'],
  ['border border-white/10', 'border border-slate-200'],
  ['border-white/10', 'border-slate-200'],
  ['border-white/5', 'border-slate-100'],
  ['border-white/20', 'border-slate-200'],
  ['border-white/30', 'border-slate-300'],
  
  // Header / Top Navbar (Dashboard)
  ['bg-slate-900/50 backdrop-blur-xl border-b border-white/5', 'bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm'],
  
  // Texts
  ['text-white', 'text-slate-800'],
  ['text-slate-400', 'text-slate-500'],
  ['text-slate-300', 'text-slate-600'],
  
  // Specific text colors
  ['text-emerald-400', 'text-emerald-600'],
  ['text-red-400', 'text-red-600'],
  ['text-amber-400', 'text-amber-600'],
  ['text-indigo-400', 'text-indigo-600'],
  ['bg-slate-900', 'bg-white'], // inside Avatar

  // Buttons, Inputs, Selects
  ['bg-white/5 hover:bg-white/10', 'bg-white border border-slate-200 hover:bg-slate-50 focus:border-emerald-500 focus:ring-emerald-500/20'],
  ['bg-white/5', 'bg-white border border-slate-200'], // inputs / selects
  ['hover:bg-white/10 hover:text-white', 'hover:bg-slate-50 hover:text-emerald-600'],
  ['hover:bg-white/5 hover:text-white', 'hover:bg-slate-50 hover:text-emerald-600'],
  ['hover:bg-white/10', 'hover:bg-slate-50'],
  ['hover:bg-white/5', 'hover:bg-slate-50'],
  ['hover:border-emerald-500/30', 'hover:border-emerald-500 hover:shadow-md'],
  ['hover:border-red-500/30', 'hover:border-red-500 hover:shadow-md'],
  ['hover:border-amber-500/30', 'hover:border-amber-500 hover:shadow-md'],
  ['bg-emerald-500/20', 'bg-emerald-100'],
  ['bg-red-500/20 text-red-300', 'bg-red-50 text-red-600 hover:bg-red-100'],
  ['bg-red-500/20 hover:text-red-400', 'bg-red-50 hover:text-red-600 hover:bg-red-100'],
  ['bg-red-500/20', 'bg-red-100'],
  ['bg-red-500/10', 'bg-red-50'],
  ['bg-emerald-500/10', 'bg-emerald-50'],
  ['hover:bg-red-500/20 hover:text-red-300', 'hover:bg-red-50 hover:text-red-600'],
  ['[&>option]:bg-slate-800 [&>option]:text-white', ' '],
  ['[&>option]:text-white', ' '],
  ['[&>option]:bg-slate-800', ' '],

  // Others
  ['bg-gradient-to-br from-indigo-500/10 to-purple-500/10', 'bg-gradient-to-br from-indigo-50 to-purple-50'],
  ['border-indigo-500/20', 'border-indigo-200'],
  ['bg-indigo-500/20', 'bg-indigo-100'],
  ['bg-white/10 text-emerald-300', 'bg-emerald-50 text-emerald-600'],
  ['bg-white/10 peer-focus:outline-none', 'bg-slate-200 peer-focus:outline-none'],
  ['text-emerald-300', 'text-emerald-600'],
  ['text-red-300', 'text-red-600'],
  ['border-t-white', 'border-t-emerald-600'], // loading spinners
  ['border-white/30', 'border-emerald-600/30'],
  ['bg-slate-800', 'bg-white'], // Modals
  ['bg-slate-900/80', 'bg-slate-900/50'], // Modal backdrop
];

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Chart colors for recharts
    content = content.replace(/#1e293b/g, '#ffffff'); // Tooltip bg
    content = content.replace(/1px solid rgba\(255,255,255,0\.1\)/g, '1px solid #e2e8f0'); // Tooltip border
    content = content.replace(/#fff/g, '#1e293b'); // Tooltip title
    content = content.replace(/#e2e8f0/g, '#64748b'); // Tooltip items
    content = content.replace(/#ffffff1a/g, '#e2e8f0'); // CartesianGrid
    content = content.replace(/rgba\(255,255,255,0\.1\)/g, '#e2e8f0'); // CartesianGrid
    content = content.replace(/#cbd5e1/g, '#64748b'); // Legend text
    content = content.replace(/#94a3b8/g, '#64748b'); // Axis text

    classMap.forEach(([search, replace]) => {
      // Create a global replacement, escaping special regex chars if needed
      // but simple split/join is safer for exact strings
      content = content.split(search).join(replace);
    });

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
