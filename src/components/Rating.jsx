import { motion } from "framer-motion";
import { Star } from "lucide-react";

export default function Rating({ value = 0, size = 14, showValue = true, reviews }) {
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex">
        {stars.map((s) => {
          const filled = s <= Math.round(value);
          return (
            <motion.span
              key={s}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: s * 0.04 }}
            >
              <Star
                size={size}
                className={filled ? "fill-amber-400 text-amber-400" : "text-ink-500"}
                strokeWidth={1.5}
              />
            </motion.span>
          );
        })}
      </div>
      {showValue && (
        <span className="text-xs text-ink-300">
          {value.toFixed(1)}
          {reviews != null && <span className="text-ink-400"> · {reviews.toLocaleString()}</span>}
        </span>
      )}
    </div>
  );
}
