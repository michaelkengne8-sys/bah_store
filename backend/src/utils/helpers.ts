export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function generateSlug(baseSlug: string, existingSlugs: string[]): string {
  let slug = slugify(baseSlug);
  let counter = 1;

  while (existingSlugs.includes(slug)) {
    slug = `${slugify(baseSlug)}-${counter}`;
    counter++;
  }

  return slug;
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

export function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ORD-${timestamp}-${random}`;
}

export function calculateDiscount(originalPrice: number, salePrice: number): number {
  if (originalPrice <= 0) return 0;
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function getStockStatus(stock: number, lowStockThreshold = 10): 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK' {
  if (stock <= 0) return 'OUT_OF_STOCK';
  if (stock <= lowStockThreshold) return 'LOW_STOCK';
  return 'IN_STOCK';
}