import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Loader2, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const forgotSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type ForgotFormData = z.infer<typeof forgotSchema>;

export default function ForgotPassword() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();
  const { pushToast } = useStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotSchema),
  });

  const onSubmit = async (data: ForgotFormData) => {
    setIsSubmitting(true);
    setError("");
    try {
      await forgotPassword(data.email);
      setSuccess(true);
      pushToast("If an account exists, a password reset link has been sent.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset email. Please try again.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto max-w-md px-4 py-16 sm:px-6 lg:px-8"
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
          <h1 className="font-display text-3xl font-bold text-white">Forgot password?</h1>
          <p className="mt-2 text-ink-300">
            {success
              ? "Check your email for a link to reset your password."
              : "Enter your email and we'll send you a link to reset your password."}
          </p>
        </div>

        {error && !success && (
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

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-center gap-3 rounded-xl bg-green-500/10 border border-green-500/20 p-4 text-green-300"
            role="status"
          >
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <p className="text-sm">If an account exists for that email, a password reset link has been sent.</p>
          </motion.div>
        )}

        {!success && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink-200 mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                    errors.email
                      ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                  } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                  disabled={isSubmitting}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-sm text-rose-400">{errors.email.message}</p>
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
                  Sending...
                </span>
              ) : (
                "Send reset link"
              )}
            </motion.button>
          </form>
        )}

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-ink-950 text-ink-400">Or</span>
            </div>
          </div>

          <div className="mt-6">
            <Link
              to="/login"
              className="btn-ghost gap-2 justify-center w-full"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-300">
          Don't have an account?{" "}
          <Link to="/signup" className="text-accent-400 hover:text-accent-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}