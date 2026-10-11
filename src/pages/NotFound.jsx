import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-lg px-4 pb-24 pt-20 text-center sm:px-6"
    >
      <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow mb-8">
        <span className="font-display text-4xl font-bold">404</span>
      </div>
      <h1 className="font-display text-4xl font-bold text-white">Page not found</h1>
      <p className="mt-3 text-ink-300 text-lg">
        The page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-8 flex items-center justify-center gap-4">
        <Link to="/" className="btn-primary gap-2">
          <Home size={16} />
          Go Home
        </Link>
        <button onClick={() => window.history.back()} className="btn-ghost gap-2">
          <ArrowLeft size={16} />
          Go Back
        </button>
      </div>
    </motion.div>
  );
}