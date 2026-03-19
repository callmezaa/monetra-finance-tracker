import fs from 'fs';
import path from 'path';

const pagesDir = './frontend/src/pages';
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/bg-emerald-600 hover:bg-emerald-500 text-slate-800/g, 'bg-emerald-600 hover:bg-emerald-500 text-white');
  content = content.replace(/bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-slate-800/g, 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 text-white');
  content = content.replace(/disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-800/g, 'disabled:bg-slate-600 disabled:cursor-not-allowed text-white');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Fixed ${file}`);
});
