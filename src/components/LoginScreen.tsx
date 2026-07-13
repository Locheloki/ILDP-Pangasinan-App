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

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-xs border border-slate-200/80 overflow-hidden">
        {/* Header Branding */}
        <div className="bg-slate-900 p-8 text-white text-center relative overflow-hidden border-b border-slate-800">
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
          <h1 className="text-xl font-bold tracking-tight font-display text-white">ILDP Pangasinan</h1>
          <p className="text-slate-400 text-xs mt-1">Provincial Learning Needs Encoding & Summary System</p>
        </div>

        {/* Form Body */}
        <div className="p-8">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg text-xs text-red-700 flex items-start gap-2">
              <span className="font-semibold">Error:</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
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
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 text-xs"
                  placeholder="e.g. encoder"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e: any) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3.5 py-2.5 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-800 placeholder-slate-400 text-xs"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 hover:scale-[1.01] active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl transition-all duration-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 shadow-xs flex items-center justify-center gap-2 text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Sign In</>
              )}
            </button>
          </form>

          {/* Having Trouble? Contact Developer Support */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4">
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-blue-200/50 mb-3">
                <HelpCircle className="h-2.5 w-2.5" />
                Having Trouble?
              </span>
              <h4 className="text-xs font-bold text-slate-800">Guillermo Jimz S. Jimenez III</h4>
              <p className="text-[10px] text-slate-500 font-medium">System Developer</p>
              
              <div className="mt-3 space-y-2 text-[11px] text-slate-600">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <a href="tel:+639691637944" className="hover:text-blue-600 hover:underline font-mono">
                    +63 969 163 7944
                  </a>
                </div>
                
                <div className="flex items-start gap-2">
                  <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                  <span>Libsong East, Lingayen, Pangasinan</span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-dashed border-slate-200 mt-2">
                  <MessageSquare className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <a
                    href="https://www.facebook.com/Loche.Jimenez"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium inline-flex items-center gap-1"
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
