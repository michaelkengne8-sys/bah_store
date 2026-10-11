import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  Globe,
  Mail,
  CreditCard,
  Truck,
  Receipt,
  Bell,
  Zap,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Search,
  FileText,
  Users,
  Smartphone,
  HelpCircle,
  Plus,
  XCircle,
  BarChart3,
  DollarSign,
  Send,
  Bitcoin,
  Apple,
  AlertTriangle,
} from "lucide-react";
import { adminSettings } from "../data/adminMockData";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useStore } from "../context/StoreContext";

const tabs = [
  { id: "general", label: "General", icon: Settings, description: "Store name, contact info, currency, timezone" },
  { id: "seo", label: "SEO", icon: Search, description: "Default titles, descriptions, robots.txt" },
  { id: "email", label: "Email", icon: Mail, description: "SMTP settings, email templates" },
  { id: "payments", label: "Payments", icon: CreditCard, description: "Stripe, PayPal, CashApp, Zelle, Crypto, Apple Pay" },
  { id: "shipping", label: "Shipping", icon: Truck, description: "Zones, rates, free shipping thresholds" },
  { id: "tax", label: "Tax", icon: Receipt, description: "Tax rates by country and state" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Email triggers, admin notifications" },
  { id: "integrations", label: "Integrations", icon: Zap, description: "Analytics, pixels, webhooks" },
];

const generalSchema = z.object({
  storeName: z.string().min(1, "Store name is required"),
  contactEmail: z.string().email("Invalid email address"),
  currency: z.string().min(3, "Currency code required"),
  timezone: z.string().min(1, "Timezone required"),
  maintenanceMode: z.boolean(),
  maintenanceMessage: z.string().optional(),
});

const seoSchema = z.object({
  defaultTitle: z.string().max(60, "Title should be under 60 characters"),
  defaultDescription: z.string().max(160, "Description should be under 160 characters"),
  ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  robotsTxt: z.string().optional(),
});

const emailSchema = z.object({
  smtpHost: z.string().min(1, "SMTP host required"),
  smtpPort: z.number().min(1).max(65535),
  smtpUser: z.string().min(1, "SMTP user required"),
  smtpPass: z.string().min(1, "SMTP password required"),
  fromEmail: z.string().email("Invalid from email"),
  fromName: z.string().min(1, "From name required"),
  templates: z.object({
    orderConfirmation: z.string().optional(),
    shippingConfirmation: z.string().optional(),
    passwordReset: z.string().optional(),
  }).optional(),
});

const cryptoNetworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  symbol: z.string(),
  enabled: z.boolean(),
  walletAddress: z.string().optional(),
  contractAddress: z.string().optional(),
  decimals: z.number().optional(),
});

const paymentMethodBaseSchema = z.object({
  enabled: z.boolean(),
  testMode: z.boolean().optional(),
});

// Stripe
const stripeSchema = paymentMethodBaseSchema.extend({
  type: z.literal("stripe"),
  stripePublishableKey: z.string().optional(),
  stripeSecretKey: z.string().optional(),
  stripeWebhookSecret: z.string().optional(),
});

// PayPal
const paypalSchema = paymentMethodBaseSchema.extend({
  type: z.literal("paypal"),
  paypalClientId: z.string().optional(),
  paypalSecret: z.string().optional(),
});

// CashApp
const cashappSchema = paymentMethodBaseSchema.extend({
  type: z.literal("cashapp"),
  cashappUsername: z.string().optional(),
  cashappBusinessName: z.string().optional(),
});

// Zelle
const zelleSchema = paymentMethodBaseSchema.extend({
  type: z.literal("zelle"),
  zelleEmail: z.string().optional(),
  zellePhone: z.string().optional(),
  zelleBankName: z.string().optional(),
});

// Crypto
const cryptoSchema = paymentMethodBaseSchema.extend({
  type: z.literal("crypto"),
  cryptoNetworks: z.array(cryptoNetworkSchema).optional(),
  cryptoWalletAddresses: z.record(z.string(), z.string()).optional(),
});

// Apple Pay
const applePaySchema = paymentMethodBaseSchema.extend({
  type: z.literal("apple_pay"),
  applePayMerchantId: z.string().optional(),
  applePayCertificate: z.string().optional(),
});

const paymentsSchema = z.object({
  stripe: stripeSchema,
  paypal: paypalSchema,
  cashapp: cashappSchema,
  zelle: zelleSchema,
  crypto: cryptoSchema,
  apple_pay: applePaySchema,
});

const shippingZoneSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Zone name required"),
  countries: z.array(z.string()),
  rate: z.number().min(0),
  freeShippingThreshold: z.number().min(0).optional(),
});

const shippingSchema = z.object({
  freeShippingThreshold: z.number().min(0),
  defaultRate: z.number().min(0),
  zones: z.array(shippingZoneSchema),
});

const taxRateSchema = z.object({
  id: z.string(),
  country: z.string().min(2, "Country code required"),
  state: z.string().optional(),
  rate: z.number().min(0).max(1),
  name: z.string().min(1, "Tax name required"),
});

const taxSchema = z.object({
  pricesIncludeTax: z.boolean(),
  rates: z.array(taxRateSchema),
});

const notificationsSchema = z.object({
  newOrderEmail: z.boolean(),
  lowStockEmail: z.boolean(),
  lowStockThreshold: z.number().min(0),
  newUserEmail: z.boolean(),
  adminEmails: z.array(z.string().email("Invalid admin email")),
});

const integrationsSchema = z.object({
  gaMeasurementId: z.string().optional(),
  fbPixelId: z.string().optional(),
  tiktokPixelId: z.string().optional(),
  webhookUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type GeneralFormData = z.infer<typeof generalSchema>;
type SEOFormData = z.infer<typeof seoSchema>;
type EmailFormData = z.infer<typeof emailSchema>;
type PaymentsFormData = z.infer<typeof paymentsSchema>;
type ShippingFormData = z.infer<typeof shippingSchema>;
type TaxFormData = z.infer<typeof taxSchema>;
type NotificationsFormData = z.infer<typeof notificationsSchema>;
type IntegrationsFormData = z.infer<typeof integrationsSchema>;

const currencyOptions = [
  { value: "USD", label: "USD - US Dollar ($)" },
  { value: "EUR", label: "EUR - Euro (€)" },
  { value: "GBP", label: "GBP - British Pound (£)" },
  { value: "CAD", label: "CAD - Canadian Dollar (CA$)" },
  { value: "AUD", label: "AUD - Australian Dollar (A$)" },
  { value: "JPY", label: "JPY - Japanese Yen (¥)" },
];

const timezoneOptions = [
  "America/Los_Angeles",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "UTC",
];

const countryOptions = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "DE", label: "Germany" },
  { value: "FR", label: "France" },
  { value: "IT", label: "Italy" },
  { value: "ES", label: "Spain" },
  { value: "NL", label: "Netherlands" },
  { value: "AU", label: "Australia" },
  { value: "JP", label: "Japan" },
  { value: "*", label: "Rest of World" },
];

const stateOptions = [
  { value: "CA", label: "California" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
  { value: "FL", label: "Florida" },
  { value: "IL", label: "Illinois" },
];

export default function AdminSettings() {
  const { pushToast } = useStore();
  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ tab: string; success: boolean } | null>(null);

  // Forms for each tab
  const generalForm = useForm<GeneralFormData>({
    resolver: zodResolver(generalSchema),
    defaultValues: adminSettings.general,
  });

  const maintenanceMode = useWatch({ control: generalForm.control, name: "maintenanceMode" });

  const seoForm = useForm<SEOFormData>({
    resolver: zodResolver(seoSchema),
    defaultValues: adminSettings.seo,
  });

  const seoDefaultTitle = useWatch({ control: seoForm.control, name: "defaultTitle", defaultValue: "" });
  const seoDefaultDescription = useWatch({ control: seoForm.control, name: "defaultDescription", defaultValue: "" });
  const seoOgImage = useWatch({ control: seoForm.control, name: "ogImage", defaultValue: "" });

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: adminSettings.email,
  });

  const paymentsForm = useForm<PaymentsFormData>({
    resolver: zodResolver(paymentsSchema),
    defaultValues: adminSettings.payments,
  });

  const shippingForm = useForm<ShippingFormData>({
    resolver: zodResolver(shippingSchema),
    defaultValues: adminSettings.shipping,
  });

  const taxForm = useForm<TaxFormData>({
    resolver: zodResolver(taxSchema),
    defaultValues: adminSettings.tax,
  });

  const notificationsForm = useForm<NotificationsFormData>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: adminSettings.notifications,
  });

  const integrationsForm = useForm<IntegrationsFormData>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: adminSettings.integrations,
  });

  const getForm = (tab: string) => {
    switch (tab) {
      case "general": return generalForm;
      case "seo": return seoForm;
      case "email": return emailForm;
      case "payments": return paymentsForm;
      case "shipping": return shippingForm;
      case "tax": return taxForm;
      case "notifications": return notificationsForm;
      case "integrations": return integrationsForm;
      default: return generalForm;
    }
  };

  const handleSave = async (tab: string) => {
    const form = getForm(tab) as { trigger: (name?: string | string[], options?: Record<string, unknown>) => Promise<boolean> };
    const valid = await form.trigger(undefined, { shouldFocus: true });
    if (!valid) {
      pushToast("Please fix the errors before saving", "error");
      return;
    }

    setSaving(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      pushToast(`${tabs.find(t => t.id === tab)?.label} settings saved successfully`, "success");
      setSaveStatus({ tab, success: true });
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      pushToast("Failed to save settings", "error");
      setSaveStatus({ tab, success: false });
    } finally {
      setSaving(false);
    }
  };

  const addShippingZone = () => {
    const zones = shippingForm.getValues("zones") || [];
    const newZone = {
      id: `z${Date.now()}`,
      name: "New Zone",
      countries: [],
      rate: 10,
      freeShippingThreshold: 100,
    };
    shippingForm.setValue("zones", [...zones, newZone]);
  };

  const removeShippingZone = (index: number) => {
    const zones = shippingForm.getValues("zones") || [];
    shippingForm.setValue("zones", zones.filter((_, i) => i !== index));
  };

  const addTaxRate = () => {
    const rates = taxForm.getValues("rates") || [];
    const newRate = {
      id: `t${Date.now()}`,
      country: "US",
      state: "",
      rate: 0,
      name: "New Tax Rate",
    };
    taxForm.setValue("rates", [...rates, newRate]);
  };

  const removeTaxRate = (index: number) => {
    const rates = taxForm.getValues("rates") || [];
    taxForm.setValue("rates", rates.filter((_, i) => i !== index));
  };

  const addAdminEmail = () => {
    const emails = notificationsForm.getValues("adminEmails") || [];
    notificationsForm.setValue("adminEmails", [...emails, ""]);
  };

  const removeAdminEmail = (index: number) => {
    const emails = notificationsForm.getValues("adminEmails") || [];
    notificationsForm.setValue("adminEmails", emails.filter((_, i) => i !== index));
  };

  const ShippingZones = () => {
    const zones = shippingForm.getValues("zones") || [];
    return (
      <div className="space-y-4">
        {zones.map((zone, index) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-xl p-4 border border-white/5"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-ink-400 text-sm font-mono">
                  {index + 1}
                </div>
                <div>
                  <h4 className="font-medium text-white">Shipping Zone #{index + 1}</h4>
                </div>
              </div>
              {zones.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeShippingZone(index)}
                  className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Zone ID</label>
                <input
                  {...shippingForm.register(`zones.${index}.id`)}
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm font-mono focus:border-accent-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Zone Name *</label>
                <input
                  {...shippingForm.register(`zones.${index}.name`)}
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Rate ($)</label>
                <input
                  type="number"
                  {...shippingForm.register(`zones.${index}.rate`, { valueAsNumber: true })}
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-400 mb-1">Free Shipping Threshold</label>
                <input
                  type="number"
                  {...shippingForm.register(`zones.${index}.freeShippingThreshold`, { valueAsNumber: true })}
                  min="0"
                  step="0.01"
                  className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-ink-400 mb-1">Countries</label>
              <div className="flex flex-wrap gap-2">
                {countryOptions.map(country => (
                  <label
                    key={country.value}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition"
                  >
                    <input
                      type="checkbox"
                      {...shippingForm.register(`zones.${index}.countries`)}
                      value={country.value}
                      className="h-4 w-4 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                    />
                    <span className="text-sm text-ink-300">{country.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
        {zones.length === 0 && (
          <div className="text-center py-8 rounded-xl border-2 border-dashed border-white/10">
            <Truck className="h-12 w-12 text-ink-500 mx-auto mb-3" />
            <p className="text-ink-400">No shipping zones configured</p>
            <button type="button" onClick={addShippingZone} className="mt-3 btn-primary gap-1 inline-flex">
              <Plus className="h-4 w-4" />
              Add First Zone
            </button>
          </div>
        )}
        <button type="button" onClick={addShippingZone} className="btn-ghost gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add Shipping Zone
        </button>
      </div>
    );
  };

  const TaxRates = () => {
    const rates = taxForm.getValues("rates") || [];
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-12">#</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">ID</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Name</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Country</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">State</th>
                <th className="text-left p-4 text-xs font-semibold uppercase tracking-wider text-ink-400">Rate (%)</th>
                <th className="text-right p-4 text-xs font-semibold uppercase tracking-wider text-ink-400 w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rates.map((rate, index) => (
                <motion.tr
                  key={rate.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                >
                  <td className="p-4 text-sm text-ink-400 font-mono">{index + 1}</td>
                  <td className="p-4">
                    <input
                      {...taxForm.register(`rates.${index}.id`)}
                      className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm font-mono focus:border-accent-400 focus:outline-none"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      {...taxForm.register(`rates.${index}.name`)}
                      className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                    />
                  </td>
                  <td className="p-4">
                    <select
                      {...taxForm.register(`rates.${index}.country`)}
                      className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                    >
                      {countryOptions.filter(c => c.value !== "*").map(country => (
                        <option key={country.value} value={country.value}>{country.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <select
                      {...taxForm.register(`rates.${index}.state`)}
                      className="w-full rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                    >
                      <option value="">—</option>
                      {stateOptions.map(state => (
                        <option key={state.value} value={state.value}>{state.label}</option>
                      ))}
                    </select>
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      {...taxForm.register(`rates.${index}.rate`, { valueAsNumber: true })}
                      min="0"
                      max="1"
                      step="0.0001"
                      className="w-24 rounded-xl border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm focus:border-accent-400 focus:outline-none"
                    />
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => removeTaxRate(index)}
                      className="p-1.5 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addTaxRate} className="btn-ghost gap-2">
          <Plus className="h-4 w-4" />
          Add Tax Rate
        </button>
      </div>
    );
  };

  const TabContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6 max-w-2xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="h-5 w-5 text-accent-400" />
                Store Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Store Name *</label>
                  <input
                    {...generalForm.register("storeName")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${generalForm.formState.errors.storeName ? "border-rose-500" : "border-white/10"}`}
                  />
                  {generalForm.formState.errors.storeName && <p className="mt-1 text-sm text-rose-400">{generalForm.formState.errors.storeName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Contact Email *</label>
                  <input
                    type="email"
                    {...generalForm.register("contactEmail")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${generalForm.formState.errors.contactEmail ? "border-rose-500" : "border-white/10"}`}
                  />
                  {generalForm.formState.errors.contactEmail && <p className="mt-1 text-sm text-rose-400">{generalForm.formState.errors.contactEmail.message}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-accent-400" />
                Localization
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Currency *</label>
                  <select
                    {...generalForm.register("currency")}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  >
                    {currencyOptions.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Timezone *</label>
                  <select
                    {...generalForm.register("timezone")}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  >
                    {timezoneOptions.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-accent-400" />
                Maintenance Mode
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...generalForm.register("maintenanceMode")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="font-medium text-white">Enable Maintenance Mode</p>
                    <p className="text-sm text-ink-400">Show maintenance message to all visitors</p>
                  </div>
                </label>
                {maintenanceMode && (
                  <div>
                    <label className="block text-sm font-medium text-ink-300 mb-1">Maintenance Message</label>
                    <textarea
                      {...generalForm.register("maintenanceMessage")}
                      rows={3}
                      className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition"
                      placeholder="We're making improvements! Please check back soon."
                    />
                  </div>
                )}
              </div>
            </section>
          </div>
        );

      case "seo":
        return (
          <div className="space-y-6 max-w-3xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-accent-400" />
                Default Meta Tags
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1 flex items-center gap-1">
                    Default Title
                    <HelpCircle className="h-3.5 w-3.5 text-ink-500" aria-label="Used when page-specific title is not set. Keep under 60 characters." />
                  </label>
                  <div className="relative">
                    <input
                      {...seoForm.register("defaultTitle")}
                      maxLength={60}
                      className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition pr-20 ${seoForm.formState.errors.defaultTitle ? "border-rose-500" : seoDefaultTitle.length > 60 ? "border-amber-500" : "border-white/10"}`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 text-sm">
                      {seoDefaultTitle.length}/60
                    </span>
                  </div>
                  {seoForm.formState.errors.defaultTitle && <p className="mt-1 text-sm text-rose-400">{seoForm.formState.errors.defaultTitle.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1 flex items-center gap-1">
                    Default Description
                    <HelpCircle className="h-3.5 w-3.5 text-ink-500" aria-label="Used when page-specific description is not set. Keep under 160 characters." />
                  </label>
                  <div className="relative">
                    <textarea
                      {...seoForm.register("defaultDescription")}
                      maxLength={160}
                      rows={3}
                      className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition pr-20 ${seoForm.formState.errors.defaultDescription ? "border-rose-500" : seoDefaultDescription.length > 160 ? "border-amber-500" : "border-white/10"}`}
                    />
                    <span className="absolute bottom-2 right-3 text-ink-400 text-sm">
                      {seoDefaultDescription.length}/160
                    </span>
                  </div>
                  {seoForm.formState.errors.defaultDescription && <p className="mt-1 text-sm text-rose-400">{seoForm.formState.errors.defaultDescription.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Open Graph Image</label>
                  <input
                    type="url"
                    {...seoForm.register("ogImage")}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                    placeholder="https://example.com/og-image.jpg"
                  />
                  <p className="mt-1 text-xs text-ink-400">Recommended: 1200x630px. Used for social sharing.</p>
                  {seoOgImage && (
                    <div className="mt-2">
                      <img src={seoOgImage} alt="OG Preview" className="max-w-xs h-auto rounded-lg border border-white/10" />
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-400" />
                Robots.txt
              </h3>
              <textarea
                {...seoForm.register("robotsTxt")}
                rows={8}
                className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white font-mono text-sm placeholder:text-ink-500 focus:border-accent-400 focus:outline-none transition"
                placeholder="User-agent: *\nAllow: /\n\nSitemap: https://yourstore.com/sitemap.xml"
              />
              <p className="text-xs text-ink-400">Controls search engine crawling behavior.</p>
            </section>
          </div>
        );

      case "email":
        return (
          <div className="space-y-6 max-w-2xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Mail className="h-5 w-5 text-accent-400" />
                SMTP Configuration
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">SMTP Host *</label>
                  <input
                    {...emailForm.register("smtpHost")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${emailForm.formState.errors.smtpHost ? "border-rose-500" : "border-white/10"}`}
                    placeholder="smtp.sendgrid.net"
                  />
                  {emailForm.formState.errors.smtpHost && <p className="mt-1 text-sm text-rose-400">{emailForm.formState.errors.smtpHost.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">SMTP Port *</label>
                  <input
                    type="number"
                    {...emailForm.register("smtpPort", { valueAsNumber: true })}
                    min="1"
                    max="65535"
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${emailForm.formState.errors.smtpPort ? "border-rose-500" : "border-white/10"}`}
                    placeholder="587"
                  />
                  {emailForm.formState.errors.smtpPort && <p className="mt-1 text-sm text-rose-400">{emailForm.formState.errors.smtpPort.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">SMTP User *</label>
                  <input
                    {...emailForm.register("smtpUser")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${emailForm.formState.errors.smtpUser ? "border-rose-500" : "border-white/10"}`}
                    placeholder="apikey"
                  />
                  {emailForm.formState.errors.smtpUser && <p className="mt-1 text-sm text-rose-400">{emailForm.formState.errors.smtpUser.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">SMTP Password *</label>
                  <input
                    type="password"
                    {...emailForm.register("smtpPass")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${emailForm.formState.errors.smtpPass ? "border-rose-500" : "border-white/10"}`}
                    placeholder="••••••••"
                  />
                  {emailForm.formState.errors.smtpPass && <p className="mt-1 text-sm text-rose-400">{emailForm.formState.errors.smtpPass.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink-300 mb-1">From Email *</label>
                  <input
                    type="email"
                    {...emailForm.register("fromEmail")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${emailForm.formState.errors.fromEmail ? "border-rose-500" : "border-white/10"}`}
                    placeholder="orders@yourstore.com"
                  />
                  {emailForm.formState.errors.fromEmail && <p className="mt-1 text-sm text-rose-400">{emailForm.formState.errors.fromEmail.message}</p>}
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-ink-300 mb-1">From Name *</label>
                  <input
                    {...emailForm.register("fromName")}
                    className={`w-full rounded-xl border px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition ${emailForm.formState.errors.fromName ? "border-rose-500" : "border-white/10"}`}
                    placeholder="Your Store Name"
                  />
                  {emailForm.formState.errors.fromName && <p className="mt-1 text-sm text-rose-400">{emailForm.formState.errors.fromName.message}</p>}
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-accent-400" />
                Email Templates
              </h3>
              <p className="text-sm text-ink-400">Template IDs from your email provider (SendGrid, Mailgun, etc.)</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Order Confirmation</label>
                  <input
                    {...emailForm.register("templates.orderConfirmation")}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                    placeholder="order-confirmation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Shipping Confirmation</label>
                  <input
                    {...emailForm.register("templates.shippingConfirmation")}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                    placeholder="shipping-confirmation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Password Reset</label>
                  <input
                    {...emailForm.register("templates.passwordReset")}
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                    placeholder="password-reset"
                  />
                </div>
              </div>
            </section>
          </div>
        );

      case "payments":
        return (
          <div className="space-y-6 max-w-3xl">
            {/* Stripe */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-400" />
                  Stripe
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...paymentsForm.register("stripe.enabled")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-ink-200">Enabled</span>
                </label>
              </div>
              {paymentsForm.watch("stripe.enabled") && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-in">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...paymentsForm.register("stripe.testMode")}
                      className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                    />
                    <span className="text-sm text-ink-200">Test Mode</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Publishable Key</label>
                      <input
                        {...paymentsForm.register("stripe.stripePublishableKey")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white font-mono text-sm focus:border-accent-400 focus:outline-none transition"
                        placeholder="pk_test_••••••••••••••••••••••••"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Secret Key</label>
                      <input
                        type="password"
                        {...paymentsForm.register("stripe.stripeSecretKey")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white font-mono text-sm focus:border-accent-400 focus:outline-none transition"
                        placeholder="sk_test_••••••••••••••••••••••••"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-ink-300 mb-1">Webhook Secret</label>
                      <input
                        {...paymentsForm.register("stripe.stripeWebhookSecret")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white font-mono text-sm focus:border-accent-400 focus:outline-none transition"
                        placeholder="whsec_••••••••••••••••••••••••"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* PayPal */}
            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-accent-400" />
                  PayPal
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...paymentsForm.register("paypal.enabled")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-ink-200">Enabled</span>
                </label>
              </div>
              {paymentsForm.watch("paypal.enabled") && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Client ID</label>
                      <input
                        {...paymentsForm.register("paypal.paypalClientId")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="Your PayPal Client ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Secret</label>
                      <input
                        type="password"
                        {...paymentsForm.register("paypal.paypalSecret")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="Your PayPal Secret"
                      />
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* CashApp */}
            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-accent-400" />
                  CashApp
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...paymentsForm.register("cashapp.enabled")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-ink-200">Enabled</span>
                </label>
              </div>
              {paymentsForm.watch("cashapp.enabled") && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Cashtag (Username)</label>
                      <input
                        {...paymentsForm.register("cashapp.cashappUsername")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="$yourbusiness"
                      />
                      <p className="mt-1 text-xs text-ink-400">Your CashApp username (e.g., $TopShelfFarm)</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Business Name</label>
                      <input
                        {...paymentsForm.register("cashapp.cashappBusinessName")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="Top Shelf Exotics"
                      />
                      <p className="mt-1 text-xs text-ink-400">Display name for customers</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Zelle */}
            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Send className="h-5 w-5 text-accent-400" />
                  Zelle
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...paymentsForm.register("zelle.enabled")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-ink-200">Enabled</span>
                </label>
              </div>
              {paymentsForm.watch("zelle.enabled") && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-in">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Email</label>
                      <input
                        type="email"
                        {...paymentsForm.register("zelle.zelleEmail")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="payments@topshelffarms.com"
                      />
                      <p className="mt-1 text-xs text-ink-400">Zelle registered email</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Phone</label>
                      <input
                        type="tel"
                        {...paymentsForm.register("zelle.zellePhone")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="+1 (555) 123-4567"
                      />
                      <p className="mt-1 text-xs text-ink-400">Zelle registered phone</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Bank Name</label>
                      <input
                        {...paymentsForm.register("zelle.zelleBankName")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                        placeholder="Chase Bank"
                      />
                      <p className="mt-1 text-xs text-ink-400">Your bank for Zelle</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Crypto */}
            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Bitcoin className="h-5 w-5 text-accent-400" />
                  Crypto Payments
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...paymentsForm.register("crypto.enabled")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-ink-200">Enabled</span>
                </label>
              </div>
              {paymentsForm.watch("crypto.enabled") && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-in">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...paymentsForm.register("crypto.testMode")}
                      className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                    />
                    <span className="text-sm text-ink-200">Test Mode (Testnet)</span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-ink-300 mb-2">Enabled Networks</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      {[
                        { id: "bitcoin", name: "Bitcoin", symbol: "BTC", decimals: 8 },
                        { id: "ethereum", name: "Ethereum", symbol: "ETH", decimals: 18 },
                        { id: "usdc", name: "USDC", symbol: "USDC", decimals: 6 },
                        { id: "usdt", name: "USDT", symbol: "USDT", decimals: 6 },
                      ].map((network) => (
                        <div key={network.id} className="glass-strong rounded-xl p-3 border border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              {...paymentsForm.register(`crypto.cryptoNetworks.${["bitcoin", "ethereum", "usdc", "usdt"].indexOf(network.id)}.enabled`)}
                              className="h-4 w-4 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                            />
                            <span className="font-medium text-white">{network.name} ({network.symbol})</span>
                          </div>
                          <input
                            {...paymentsForm.register(`crypto.cryptoNetworks.${["bitcoin", "ethereum", "usdc", "usdt"].indexOf(network.id)}.walletAddress`)}
                            className="w-full rounded-lg border border-white/10 px-3 py-2 bg-ink-800/50 text-white text-sm font-mono focus:border-accent-400 focus:outline-none transition"
                            placeholder={`Wallet address for ${network.symbol}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Apple Pay */}
            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Apple className="h-5 w-5 text-accent-400" />
                  Apple Pay
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    {...paymentsForm.register("apple_pay.enabled")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="text-sm text-ink-200">Enabled</span>
                </label>
              </div>
              {paymentsForm.watch("apple_pay.enabled") && (
                <div className="space-y-4 border-t border-white/5 pt-4 animate-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Merchant ID</label>
                      <input
                        {...paymentsForm.register("apple_pay.applePayMerchantId")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white font-mono text-sm focus:border-accent-400 focus:outline-none transition"
                        placeholder="merchant.com.topshelffarms"
                      />
                      <p className="mt-1 text-xs text-ink-400">Apple Merchant Identifier</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-ink-300 mb-1">Certificate</label>
                      <input
                        type="password"
                        {...paymentsForm.register("apple_pay.applePayCertificate")}
                        className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white font-mono text-sm focus:border-accent-400 focus:outline-none transition"
                        placeholder="Apple Pay Certificate"
                      />
                      <p className="mt-1 text-xs text-ink-400">Payment processing certificate</p>
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        );

      case "shipping":
        return (
          <div className="space-y-6 max-w-4xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Truck className="h-5 w-5 text-accent-400" />
                General Settings
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Free Shipping Threshold ($)</label>
                  <input
                    type="number"
                    {...shippingForm.register("freeShippingThreshold", { valueAsNumber: true })}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-ink-300 mb-1">Default Shipping Rate ($)</label>
                  <input
                    type="number"
                    {...shippingForm.register("defaultRate", { valueAsNumber: true })}
                    min="0"
                    step="0.01"
                    className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-accent-400" />
                  Shipping Zones
                </h3>
                <button type="button" onClick={addShippingZone} className="btn-primary gap-1 text-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Zone
                </button>
              </div>
              <ShippingZones />
            </section>
          </div>
        );

      case "tax":
        return (
          <div className="space-y-6 max-w-4xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Receipt className="h-5 w-5 text-accent-400" />
                General Settings
              </h3>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...taxForm.register("pricesIncludeTax")}
                  className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                />
                <div>
                  <p className="font-medium text-white">Prices Include Tax</p>
                  <p className="text-sm text-ink-400">Product prices already contain tax (VAT/GST)</p>
                </div>
              </label>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-accent-400" />
                  Tax Rates
                </h3>
                <button type="button" onClick={addTaxRate} className="btn-primary gap-1 text-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Rate
                </button>
              </div>
              <TaxRates />
            </section>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6 max-w-2xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Bell className="h-5 w-5 text-accent-400" />
                Email Notifications
              </h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                  <input
                    type="checkbox"
                    {...notificationsForm.register("newOrderEmail")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="font-medium text-white">New Order Emails</p>
                    <p className="text-sm text-ink-400">Send notification to admin emails when a new order is placed</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                  <input
                    type="checkbox"
                    {...notificationsForm.register("lowStockEmail")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="font-medium text-white">Low Stock Alerts</p>
                    <p className="text-sm text-ink-400">Notify admins when product stock falls below threshold</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-xl bg-white/5 hover:bg-white/10 transition">
                  <input
                    type="checkbox"
                    {...notificationsForm.register("newUserEmail")}
                    className="h-5 w-5 rounded border-white/20 bg-ink-800 text-accent-500 focus:ring-accent-500"
                  />
                  <div>
                    <p className="font-medium text-white">New User Registration</p>
                    <p className="text-sm text-ink-400">Send notification when a new customer creates an account</p>
                  </div>
                </label>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-accent-400" />
                Low Stock Threshold
              </h3>
              <input
                type="number"
                {...notificationsForm.register("lowStockThreshold", { valueAsNumber: true })}
                min="0"
                className="w-32 rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
              />
              <p className="text-sm text-ink-400">Trigger low stock alert when variant quantity reaches this number</p>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-accent-400" />
                  Admin Email Recipients
                </h3>
                <button type="button" onClick={addAdminEmail} className="btn-primary gap-1 text-sm">
                  <Plus className="h-3.5 w-3.5" />
                  Add Email
                </button>
              </div>
              <div className="space-y-2">
                {((notificationsForm.getValues("adminEmails") || []) as string[]).map((_email, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="email"
                      {...notificationsForm.register(`adminEmails.${index}`)}
                      className="flex-1 rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                      placeholder="admin@example.com"
                    />
                    {(notificationsForm.getValues("adminEmails") || []).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeAdminEmail(index)}
                        className="p-2 rounded-lg text-ink-400 hover:bg-white/5 hover:text-rose-400 transition"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        );

      case "integrations":
        return (
          <div className="space-y-6 max-w-2xl">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-accent-400" />
                Google Analytics
              </h3>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Measurement ID</label>
                <input
                  {...integrationsForm.register("gaMeasurementId")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  placeholder="G-XXXXXXXXXX"
                />
                <p className="mt-1 text-xs text-ink-400">Google Analytics 4 Measurement ID</p>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-accent-400" />
                Facebook Pixel
              </h3>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Pixel ID</label>
                <input
                  {...integrationsForm.register("fbPixelId")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  placeholder="123456789012345"
                />
                <p className="mt-1 text-xs text-ink-400">Facebook/Meta Pixel ID for conversion tracking</p>
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-accent-400" />
                TikTok Pixel
              </h3>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Pixel ID</label>
                <input
                  {...integrationsForm.register("tiktokPixelId")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  placeholder="Your TikTok Pixel ID"
                />
              </div>
            </section>

            <section className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-accent-400" />
                Webhooks
              </h3>
              <div>
                <label className="block text-sm font-medium text-ink-300 mb-1">Webhook URL</label>
                <input
                  type="url"
                  {...integrationsForm.register("webhookUrl")}
                  className="w-full rounded-xl border border-white/10 px-4 py-3 bg-ink-800/50 text-white focus:border-accent-400 focus:outline-none transition"
                  placeholder="https://yourstore.com/webhooks"
                />
                <p className="mt-1 text-xs text-ink-400">Receive real-time events (orders, customers, etc.)</p>
              </div>
            </section>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-ink-400 mt-1">Configure your store settings and integrations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleSave(activeTab)}
            disabled={saving}
            className="btn-primary gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </motion.div>

      {/* Save Status Toast */}
      <AnimatePresence>
        {saveStatus && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`glass-strong rounded-xl p-4 border ${saveStatus.success ? "border-accent-500/30" : "border-rose-500/30"}`}
          >
            <div className="flex items-center gap-3">
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${saveStatus.success ? "bg-accent-500/20 text-accent-400" : "bg-rose-500/20 text-rose-400"}`}>
                {saveStatus.success ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div>
                <p className="font-medium text-white">
                  {saveStatus.success ? "Settings saved successfully" : "Failed to save settings"}
                </p>
                <p className="text-sm text-ink-400">
                  {tabs.find(t => t.id === saveStatus.tab)?.label} settings {saveStatus.success ? "have been updated" : "could not be saved"}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <nav className="glass-strong rounded-2xl overflow-hidden sticky top-24 h-fit" role="navigation" aria-label="Settings navigation">
            <div className="p-4 border-b border-white/5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-400">Settings</h3>
            </div>
            <div className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${activeTab === tab.id
                    ? "bg-gradient-to-r from-accent-500/10 to-accent-500/5 text-accent-300 border border-accent-500/20"
                    : "text-ink-300 hover:text-white hover:bg-white/5"}`}
                >
                  <tab.icon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left">{tab.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </motion.aside>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-3"
        >
          <div className="glass-strong rounded-2xl overflow-hidden">
            <div className="border-b border-white/5 p-4 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5">
                  {(() => { const TabIcon = tabs.find(t => t.id === activeTab)?.icon; return TabIcon ? <TabIcon className="h-5 w-5 text-accent-400" /> : null; })()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-white">{tabs.find(t => t.id === activeTab)?.label}</h2>
                  <p className="text-sm text-ink-400">{tabs.find(t => t.id === activeTab)?.description}</p>
                </div>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={(e) => { e.preventDefault(); handleSave(activeTab); }}>
                <TabContent />
                <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}