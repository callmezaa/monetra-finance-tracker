import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ChevronDown, Globe } from "lucide-react";
import { motion } from "framer-motion";

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://localhost:8080/api/login", form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch {
      alert("Email atau password salah");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSocialLoading(true);
    try {
      const mockPayload = { email: "demo.user@gmail.com", name: "Demo User" };
      const res = await axios.post("http://localhost:8080/api/auth/google", mockPayload);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Google Login failed");
    } finally {
      setSocialLoading(false);
    }
  };

  const [lang, setLang] = useState("EN");
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);

  const t = {
    EN: {
      signin: "Sign In",
      welcome: "Fast, Efficient and Productive",
      description: "Take control of your financial future with Monetra's intuitive tracking and powerful insights.",
      email: "Email",
      pass: "Password",
      btn: "Sign In",
      or: "Or with",
      google: "Sign Up with Google",
      apple: "Sign Up with Apple",
      noAccount: "New to Monetra?",
      signup: "Sign Up",
      lang: "English",
      terms: "Terms",
      plans: "Plans",
      contact: "Contact Us"
    },
    ID: {
       signin: "Masuk",
       welcome: "Cepat, Efisien dan Produktif",
       description: "Kendalikan masa depan finansial Anda dengan pelacakan intuitif dan wawasan mendalam dari Monetra.",
       email: "Email",
       pass: "Kata Sandi",
       btn: "Masuk",
       or: "Atau dengan",
       google: "Daftar dengan Google",
       apple: "Daftar dengan Apple",
       noAccount: "Baru di Monetra?",
       signup: "Daftar",
       lang: "Indonesia",
       terms: "Syarat",
       plans: "Paket",
       contact: "Hubungi Kami"
    }
  };

  const content = t[lang];

  return (
    <div className="auth-bg">
      {/* Soft Background Blobs */}
      <div className="auth-blob top-[-10%] left-[-10%] w-[45%] h-[45%] bg-blue-100/40" />
      <div className="auth-blob bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-emerald-50/50" />
      <div className="auth-blob top-[20%] right-[10%] w-[25%] h-[25%] bg-teal-50/30" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="auth-card"
      >
        {/* LEFT SECTION: Branding & Info */}
        <div className="flex-1 flex flex-col p-12 lg:p-20 relative z-20">
          {/* Logo Top Left */}
          <div className="flex items-center gap-3 mb-auto">
             <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                <img src="/logo.png" alt="Monetra" className="w-6 h-6 object-contain brightness-0 invert" />
             </div>
             <span className="text-2xl font-black text-slate-800 tracking-tight">Monetra</span>
          </div>

          {/* Centered Headline */}
          <div className="my-auto py-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-5xl font-extrabold text-slate-800 mb-6 leading-tight max-w-lg">
                {content.welcome}
              </h1>
              <p className="text-slate-500 text-lg max-w-sm leading-relaxed font-medium">
                {content.description}
              </p>
            </motion.div>
          </div>

          {/* Footer Links Bottom Left */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pt-10 mt-auto border-t border-slate-100">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-3 text-sm font-bold text-slate-600 hover:text-emerald-700 transition-all bg-slate-50 px-5 py-3 rounded-2xl"
              >
                <span className="text-lg">{lang === "EN" ? "🇺🇸" : "🇮🇩"}</span>
                {content.lang}
                <ChevronDown size={14} className={`transition-transform duration-300 ${showLanguageMenu ? "rotate-180" : ""}`} />
              </button>
              
              {showLanguageMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bottom-full left-0 mb-3 w-44 bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-1"
                >
                  {[{ id: "EN", label: "English", icon: "🇺🇸" }, { id: "ID", label: "Indonesia", icon: "🇮🇩" }].map(item => (
                    <button
                      key={item.id}
                      onClick={() => { setLang(item.id); setShowLanguageMenu(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 rounded-xl transition-all ${lang === item.id ? "bg-emerald-600 text-white" : "text-slate-600 hover:bg-emerald-50"}`}
                    >
                      <span>{item.icon}</span>
                      {item.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            <div className="flex gap-8 text-sm font-bold text-emerald-600/80">
                <a href="#" className="hover:text-emerald-700 transition-colors">{content.terms}</a>
                <a href="#" className="hover:text-emerald-700 transition-colors">{content.plans}</a>
                <a href="#" className="hover:text-emerald-700 transition-colors">{content.contact}</a>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION: Floating Card Center */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-30">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="auth-form-container"
          >
            <div className="mb-10">
              <h2 className="text-3xl font-bold text-slate-800 mb-1">{content.signin}</h2>
              <p className="text-slate-400 text-sm font-medium tracking-tight">Your Social Campaigns</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-600 ml-1 uppercase tracking-wider">{content.email}</label>
                <input
                  type="email" name="email" value={form.email} onChange={handleChange} required
                  className="w-full px-5 py-4 rounded-2xl border-none bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{content.pass}</label>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} required
                    className="w-full px-5 py-4 rounded-2xl border-none bg-slate-50 text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-semibold pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-emerald-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit" disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-lg rounded-2xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {loading ? "Signing in..." : content.signin}
              </button>

              {/* Divider */}
              <div className="relative flex items-center py-2">
                <div className="flex-1 border-t border-slate-100"></div>
                <span className="px-4 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">{content.or}</span>
                <div className="flex-1 border-t border-slate-100"></div>
              </div>

              {/* Social Login */}
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  type="button" onClick={handleGoogleLogin}
                  className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12 5.04c1.94 0 3.7.67 5.08 1.99l3.8-3.8C18.57 1.15 15.48 0 12 0 7.31 0 3.25 2.69 1.25 6.64l4.23 3.28C6.48 7.39 8.99 5.04 12 5.04z"/><path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.76 2.91c2.2-2.03 3.46-5.03 3.46-8.73z"/><path fill="#FBBC05" d="M5.48 14.64c-.25-.73-.39-1.51-.39-2.32s.14-1.59.39-2.32l-4.23-3.28C.45 8.35 0 10.13 0 12s.45 3.65 1.25 5.28l4.23-3.28z"/><path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.92l-3.76-2.91c-1.06.71-2.42 1.13-3.95 1.13-3.01 0-5.56-2.04-6.47-4.79l-4.23 3.28C3.25 21.31 7.31 24 12 24z"/></svg>
                  Sign Up with Google
                </button>
                <button 
                  type="button"
                  className="flex-1 flex items-center justify-center gap-3 py-3.5 rounded-2xl border border-slate-100 hover:bg-slate-50 transition-all text-xs font-bold text-slate-700 shadow-sm"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M17.05 20.28c-.96.95-2.18 1.72-3.66 1.72-1.39 0-2.28-.79-3.39-1.3-1.11-.51-2.34-.51-3.45 0-1.28.59-1.92 1.3-3.39 1.3-1.48 0-2.7-.77-3.66-1.72C-1.87 18.06-2 12.21 1.25 8.9c1.61-1.64 3.82-2.3 5.42-2.3 1.39 0 2.22.48 3.19.96.69.34 1.3.64 2.14.64.84 0 1.45-.3 2.14-.64.97-.48 1.8-.96 3.19-.96 1.6 0 3.81.66 5.42 2.3 3.25 3.31 3.12 9.16.71 11.38zM12 5.43c0-2.36 1.93-4.43 4.31-4.43.34 0 .68.03 1.01.09-1.4 3.03-4.5 4.34-5.32 4.34z"/></svg>
                  Sign Up with Apple
                </button>
              </div>
            </form>

            <div className="mt-12 text-center">
              <p className="text-slate-400 text-sm font-bold">
                {content.noAccount}{" "}
                <button 
                  onClick={() => navigate("/register")}
                  className="text-emerald-600 font-extrabold hover:text-emerald-700 transition-all"
                >
                  {content.signup}
                </button>
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginPage;

