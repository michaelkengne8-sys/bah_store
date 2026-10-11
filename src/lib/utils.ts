export function cn(...args: unknown[]): string {
  return args
    .flat()
    .filter(Boolean)
    .filter((c) => typeof c === "string" || typeof c === "number")
    .join(" ");
}

export function formatPrice(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function discountPercent(price: number, originalPrice: number): number {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}