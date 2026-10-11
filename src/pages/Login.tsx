import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2, Mail, Lock, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useStore } from "../context/StoreContext";

const GOOGLE_CLIENT_ID = (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_GOOGLE_CLIENT_ID || "";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect") || "/account";
  const { login, googleSignIn, appleSignIn, state } = useAuth();
  const { pushToast } = useStore();
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError("");
    try {
      await login(data.email, data.password, data.rememberMe);
      pushToast("Welcome back! You're now signed in.", "success");
      navigate(redirect, { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(message);
      pushToast(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  const handleGoogleSignIn = () => {
    if (!GOOGLE_CLIENT_ID) {
      pushToast("Google sign-in is not configured yet", "info");
      return;
    }

    setOauthLoading("google");
    setError("");

    const w = window as unknown as Record<string, unknown>;
    const google = w.google as { accounts: { id: { initialize: (...args: unknown[]) => void; prompt: (...args: unknown[]) => void } } } | undefined;

    if (google?.accounts?.id) {
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response: { credential: string }) => {
          try {
            await googleSignIn(response.credential);
            pushToast("Signed in with Google!", "success");
            navigate(redirect, { replace: true });
          } catch (err) {
            const message = err instanceof Error ? err.message : "Google sign-in failed";
            setError(message);
            pushToast(message, "error");
          } finally {
            setOauthLoading(null);
          }
        },
        cancel_on_tap_outside: false,
      });
      google.accounts.id.prompt();
    } else {
      setOauthLoading(null);
      pushToast("Google Sign-In is loading. Please try again.", "info");
    }
  };

  const handleAppleSignIn = () => {
    setOauthLoading("apple");
    setError("");

    const w = window as unknown as Record<string, unknown>;
    const AppleID = w.AppleID as { auth: { signIn: (...args: unknown[]) => Promise<{ authorization: { id_token: string } }> } } | undefined;

    if (AppleID?.auth) {
      AppleID.auth.signIn({
        clientId: (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_APPLE_CLIENT_ID || "",
        redirectURI: (import.meta as unknown as Record<string, Record<string, string>>).env?.VITE_APPLE_REDIRECT_URI || window.location.origin + "/login",
        scope: "name email",
        usePopup: true,
      }).then(async (result: { authorization: { id_token: string } }) => {
        try {
          await appleSignIn(result.authorization.id_token);
          pushToast("Signed in with Apple!", "success");
          navigate(redirect, { replace: true });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Apple sign-in failed";
          setError(message);
          pushToast(message, "error");
        } finally {
          setOauthLoading(null);
        }
      }).catch(() => {
        setOauthLoading(null);
        setError("Apple sign-in cancelled or failed");
      });
    } else {
      // Load Apple JS SDK
      const script = document.createElement("script");
      script.src = "https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js";
      script.onload = () => {
        handleAppleSignIn();
        return;
      };
      script.onerror = () => {
        setOauthLoading(null);
        pushToast("Apple Sign-In could not be loaded", "error");
      };
      document.body.appendChild(script);
    }
  };

  if (state.isAuthenticated && !state.isLoading) {
    navigate(redirect, { replace: true });
    return null;
  }

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
          <h1 className="font-display text-3xl font-bold text-white">Welcome back</h1>
          <p className="mt-2 text-ink-300">Sign in to your Top Shelf account</p>
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-ink-200">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-accent-400 hover:text-accent-300 transition"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-ink-400" />
              <input
                {...register("password")}
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
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
            {errors.password && (
              <p className="mt-1.5 text-sm text-rose-400">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <input
              {...register("rememberMe")}
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-white/10 bg-ink-800 text-accent-500 focus:ring-accent-500/20"
            />
            <label htmlFor="rememberMe" className="text-sm text-ink-300 cursor-pointer">
              Remember me
            </label>
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
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </motion.button>
        </form>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-ink-950 text-ink-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || oauthLoading !== null}
              className="btn-ghost gap-2 justify-center"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google
            </button>
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={isSubmitting || oauthLoading !== null}
              className="btn-ghost gap-2 justify-center"
            >
              {oauthLoading === "apple" ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              )}
              Apple
            </button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-ink-300">
          Don't have an account?{" "}
          <Link to={`/signup?redirect=${encodeURIComponent(redirect)}`} className="text-accent-400 hover:text-accent-300 font-medium">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}