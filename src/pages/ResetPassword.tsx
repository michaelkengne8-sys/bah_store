import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const resetSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ResetFormData = z.infer<typeof resetSchema>;

const passwordRequirements = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [tokenValid, setTokenValid] = useState<null | boolean>(null);
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { pushToast } = useStore();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const password = useWatch({ control, name: "password", defaultValue: "" });

  // Validate token during render when it changes (per React "adjusting state on prop change" guidance).
  const [prevToken, setPrevToken] = useState(token);
  if (prevToken !== token) {
    setPrevToken(token);
    if (!token) {
      setTokenValid(false);
      setError("Invalid or missing reset token");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(token)) {
      setTokenValid(false);
      setError("Invalid reset token format");
    } else {
      setTokenValid(true);
    }
  }

  const onSubmit = async (data: ResetFormData) => {
    if (!token) return;
    setIsSubmitting(true);
    setError("");
    try {
      await resetPassword(token, data.password);
      pushToast("Password has been reset successfully!", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password. Please try again.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (tokenValid === false) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8"
      >
        <div className="surface rounded-3xl p-8 sm:p-10 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 mb-4"
          >
            <AlertCircle className="h-8 w-8" />
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white">Invalid Reset Link</h1>
          <p className="mt-2 text-ink-300">
            This password reset link is invalid or has expired.
          </p>
          <Link to="/forgot-password" className="mt-6 inline-flex items-center gap-2 btn-primary">
            <ArrowLeft size={16} />
            Request a new link
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md px-4 py-12 sm:px-6 lg:px-8"
    >
      <div className="surface rounded-3xl p-8 sm:p-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950">
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </Link>
          <h1 className="font-display text-3xl font-bold text-white">Create new password</h1>
          <p className="mt-2 text-ink-300">Your new password must be different from previous ones</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-rose-300"
            role="alert"
          >
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-ink-200 mb-2">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
              <input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-ink-800/50 border transition ${
                  errors.password
                    ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="mt-1.5 text-sm text-rose-400">{errors.password.message}</p>}

            {/* Password strength indicator */}
            <div className="mt-3 space-y-1.5">
              {passwordRequirements.map((req, i) => {
                const met = req.test(password);
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-2 text-[11px]"
                  >
                    <span
                      className={`flex h-3.5 w-3.5 items-center justify-center rounded ${
                        met ? "bg-accent-500 text-ink-950" : "bg-ink-800 border border-white/10 text-ink-400"
                      }`}
                    >
                      {met ? "✓" : String(i + 1)}
                    </span>
                    <span className={met ? "text-accent-300" : "text-ink-400"}>{req.label}</span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-ink-200 mb-2">
              Confirm new password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
              <input
                {...register("confirmPassword")}
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                className={`w-full pl-10 pr-12 py-3 rounded-xl bg-ink-800/50 border transition ${
                  errors.confirmPassword
                    ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-white"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1.5 text-sm text-rose-400">{errors.confirmPassword.message}</p>
            )}
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`w-full py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed ${
              isSubmitting
                ? "bg-white/5 text-ink-300"
                : "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 hover:from-accent-300 hover:to-accent-500"
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                Resetting...
              </span>
            ) : (
              "Reset password"
            )}
          </motion.button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-300">
          Remember your password?{" "}
          <Link to="/login" className="text-accent-400 hover:text-accent-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}