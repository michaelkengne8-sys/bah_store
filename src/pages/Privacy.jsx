import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const sections = [
  {
    title: "Information We Collect",
    content:
      "We collect information you provide directly to us, such as your name, email address, shipping address, payment information, and preferences when you create an account, place an order, or contact our support team. We also automatically collect certain information when you visit our site, including your IP address, browser type, device information, and browsing behavior through cookies and similar technologies.",
  },
  {
    title: "How We Use Your Information",
    content:
      "We use your information to process and fulfill your orders, communicate with you about your purchases, provide customer support, send you marketing communications (with your consent), improve our products and services, and detect and prevent fraud. We process your information based on legitimate business interests, contractual necessity, and your consent where required.",
  },
  {
    title: "Information Sharing",
    content:
      "We do not sell your personal information to third parties. We may share your information with trusted service providers who assist us in operating our website, processing payments, shipping orders, and analyzing customer behavior. These partners are contractually bound to protect your data and use it only for the purposes we specify.",
  },
  {
    title: "Data Security",
    content:
      "We implement industry-standard security measures including SSL encryption, secure payment gateways, and regular security audits to protect your personal information. Your payment data is encrypted and never stored on our servers. We adhere to PCI DSS compliance standards for all payment processing.",
  },
  {
    title: "Your Rights",
    content:
      "You have the right to access, correct, or delete your personal information at any time through your account settings. You may also opt out of marketing communications, request a copy of your data, or restrict certain processing activities. To exercise these rights, please contact our privacy team.",
  },
  {
    title: "Cookies",
    content:
      "We use essential cookies to ensure our website functions properly, along with analytics and preference cookies to enhance your experience. You can manage your cookie preferences through your browser settings at any time. Disabling certain cookies may affect the functionality of our site.",
  },
  {
    title: "Contact Us",
    content:
      "If you have any questions about this Privacy Policy or our data practices, please contact our Data Protection Officer at privacy@topshelffarms.com or write to us at Top Shelf Exotics Inc., 420 Greenleaf Ave, Los Angeles, CA 90036, USA.",
  },
];

export default function Privacy() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow mb-6">
            <Shield size={32} strokeWidth={2} />
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Privacy Policy</h1>
          <p className="mt-3 text-ink-300 text-lg">Last updated: June 1, 2026</p>
        </div>

        <div className="surface rounded-3xl p-8 sm:p-10 space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-xl font-semibold text-white mb-3">{section.title}</h2>
              <p className="text-ink-300 leading-relaxed">{section.content}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-ink-400 text-sm">
            Have questions about your privacy?{" "}
            <Link to="/contact" className="text-accent-400 hover:text-accent-300 underline">
              Contact our support team
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
