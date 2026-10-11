import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, MapPin, Phone, MessageSquare, Loader2, Send, Clock } from "lucide-react";
import { useStore } from "../context/StoreContext";
import { CONTACT_BASE } from "../lib/config";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  subject: z.string().min(3, "Subject must be at least 3 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

const contactMethods = [
  { icon: Mail, label: "Email", value: "hello@topshelffarms.com", href: "mailto:hello@topshelffarms.com" },
  { icon: Phone, label: "Phone", value: "+1 (800) 555-0192", href: "tel:+18005550192" },
  { icon: MapPin, label: "Location", value: "Brooklyn, NY, USA" },
  { icon: Clock, label: "Hours", value: "Mon-Fri, 9AM - 6PM EST" },
];

const supportTopics = [
  "Order Status",
  "Shipping & Delivery",
  "Returns & Refunds",
  "Product Questions",
  "Account Support",
  "Partnership Inquiry",
  "Press & Media",
  "Other",
];

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { pushToast } = useStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(CONTACT_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to send message");
      pushToast("Message sent! Check your email for a confirmation.", "success");
      reset();
    } catch {
      pushToast("Failed to send message. Please try again later.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center mb-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow mb-6">
            <MessageSquare size={32} strokeWidth={2} />
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Contact Us</h1>
          <p className="mt-3 text-ink-300 text-lg">
            We are here to help. Reach out and our team will respond within 24 hours.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2 space-y-4">
            {contactMethods.map((method) => {
              const Icon = method.icon;
              const isLink = method.href !== undefined;
              const content = (
                <div className="surface rounded-3xl p-5 flex items-center gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-400/20 to-accent-600/10 text-accent-400">
                    <Icon size={22} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-ink-400">{method.label}</p>
                    <p className="text-sm font-medium text-white mt-0.5">{method.value}</p>
                  </div>
                </div>
              );
              return isLink ? (
                <a key={method.label} href={method.href} className="block transition hover:scale-[1.02]">
                  {content}
                </a>
              ) : (
                <div key={method.label}>{content}</div>
              );
            })}
          </div>

          <div className="lg:col-span-3 surface rounded-3xl p-8">
            <h2 className="font-display text-2xl font-bold text-white mb-2">Send us a message</h2>
            <p className="text-ink-300 text-sm mb-6">Fill out the form below and we will get back to you as soon as possible.</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-ink-200 mb-2">
                    Full name
                  </label>
                  <input
                    {...register("name")}
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      errors.name
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isSubmitting}
                  />
                  {errors.name && <p className="mt-1.5 text-sm text-rose-400">{errors.name.message}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-ink-200 mb-2">
                    Email address
                  </label>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                      errors.email
                        ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                        : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                    } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                    disabled={isSubmitting}
                  />
                  {errors.email && <p className="mt-1.5 text-sm text-rose-400">{errors.email.message}</p>}
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-ink-200 mb-2">
                  Subject
                </label>
                <select
                  {...register("subject")}
                  id="subject"
                  className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition ${
                    errors.subject
                      ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                  } text-white focus:outline-none focus:ring-2`}
                  disabled={isSubmitting}
                >
                  <option value="" className="bg-ink-950">Select a topic</option>
                  {supportTopics.map((topic) => (
                    <option key={topic} value={topic} className="bg-ink-950">
                      {topic}
                    </option>
                  ))}
                </select>
                {errors.subject && <p className="mt-1.5 text-sm text-rose-400">{errors.subject.message}</p>}
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-ink-200 mb-2">
                  Message
                </label>
                <textarea
                  {...register("message")}
                  id="message"
                  rows={5}
                  placeholder="How can we help you?"
                  className={`w-full px-4 py-3 rounded-xl bg-ink-800/50 border transition resize-y min-h-[120px] ${
                    errors.message
                      ? "border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20"
                      : "border-white/5 focus:border-accent-400/50 focus:ring-accent-400/20"
                  } text-white placeholder:text-ink-400 focus:outline-none focus:ring-2`}
                  disabled={isSubmitting}
                />
                {errors.message && <p className="mt-1.5 text-sm text-rose-400">{errors.message.message}</p>}
              </div>

              <motion.button
                type="submit"
                disabled={isSubmitting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-3.5 rounded-xl font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                  isSubmitting
                    ? "bg-white/5 text-ink-300"
                    : "bg-gradient-to-r from-accent-400 to-accent-600 text-ink-950 hover:from-accent-300 hover:to-accent-500"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    Send Message
                  </>
                )}
              </motion.button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
