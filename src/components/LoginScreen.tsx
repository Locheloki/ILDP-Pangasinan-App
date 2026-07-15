import React from "react";
import { Lock, User as UserIcon, Activity, HelpCircle, Phone, MapPin, MessageSquare } from "lucide-react";
import { User } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  // Forgot password states
  const [isForgotPassword, setIsForgotPassword] = React.useState(false);
  const [devCode, setDevCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [successMessage, setSuccessMessage] = React.useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Invalid credentials");
      }

      const userData = await response.json();
      onLoginSuccess(userData);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your inputs.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: any) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, devCode, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setSuccessMessage(data.message || "Password reset successfully!");
      // Clear password field
      setPassword("");
      setDevCode("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-50/20 to-slate-200 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-900 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-white/10 overflow-hidden transition-colors duration-200">
        {/* Header Branding */}
        <div className="bg-slate-950/60 dark:bg-slate-950/50 p-8 text-white text-center relative overflow-hidden border-b border-white/10 backdrop-blur-md">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/5 rounded-full blur-2xl"></div>
          
          <div className="flex justify-center mb-4">
            <div className="bg-white p-1.5 rounded-full shadow-lg ring-4 ring-slate-800/60 inline-block">
              <img
                src="/pangasinan-logo.svg"
                alt="Provincial Seal of Pangasinan"
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>
          <h1 className="text-xl font-bold tracking-tight font-display text-white">ILDP</h1>
          <p className="text-slate-400 text-xs mt-1">Provincial Learning Needs Encoding & Summary System</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs text-red-700 flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-6 p-3 bg-emerald-50 border-l-4 border-emerald-500 rounded-r-lg text-xs text-emerald-700 flex items-start gap-2">
              <span className="font-semibold">Success:</span> {successMessage}
            </div>
          )}

          {!isForgotPassword ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e: any) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-colors duration-200"
                    placeholder="e.g. encoder"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError("");
                      setIsForgotPassword(true);
                    }}
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e: any) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-colors duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-glass text-xs py-2.5 font-bold cursor-pointer"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                ) : (
                  <>Sign In</>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <UserIcon className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e: any) => setUsername(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-colors duration-200"
                    placeholder="e.g. encoder"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Developer Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={devCode}
                    onChange={(e: any) => setDevCode(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-colors duration-200 font-mono"
                    placeholder="Enter developer code"
                  />
                </div>
                <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                  Developer code is provided by the system developer. If forgotten, contact him below.
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e: any) => setNewPassword(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-colors duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e: any) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs transition-colors duration-200"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setSuccessMessage("");
                    setIsForgotPassword(false);
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-glass bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-900/30 text-xs py-2 px-4 cursor-pointer font-bold"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </div>
            </form>
          )}

          {/* Having Trouble? Contact Developer Support */}
          <div className="mt-8 border-t border-slate-200/40 dark:border-white/5 pt-6">
            <div className="bg-slate-100/30 dark:bg-slate-950/30 border border-slate-200/40 dark:border-white/5 rounded-xl p-4 backdrop-blur-sm transition-colors duration-200">
              <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-blue-200/50 dark:border-blue-800/80 mb-3">
                <HelpCircle className="h-2.5 w-2.5" />
                Having Trouble?
              </span>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100">Guillermo Jimz S. Jimenez III</h4>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">System Developer</p>
              
              <div className="mt-3 space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <a href="tel:+639691637944" className="hover:text-blue-600 hover:underline font-mono text-slate-700 dark:text-slate-300">
                    +63 969 163 7944
                  </a>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Libsong East, Lingayen, Pangasinan</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-200 dark:border-slate-800 mt-2">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <a
                    href="https://www.facebook.com/Loche.Jimenez"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium inline-flex items-center gap-1"
                  >
                    Connect on Facebook
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
