import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Mail, MapPin, Phone } from "lucide-react";

const columns = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", to: "/shop?filter=new" },
      { label: "Best Sellers", to: "/shop?filter=best" },
      { label: "Audio", to: "/shop?category=audio" },
      { label: "Wearables", to: "/shop?category=wearables" },
      { label: "Smart Home", to: "/shop?category=home" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", to: "/contact" },
      { label: "FAQ", to: "/faq" },
      { label: "Shipping & Delivery", to: "/contact" },
      { label: "Returns & Refunds", to: "/contact" },
      { label: "Order Tracking", to: "/contact" },
      { label: "Contact", to: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Top Shelf Exotics", to: "/about" },
      { label: "Sustainability", to: "/about" },
      { label: "Careers", to: "/about" },
      { label: "Press", to: "/about" },
      { label: "Affiliates", to: "/about" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
      { label: "Cookie Policy", to: "/privacy" },
      { label: "Accessibility", to: "/contact" },
    ],
  },
];

// Inline SVG socials (no external dependency on brand icons)
const socials = [
  { label: "Instagram", path: "M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.5 1s.7.9 1 1.5c.2.4.4 1 .4 2.2.1 1.2.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-1 1.5s-.9.7-1.5 1c-.4.2-1 .4-2.2.4-1.2.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.5-1s-.7-.9-1-1.5c-.2-.4-.4-1-.4-2.2-.1-1.2-.1-1.6-.1-4.8s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 1-1.5s.9-.7 1.5-1c.4-.2 1-.4 2.2-.4 1.2-.1 1.6-.1 4.8-.1zm0 2.2c-3.1 0-3.5 0-4.7.1-1.1 0-1.7.2-2.1.3-.5.2-.9.4-1.3.8s-.6.8-.8 1.3c-.1.4-.3 1-.3 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1.1.2 1.7.3 2.1.2.5.4.9.8 1.3s.8.6 1.3.8c.4.1 1 .3 2.1.3 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.2 2.1-.3.5-.2.9-.4 1.3-.8s.6-.8.8-1.3c.1-.4.3-1 .3-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1.1-.2-1.7-.3-2.1-.2-.5-.4-.9-.8-1.3s-.8-.6-1.3-.8c-.4-.1-1-.3-2.1-.3-1.2-.1-1.6-.1-4.7-.1zm0 3.7a4.1 4.1 0 1 1 0 8.2 4.1 4.1 0 0 1 0-8.2zm0 6.8a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4zm5.2-7a1 1 0 1 1-1.9 0 1 1 0 0 1 1.9 0z" },
  { label: "Twitter", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { label: "YouTube", path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z" },
  { label: "LinkedIn", path: "M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM3.56 20.45h3.56V9H3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 border-t border-white/5 bg-ink-950/80">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-24 h-24 bg-gradient-to-b from-transparent to-ink-950/80"
      />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow">
                <Sparkles size={20} strokeWidth={2.5} />
              </div>
              <div>
                <span className="font-display text-xl font-bold text-white">Top Shelf Exotics</span>
                <p className="text-[10px] uppercase tracking-[0.2em] text-ink-300">premium dispensary</p>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-300">
              Curated premium objects for considered lives. Free express shipping, 30-day returns, and white-glove support on every order.
            </p>
            <div className="mt-6 space-y-2 text-sm text-ink-300">
              <p className="flex items-center gap-2"><Mail size={14} className="text-accent-300" /> hello@topshelffarms.com</p>
              <p className="flex items-center gap-2"><Phone size={14} className="text-accent-300" /> +1 (800) 555-0192</p>
              <p className="flex items-center gap-2"><MapPin size={14} className="text-accent-300" /> Brooklyn · NY · USA</p>
            </div>
            <div className="mt-6 flex gap-2">
              {socials.map((s, i) => (
                <motion.a
                  key={i}
                  href={`https://${s.label.toLowerCase()}.com`}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-ink-200 transition hover:border-accent-400/40 hover:text-accent-300"
                  aria-label={s.label}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.path} />
                  </svg>
                </motion.a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title} className="lg:col-span-2">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-widest text-white">
                {col.title}
              </h4>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-sm text-ink-300 transition hover:text-accent-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-start gap-4 border-t border-white/5 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-ink-400">
            © 2026 Top Shelf Exotics Inc. All rights reserved. Crafted with care in California.
          </p>
          <p className="text-[10px] text-ink-500 max-w-2xl mx-auto mt-3 leading-relaxed">
            This product contains cannabis. For use only by adults 21 years and older. Keep out of reach of children. Products have not been evaluated by the FDA.
          </p>
          <div className="flex items-center gap-3">
            <span className="chip">Visa</span>
            <span className="chip">Mastercard</span>
            <span className="chip">Amex</span>
            <span className="chip">Apple Pay</span>
            <span className="chip">PayPal</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
