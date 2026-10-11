import type { Category, Product, Review, FAQ, SearchSuggestion } from "../types";

export const DATA_VERSION = 2;

export const categories: Category[] = [
  {
    id: "flower",
    name: "Flower",
    tagline: "Premium craft cannabis",
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_e2198b12-63a6-4a55-98f7-6a19f98931d5.png?v=1780766561",
    count: 12,
  },
  {
    id: "apparel",
    name: "Tees & Tanks",
    tagline: "Stonerdays collab",
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Razz_Detail_4.png?v=1752595029",
    count: 5,
  },
  {
    id: "snapbacks",
    name: "Snapbacks",
    tagline: "seedleSs. collab",
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/GumboLiciousLeft2_ebfbcb6b-0707-4211-acf4-897da26f5b4f.png?v=1766299479",
    count: 5,
  },
  {
    id: "smokeware",
    name: "Papers & Smokeware",
    tagline: "Cali by VIBES",
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_756cf69a-cfcb-4e8f-82ff-f484e61cc706.jpg?v=1766308715",
    count: 8,
  },
  {
    id: "packs",
    name: "Packs & Bundles",
    tagline: "Limited edition bundles",
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/X_34.png?v=1756851273",
    count: 4,
  },
  {
    id: "accessories",
    name: "Accessories",
    tagline: "Elevate your session",
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VIBES_artwork_1.png?v=1766302633",
    count: 6,
  },
];

export const products: Product[] = [
  {
    id: "p1",
    title: "Jokerz Runtz 24.6% THC",
    description: "Indica-dominant hybrid with candy-forward citrus and creamy depth over earthy funk. Dense frosty buds with dark green and purple tones. Aromas of floral citrus, creamy gas, and light pepper.",
    price: 26,
    originalPrice: 32,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_e2198b12-63a6-4a55-98f7-6a19f98931d5.png?v=1780766561",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_c82b1c26-255b-4fd2-9134-e454cf6835d9.jpg?v=1781033880",
    rating: 4.9,
    reviews: 423,
    badge: "Best Seller",
    category: "flower",
    stock: "in_stock",
    colors: [],
    brand: "TSE Genetics",
  },
  {
    id: "p2",
    title: "Sweet N Sour Og 20% THC",
    description: "Citrus-forward hybrid with sweet berry brightness over earthy diesel and sour funk. Dense frosty buds with a sharp sweet-meets-gas profile. Aromas of sour citrus, diesel, and earthy skunk.",
    price: 26,
    originalPrice: 26,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_3261b7dc-77ba-4fa2-a674-ac11e2e2688a.png?v=1783699083",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_2198579c-11cd-4b3a-9e3d-ef3851231060.jpg?v=1783699730",
    rating: 4.8,
    reviews: 287,
    badge: "New",
    category: "flower",
    stock: "in_stock",
    colors: [],
    brand: "TSE Genetics",
  },
  {
    id: "p3",
    title: "Blue Razz Tee",
    description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Where fire flower meets street legend. Premium cotton tee with custom Blue Razz graphic.",
    price: 35,
    originalPrice: 45,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Razz_Detail_4.png?v=1752595029",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Razz_Detail_4.png?v=1752595029",
    rating: 4.7,
    reviews: 156,
    badge: "New",
    category: "apparel",
    stock: "in_stock",
    colors: [],
    brand: "Stonerdays",
  },
  {
    id: "p4",
    title: "Blue Runtz Tee",
    description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tee featuring the Blue Runtz design. Street legend meets fire flower.",
    price: 35,
    originalPrice: 45,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Runtz_Detail_3.png?v=1752594967",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Runtz_Detail_3.png?v=1752594967",
    rating: 4.6,
    reviews: 134,
    badge: "New",
    category: "apparel",
    stock: "in_stock",
    colors: [],
    brand: "Stonerdays",
  },
  {
    id: "p5",
    title: "Pink Rosay Tee",
    description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tee with custom Pink Rozay graphic. Streetwear meets top-shelf culture.",
    price: 35,
    originalPrice: 45,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Pink_Rozay_Details_4_1.png?v=1752595058",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Pink_Rozay_Details_4_1.png?v=1752595058",
    rating: 4.8,
    reviews: 98,
    badge: "Limited",
    category: "apparel",
    stock: "low_stock",
    colors: [],
    brand: "Stonerdays",
  },
  {
    id: "p6",
    title: "Red Runtz Tee",
    description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tee featuring the Red Runtz design. Limited run, don't sleep.",
    price: 35,
    originalPrice: 45,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Red_Runtz_Detail_3.png?v=1752594997",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Red_Runtz_Detail_3.png?v=1752594997",
    rating: 4.7,
    reviews: 112,
    badge: "Limited",
    category: "apparel",
    stock: "in_stock",
    colors: [],
    brand: "Stonerdays",
  },
  {
    id: "p7",
    title: "Gumbo-Licious Snapback",
    description: "seedleSs. x Top Shelf Exotics collaboration snapback. Premium construction with embroidered Gumbo-Licious design. One size fits all.",
    price: 29,
    originalPrice: 29,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/GumboLiciousLeft2_ebfbcb6b-0707-4211-acf4-897da26f5b4f.png?v=1766299479",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/GumboLiciousLeft2_ebfbcb6b-0707-4211-acf4-897da26f5b4f.png?v=1766299479",
    rating: 4.5,
    reviews: 67,
    badge: "New",
    category: "snapbacks",
    stock: "in_stock",
    colors: [],
    brand: "seedleSs.",
  },
  {
    id: "p8",
    title: "Sour Tangie Snapback",
    description: "seedleSs. x Top Shelf Exotics collaboration snapback. Premium construction with embroidered Sour Tangie design. One size fits all.",
    price: 29,
    originalPrice: 29,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/SourTangieLeft2.1.png?v=1766301085",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/SourTangieLeft2.1.png?v=1766301085",
    rating: 4.6,
    reviews: 54,
    badge: "New",
    category: "snapbacks",
    stock: "in_stock",
    colors: [],
    brand: "seedleSs.",
  },
  {
    id: "p9",
    title: "Zelato Snapback",
    description: "seedleSs. x Top Shelf Exotics collaboration snapback. Premium construction with embroidered Zelato design. One size fits all.",
    price: 29,
    originalPrice: 29,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/ZelatoLeft2.png?v=1766300048",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/ZelatoLeft2.png?v=1766300048",
    rating: 4.4,
    reviews: 43,
    badge: "New",
    category: "snapbacks",
    stock: "in_stock",
    colors: [],
    brand: "seedleSs.",
  },
  {
    id: "p10",
    title: "Vibes Collab Pack",
    description: "Limited edition Top Shelf Exotics x Vibes collab pack. Only 250 worldwide. Includes exclusive gear and premium smokeware.",
    price: 99,
    originalPrice: 129,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/X_34.png?v=1756851273",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VibesXTSE.png?v=1766308715",
    rating: 5.0,
    reviews: 24,
    badge: "Limited",
    category: "packs",
    stock: "low_stock",
    colors: [],
    brand: "Vibes",
  },
  {
    id: "p11",
    title: "Cali by VIBES 8-Pack",
    description: "Organic hemp 3PC 2gram cones in a convenient 8-pack box. When culture meets quality, the streets take notice. Premium rolling experience.",
    price: 40,
    originalPrice: 40,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_756cf69a-cfcb-4e8f-82ff-f484e61cc706.jpg?v=1766308715",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VibesXTSE.png?v=1766308715",
    rating: 4.8,
    reviews: 189,
    badge: "Best Seller",
    category: "smokeware",
    stock: "in_stock",
    colors: [],
    brand: "Vibes",
  },
  {
    id: "p12",
    title: "Vibes Slingbag",
    description: "Limited Edition Vibes x Top Shelf Exotics SLINGBAG. Premium branded slingbag for everyday carry. Street-ready style meets functionality.",
    price: 15,
    originalPrice: 25,
    image:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VIBES_artwork_1.png?v=1766302633",
    hoverImage:
      "https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VibesXTSE.png?v=1766308715",
    rating: 4.5,
    reviews: 78,
    badge: "-40%",
    category: "accessories",
    stock: "in_stock",
    colors: [],
    brand: "Vibes",
  },
];

export const brands = [
  "TSE Genetics",
  "Stonerdays",
  "seedleSs.",
  "Vibes",
];

export const productBrands: Record<string, string> = {
  p1: "TSE Genetics",
  p2: "TSE Genetics",
  p3: "Stonerdays",
  p4: "Stonerdays",
  p5: "Stonerdays",
  p6: "Stonerdays",
  p7: "seedleSs.",
  p8: "seedleSs.",
  p9: "seedleSs.",
  p10: "Vibes",
  p11: "Vibes",
  p12: "Vibes",
};

export const reviews: Review[] = [
  {
    id: "r1",
    name: "Sophia M.",
    role: "Verified Buyer",
    rating: 5,
    date: "2 weeks ago",
    title: "Loudest strain I've had",
    body: "The Jokerz Runtz hit perfectly — candy gas with a smooth finish. My go-to evening strain now.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    product: "Jokerz Runtz 24.6% THC",
  },
  {
    id: "r2",
    name: "Daniel K.",
    role: "Verified Buyer",
    rating: 5,
    date: "1 month ago",
    title: "Sweet and sour perfection",
    body: "Sweet N Sour OG tastes amazing — citrus up front with that classic gas finish. Bag appeal is crazy.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    product: "Sweet N Sour Og 20% THC",
  },
  {
    id: "r3",
    name: "Ava R.",
    role: "Verified Buyer",
    rating: 4,
    date: "3 weeks ago",
    title: "Fresh fit, fresh flower",
    body: "Copped the Blue Razz tee and some flower. Tee fits great, quality cotton. The design is fire.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80",
    product: "Blue Razz Tee",
  },
  {
    id: "r4",
    name: "Marcus T.",
    role: "Verified Buyer",
    rating: 5,
    date: "5 days ago",
    title: "Best cones on the market",
    body: "Cali by VIBES 8-pack is a steal. Clean burn, even roll, and the box is perfect for on-the-go.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    product: "Cali by VIBES 8-Pack",
  },
];

export const faqs: FAQ[] = [
  {
    q: "Is this real, top-shelf bud?",
    a: "100%. No mids, no mystery. Every nug you see is exactly what shows up at your door — sticky, loud, and hand-selected for quality.",
  },
  {
    q: "Is this even legal?",
    a: "Yes. We carry federally compliant, Farm Bill-certified THCa products. That means it's hemp-derived, under 0.3% Delta-9 THC, and fully legal to ship in most states.",
  },
  {
    q: "How fast is shipping?",
    a: "Fast-fast. Orders go out same or next business day, and typically arrive in 2-3 days. Discreet, secure, and packed fresh.",
  },
  {
    q: "What about my privacy?",
    a: "Locked down. We never store or share your personal info. No data games, no spam, no third-party nonsense.",
  },
  {
    q: "Will the product match the photos?",
    a: "Exactly. What you see is what lands in your jar. We shoot fresh content of every batch so you're shopping the real deal. No surprises.",
  },
  {
    q: "Do you offer refunds or exchanges?",
    a: "Because of the nature of the product, all sales are final. But if something's off, we always make it right. Just reach out.",
  },
];

export const searchSuggestions: SearchSuggestion[] = [
  { query: "jokerz runtz" },
  { query: "sweet n sour og" },
  { query: "blue razz tee" },
  { query: "snapbacks" },
  { query: "cali by vibes" },
  { query: "collab pack" },
  { query: "flower strains" },
];
