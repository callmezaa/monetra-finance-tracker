import { useState, useEffect } from "react";
import API from "../api/axios";
import { useNavigate } from "react-router-dom";
import {
  Settings,
  Bell,
  User,
  Shield,
  Palette,
  Lock,
  Sun,
  Moon
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { useTheme } from "../context/ThemeContext";

function SettingsPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();


  const [userProfile, setUserProfile] = useState({ 
    name: "", 
    email: "", 
    email_notifications: true, 
    monthly_reports: true 
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await API.get("/user/profile");
        setUserProfile(res.data);
      } catch (err) {
        setMessage({ text: "Gagal memuat profil", type: "error" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ text: "", type: "" });

    try {
      await API.put("/user/profile", {
        name: userProfile.name,
        email: userProfile.email,
        email_notifications: userProfile.email_notifications,
        monthly_reports: userProfile.monthly_reports,
      });
      setMessage({ text: "Profil berhasil diperbarui!", type: "success" });
    } catch (err) {
      if (err.response?.status === 409) {
        setMessage({ text: "Email sudah digunakan oleh akun lain.", type: "error" });
      } else {
        setMessage({ text: err.response?.data?.error || "Gagal memperbarui profil.", type: "error" });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({ text: "Konfirmasi password baru tidak cocok.", type: "error" });
      return;
    }

    setSaving(true);
    try {
      await API.put("/user/password", {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setMessage({ text: "Password berhasil diubah!", type: "success" });
      setIsPasswordModalOpen(false);
      setPasswordForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err) {
      setMessage({ text: err.response?.data?.error || "Gagal mengubah password.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-main)]">
      <Sidebar />

      <main className="flex-1 overflow-auto relative z-10 text-[var(--text-primary)]">
        <div className="p-8 lg:p-10 space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in-up">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Settings className="w-7 h-7 text-emerald-600" />
                Settings
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">Manage your account preferences and application settings</p>
            </div>
          </div>

          <div className="grid gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            
            {message.text && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                message.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-500/20 text-emerald-600' 
                  : 'bg-red-50 border-red-500/20 text-red-600'
              }`}>
                {message.type === 'success' ? <User className="w-5 h-5 flex-shrink-0" /> : <Settings className="w-5 h-5 flex-shrink-0" />}
                <p className="text-sm font-medium">{message.text}</p>
              </div>
            )}

            {/* Profile Settings */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:shadow-md transition-all">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
                <User className="w-5 h-5 text-emerald-600" />
                Profile Information
              </h2>
              
              {loading ? (
                <div className="animate-pulse space-y-4">
                  <div className="h-32 w-32 rounded-full bg-slate-200 mx-auto"></div>
                  <div className="h-10 bg-white border border-slate-200 rounded-xl"></div>
                  <div className="h-10 bg-white border border-slate-200 rounded-xl"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Avatar Upload Section */}
                  <div className="flex flex-col items-center gap-4 py-4">
                    <div className="relative group">
                      <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/20 group-hover:border-emerald-500 transition-all shadow-xl">
                        {userProfile.profile_picture ? (
                          <img 
                            src={`http://localhost:8080${userProfile.profile_picture}`} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = "https://ui-avatars.com/api/?name=" + userProfile.name + "&background=10b981&color=fff";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-3xl">
                            {userProfile.name?.charAt(0).toUpperCase() || "U"}
                          </div>
                        )}
                      </div>
                      <label 
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 p-2 bg-emerald-600 text-white rounded-full cursor-pointer shadow-lg hover:bg-emerald-500 transition-all border-2 border-[var(--bg-card)]"
                      >
                        <User className="w-5 h-5" />
                        <input 
                          id="avatar-upload"
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;

                            const formData = new FormData();
                            formData.append("avatar", file);

                            try {
                              setSaving(true);
                              const res = await API.post("/user/upload-avatar", formData, {
                                headers: { "Content-Type": "multipart/form-data" }
                              });
                              setUserProfile({ ...userProfile, profile_picture: res.data.url });
                              setMessage({ text: "Foto profil berhasil diperbarui!", type: "success" });
                            } catch (err) {
                              setMessage({ text: err.response?.data?.error || "Gagal mengunggah foto.", type: "error" });
                            } finally {
                              setSaving(false);
                            }
                          }}
                        />
                      </label>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] font-medium">JPG, PNG, or WEBP. Max 2MB.</p>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Name</label>
                      <input 
                        type="text" 
                        required
                        value={userProfile.name}
                        onChange={(e) => setUserProfile({...userProfile, name: e.target.value})}
                        className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                        placeholder="Your Name" 
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-[var(--text-secondary)]">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={userProfile.email}
                        onChange={(e) => setUserProfile({...userProfile, email: e.target.value})}
                        className="px-4 py-2.5 rounded-xl bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-emerald-500/50" 
                        placeholder="you@email.com" 
                      />
                    </div>
                    <div className="pt-2">
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium transition-all shadow-lg shadow-emerald-500/25 flex items-center justify-center min-w-[140px]"
                      >
                        {saving ? (
                          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          "Save Changes"
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Theme Settings */}
            <div className="bg-[var(--bg-card)] rounded-2xl shadow-sm p-6 border border-[var(--border-color)] hover:border-emerald-500 hover:shadow-md transition-all">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-6 flex items-center gap-2 border-b border-[var(--border-color)] pb-4">
                <Palette className="w-5 h-5 text-emerald-600" />
                Theme & Appearance
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => theme !== 'light' && toggleTheme()}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    theme === 'light' 
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-600 ring-4 ring-emerald-500/5' 
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5" />
                    <span className="font-bold text-sm">Light Mode</span>
                  </div>
                  {theme === 'light' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                </button>
                <button
                  onClick={() => theme !== 'dark' && toggleTheme()}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    theme === 'dark' 
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 ring-4 ring-emerald-500/5' 
                      : 'border-[var(--border-color)] bg-[var(--bg-main)] text-[var(--text-secondary)] hover:border-emerald-500/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5" />
                    <span className="font-bold text-sm">Dark Mode</span>
                  </div>
                  {theme === 'dark' && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                </button>
              </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 hover:border-amber-500 hover:shadow-md transition-all">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                <Bell className="w-5 h-5 text-amber-600" />
                Notifications
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Email Notifications</p>
                    <p className="text-sm text-slate-500">Receive email alerts for transactions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={userProfile.email_notifications}
                      onChange={(e) => setUserProfile({...userProfile, email_notifications: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-800">Monthly Reports</p>
                    <p className="text-sm text-slate-500">Receive a summary of your Monetra monthly</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={userProfile.monthly_reports}
                      onChange={(e) => setUserProfile({...userProfile, monthly_reports: e.target.checked})}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>
                <div className="pt-2">
                  <button 
                    onClick={handleUpdateProfile}
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-600 text-white font-medium transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center min-w-[140px]"
                  >
                    {saving ? (
                      <span className="w-5 h-5 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
                    ) : (
                      "Save Preferences"
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 hover:border-red-500 hover:shadow-md transition-all">
              <h2 className="text-lg font-semibold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-200 pb-4">
                <Shield className="w-5 h-5 text-red-600" />
                Security
              </h2>
              <div className="space-y-4">
                <button 
                  onClick={() => setIsPasswordModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 font-medium transition-all w-full sm:w-auto"
                >
                  Change Password
                </button>
              </div>
            </div>

            {/* Change Password Modal */}
            {isPasswordModalOpen && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Lock className="w-5 h-5 text-red-600" />
                      Ubah Password
                    </h3>
                  </div>
                  <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Password Saat Ini</label>
                      <input 
                        type="password" required
                        value={passwordForm.current_password}
                        onChange={(e) => setPasswordForm({...passwordForm, current_password: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Password Baru (min. 6 karakter)</label>
                      <input 
                        type="password" required minLength={6}
                        value={passwordForm.new_password}
                        onChange={(e) => setPasswordForm({...passwordForm, new_password: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-1">Konfirmasi Password Baru</label>
                      <input 
                        type="password" required
                        value={passwordForm.confirm_password}
                        onChange={(e) => setPasswordForm({...passwordForm, confirm_password: e.target.value})}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                      />
                    </div>
                    <div className="flex gap-3 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setIsPasswordModalOpen(false)}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium transition-all"
                      >
                        Batal
                      </button>
                      <button 
                        type="submit" 
                        disabled={saving}
                        className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-500/25 transition-all flex justify-center items-center"
                      >
                        {saving ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Ubah Password"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default SettingsPage;

