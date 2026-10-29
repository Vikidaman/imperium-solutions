import React, { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  Send,
  KeyRound,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export default function DirectorLoginPortal({
  onAuthenticated,
  onSwitchToPublicView,
}) {
  const [step, setStep] = useState("credentials"); // "credentials" | "pair_telegram" | "otp"
  const [username, setUsername] = useState("Vikidaman");
  const [password, setPassword] = useState("");
  const [botToken, setBotToken] = useState("");
  const [chatId, setChatId] = useState("");
  const [detectedUser, setDetectedUser] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [maskedChat, setMaskedChat] = useState("");
  const [telegramConfigured, setTelegramConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  useEffect(() => {
    fetch("/api/auth/status")
      .then((r) => r.json())
      .then((data) => {
        setTelegramConfigured(Boolean(data.telegramConfigured));
        if (data.maskedChatId) setMaskedChat(data.maskedChatId);
      })
      .catch(() => {});
  }, []);

  const handleStep1Login = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          botToken: botToken.trim() || undefined,
          chatId: chatId.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.needsTelegramSetup) {
          setStep("pair_telegram");
          setInfoMessage(
            "Credentials verified! Pair your Telegram Bot once below to receive your 6-digit 2FA codes on Telegram."
          );
        } else {
          setError(data.error || "Login failed");
        }
      } else {
        setMaskedChat(data.maskedChatId || "Telegram");
        setInfoMessage(
          data.message || "6-digit 2FA code dispatched to your Telegram!"
        );
        setStep("otp");
      }
    } catch (err) {
      setError("Network error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectChatId = async () => {
    if (!botToken.trim()) {
      setError("Please paste your Telegram Bot Token from @BotFather first.");
      return;
    }
    setError("");
    setInfoMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/telegram-detect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botToken: botToken.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(
          data.error ||
            "Could not detect Chat ID. Send '/start' to your bot in Telegram and click Auto-Detect again."
        );
      } else {
        setChatId(String(data.chatId));
        setDetectedUser(data.chatTitle || data.username || "Telegram User");
        setInfoMessage(
          `Detected Telegram chat: ${data.chatTitle || data.username} (ID: ${data.chatId})`
        );
      }
    } catch (err) {
      setError("Failed to contact Telegram API: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-2fa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          otpCode: otpCode.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid or expired 2FA code");
      } else if (data.sessionToken) {
        onAuthenticated({
          token: data.sessionToken,
          username: data.username || username,
        });
      }
    } catch (err) {
      setError("Verification failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle radial background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0c2d48_0%,#020617_70%)] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-mono-num uppercase tracking-widest text-emerald-400 block">
                Private Command Portal
              </span>
              <h1 className="text-lg font-bold font-display text-white">
                Imperium Director 2FA Login
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={onSwitchToPublicView}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
            title="Switch to Public Read-Only Spectator View"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" /> Public View
          </button>
        </div>

        {/* Step Indicator Pills */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div
            className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-2 ${
              step === "credentials" || step === "pair_telegram"
                ? "bg-cyan-500/15 border-cyan-500/40 text-cyan-300"
                : "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> 1. Director Credentials
          </div>
          <div
            className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-2 ${
              step === "otp"
                ? "bg-amber-500/20 border-amber-500/50 text-amber-300"
                : "bg-slate-950/60 border-slate-800 text-slate-500"
            }`}
          >
            <Send className="w-3.5 h-3.5" /> 2. Telegram 2FA Code
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: CREDENTIALS */}
        {step === "credentials" && (
          <form onSubmit={handleStep1Login} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Director Callsign / Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Vikidaman"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Director Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:border-cyan-400 outline-none"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Default master password: <code className="text-slate-300">imperium-2026</code>
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400">
                Telegram 2FA:{" "}
                {telegramConfigured ? (
                  <strong className="text-emerald-400">
                    Connected ({maskedChat})
                  </strong>
                ) : (
                  <strong className="text-amber-400">Setup on Next Step</strong>
                )}
              </span>
              <button
                type="button"
                onClick={() => setStep("pair_telegram")}
                className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" /> Configure Telegram Bot
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              {loading
                ? "Dispatching Telegram 2FA..."
                : "Send 2FA Code via Telegram"}
            </button>
          </form>
        )}

        {/* STEP 1B: TELEGRAM BOT PAIRING / SETUP */}
        {step === "pair_telegram" && (
          <form onSubmit={handleStep1Login} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
              <div className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Connect Your Telegram for 2FA Codes
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
                <li>
                  Message <strong>@BotFather</strong> on Telegram with{" "}
                  <code>/newbot</code> and copy the <strong>Bot Token</strong>.
                </li>
                <li>
                  Open your new bot in Telegram and send <code>/start</code>.
                </li>
                <li>
                  Paste the Bot Token below and click{" "}
                  <strong className="text-cyan-300">Auto-Detect My Chat ID</strong>!
                </li>
              </ol>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Director Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="imperium-2026"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Telegram Bot Token (from @BotFather)
              </label>
              <input
                type="text"
                required
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                placeholder="1234567890:AAH..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono-num text-white"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-300">
                  Your Telegram Chat ID
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetectChatId}
                  disabled={loading}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" /> Auto-Detect My Chat ID
                </button>
              </div>
              <input
                type="text"
                required
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                placeholder="e.g. 987654321"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs font-mono-num text-white"
              />
              {detectedUser && (
                <span className="text-[11px] text-emerald-400 mt-1 block">
                  Linked to: {detectedUser}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" /> Save & Send Telegram 2FA Code
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ENTER 6-DIGIT TELEGRAM OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
              A 6-digit verification code has been sent via Telegram to{" "}
              <strong className="text-cyan-300">{maskedChat || "your chat"}</strong>.
              Enter it below to unlock full World Director privileges.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                6-Digit Telegram 2FA Code
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                required
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-amber-500/50 text-center text-2xl font-bold font-mono-num tracking-[0.4em] text-amber-300 focus:border-amber-400 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length < 6}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              {loading ? "Verifying 2FA..." : "Verify & Unlock Director Portal"}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => setStep("credentials")}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                ← Back to Login
              </button>
              <button
                type="button"
                onClick={handleStep1Login}
                className="text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
              >
                Resend Telegram Code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
