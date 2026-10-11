import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Truck, Shield, Tag } from "lucide-react";

const messages = [
  { icon: Sparkles, text: "New Collection · Summer '26 just dropped" },
  { icon: Truck, text: "Free express shipping on orders over $99" },
  { icon: Shield, text: "30-day risk-free returns on every order" },
  { icon: Tag, text: "Members get an extra 15% off — sign in" },
];

export default function AnnouncementBar() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((p) => (p + 1) % messages.length), 4000);
    return () => clearInterval(t);
  }, []);
  const M = messages[i];
  const Icon = M.icon;
  return (
    <div className="relative overflow-hidden border-b border-white/5 bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900">
      <div className="mx-auto flex h-9 max-w-7xl items-center justify-center px-4 text-[12px] font-medium text-ink-200">
        <AnimatePresence mode="wait">
          <motion.div
            key={i}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center gap-2"
          >
            <Icon size={13} className="text-accent-300" />
            <span>{M.text}</span>
            <span className="ml-2 hidden text-ink-400 sm:inline">·</span>
            <Link to="/shop?filter=new" className="hidden text-accent-300 hover:underline sm:inline">
              Shop the drop →
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
