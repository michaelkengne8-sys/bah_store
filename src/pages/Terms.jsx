import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Scale } from "lucide-react";

const sections = [
  {
    title: "Acceptance of Terms",
    content:
      "By accessing or using Top Shelf Exotics's website, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not access our services. These terms constitute a legally binding agreement between you and Top Shelf Exotics Inc.",
  },
  {
    title: "Account Registration",
    content:
      "You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You must provide accurate, current, and complete information during registration. We reserve the right to suspend or terminate accounts that violate our terms or provide false information.",
  },
  {
    title: "Orders and Payments",
    content:
      "All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order for any reason, including pricing errors or stock limitations. Payment is due at the time of purchase. Prices are listed in USD and do not include applicable taxes or shipping costs, which will be calculated at checkout.",
  },
  {
    title: "Shipping and Delivery",
    content:
      "We offer free express shipping on all orders within the continental United States. Delivery times are estimates and not guaranteed. Risk of loss passes to you upon delivery. International orders may be subject to customs duties and taxes, which are your responsibility.",
  },
  {
    title: "Returns and Refunds",
    content:
      "We offer a 30-day return policy from the date of delivery. Items must be unused, in original packaging, and accompanied by proof of purchase. Refunds are processed within 5-10 business days after we receive the returned item. Certain items, including personalized products and final sale items, are not eligible for return.",
  },
  {
    title: "Intellectual Property",
    content:
      "All content on this website, including text, graphics, logos, product images, and software, is the property of Top Shelf Exotics Inc. and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express written consent.",
  },
  {
    title: "Limitation of Liability",
    content:
      "Top Shelf Exotics Inc. shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or services. Our total liability for any claim shall not exceed the amount paid by you for the product giving rise to the claim. Some jurisdictions do not allow certain limitations of liability.",
  },
  {
    title: "Changes to Terms",
    content:
      "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after any modifications indicates your acceptance of the updated terms. We encourage you to review these terms periodically.",
  },
];

export default function Terms() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-7xl px-4 pb-24 pt-10 sm:px-6 lg:px-8"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 text-ink-950 shadow-glow mb-6">
            <Scale size={32} strokeWidth={2} />
          </div>
          <h1 className="font-display text-4xl font-bold text-white">Terms of Service</h1>
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
            Questions about our terms?{" "}
            <Link to="/contact" className="text-accent-400 hover:text-accent-300 underline">
              Get in touch
            </Link>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
