import { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const email = searchParams.get("email");
  const { verifyEmailLink, resendOtp } = useAuth();
  const { pushToast } = useStore();
  const [status, setStatus] = useState<"loading" | "success" | "error">(() =>
    token ? "loading" : "error"
  );
  const [message, setMessage] = useState(() =>
    token ? "Verifying your email..." : "Invalid verification link. No token provided."
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    verifyEmailLink(token)
      .then(() => {
        if (cancelled) return;
        setStatus("success");
        setMessage("Email verified successfully! Redirecting...");
        setTimeout(() => navigate("/account", { replace: true }), 2000);
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed. The link may be expired.");
      });

    return () => { cancelled = true; };
  }, [token, verifyEmailLink, navigate]);

  const handleResend = async () => {
    if (!email) return;
    try {
      await resendOtp(email);
      pushToast("New verification code sent to your email!", "success");
    } catch {
      pushToast("Failed to resend. Please try again.", "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-md px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="surface rounded-3xl p-8 sm:p-10 text-center">
        {status === "loading" && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-accent-400" />
            <h1 className="font-display text-2xl font-bold text-white">Verifying...</h1>
            <p className="text-ink-300 text-sm">{message}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/10">
              <CheckCircle2 className="h-10 w-10 text-accent-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Email Verified!</h1>
            <p className="text-ink-300 text-sm">{message}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
              <XCircle className="h-10 w-10 text-rose-400" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white">Verification Failed</h1>
            <p className="text-ink-300 text-sm">{message}</p>
            {email && (
              <button
                onClick={handleResend}
                className="mt-2 text-sm text-accent-400 hover:text-accent-300 underline"
              >
                Resend verification code
              </button>
            )}
            <Link
              to="/login"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-accent-400 hover:text-accent-300"
            >
              Go to login
            </Link>
          </div>
        )}
      </div>
    </motion.div>
  );
}
