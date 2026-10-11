import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cashoutRequest.deleteMany();
  await prisma.session.deleteMany();
  await prisma.address.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  const categories = await Promise.all([
    prisma.category.create({
      data: {
        name: "Flower",
        slug: "flower",
        tagline: "Premium craft cannabis",
        description: "Hand-selected small-batch exotic strains that hit hard and taste even better. Lab tested for potency and purity.",
        count: 12,
      },
    }),
    prisma.category.create({
      data: {
        name: "Tees & Tanks",
        slug: "apparel",
        tagline: "Stonerdays collab",
        description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tees and tanks with exclusive strain graphics.",
        count: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: "Snapbacks",
        slug: "snapbacks",
        tagline: "seedleSs. collab",
        description: "seedleSs. x Top Shelf Exotics collaboration snapbacks. Premium embroidery, one size fits all. Limited drops.",
        count: 5,
      },
    }),
    prisma.category.create({
      data: {
        name: "Papers & Smokeware",
        slug: "smokeware",
        tagline: "Cali by VIBES",
        description: "Cali by VIBES organic hemp cones and smokeware. When culture meets quality, the streets take notice.",
        count: 8,
      },
    }),
    prisma.category.create({
      data: {
        name: "Packs & Bundles",
        slug: "packs",
        tagline: "Limited edition bundles",
        description: "Limited edition collaboration packs. Exclusive gear and premium smokeware in collectible bundles.",
        count: 4,
      },
    }),
    prisma.category.create({
      data: {
        name: "Accessories",
        slug: "accessories",
        tagline: "Elevate your session",
        description: "Premium accessories including bags and merch. Street-ready style meets everyday functionality.",
        count: 6,
      },
    }),
  ]);

  const catMap: Record<string, string> = {};
  for (const c of categories) {
    catMap[c.slug] = c.id;
  }

  const productData = [
    {
      title: "Jokerz Runtz 24.6% THC",
      slug: "jokerz-runtz-24-6-thc",
      description: "Indica-dominant hybrid with candy-forward citrus and creamy depth over earthy funk. Dense frosty buds with dark green and purple tones. Aromas of floral citrus, creamy gas, and light pepper.",
      price: 26,
      originalPrice: 32,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_e2198b12-63a6-4a55-98f7-6a19f98931d5.png?v=1780766561"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_c82b1c26-255b-4fd2-9134-e454cf6835d9.jpg?v=1781033880"]),
      rating: 4.9,
      reviewsCount: 423,
      badge: "Best Seller",
      stock: "IN_STOCK",
      brand: "TSE Genetics",
      categorySlug: "flower",
    },
    {
      title: "Sweet N Sour Og 20% THC",
      slug: "sweet-n-sour-og-20-thc",
      description: "Citrus-forward hybrid with sweet berry brightness over earthy diesel and sour funk. Dense frosty buds with a sharp sweet-meets-gas profile. Aromas of sour citrus, diesel, and earthy skunk.",
      price: 26,
      originalPrice: 26,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_3261b7dc-77ba-4fa2-a674-ac11e2e2688a.png?v=1783699083"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_2198579c-11cd-4b3a-9e3d-ef3851231060.jpg?v=1783699730"]),
      rating: 4.8,
      reviewsCount: 287,
      badge: "New",
      stock: "IN_STOCK",
      brand: "TSE Genetics",
      categorySlug: "flower",
    },
    {
      title: "Blue Razz Tee",
      slug: "blue-razz-tee",
      description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Where fire flower meets street legend. Premium cotton tee with custom Blue Razz graphic.",
      price: 35,
      originalPrice: 45,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Razz_Detail_4.png?v=1752595029"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Razz_Detail_4.png?v=1752595029"]),
      rating: 4.7,
      reviewsCount: 156,
      badge: "New",
      stock: "IN_STOCK",
      brand: "Stonerdays",
      categorySlug: "apparel",
    },
    {
      title: "Blue Runtz Tee",
      slug: "blue-runtz-tee",
      description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tee featuring the Blue Runtz design. Street legend meets fire flower.",
      price: 35,
      originalPrice: 45,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Runtz_Detail_3.png?v=1752594967"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Blue_Runtz_Detail_3.png?v=1752594967"]),
      rating: 4.6,
      reviewsCount: 134,
      badge: "New",
      stock: "IN_STOCK",
      brand: "Stonerdays",
      categorySlug: "apparel",
    },
    {
      title: "Pink Rosay Tee",
      slug: "pink-rosay-tee",
      description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tee with custom Pink Rozay graphic. Streetwear meets top-shelf culture.",
      price: 35,
      originalPrice: 45,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Pink_Rozay_Details_4_1.png?v=1752595058"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Pink_Rozay_Details_4_1.png?v=1752595058"]),
      rating: 4.8,
      reviewsCount: 98,
      badge: "Limited",
      stock: "LOW_STOCK",
      brand: "Stonerdays",
      categorySlug: "apparel",
    },
    {
      title: "Red Runtz Tee",
      slug: "red-runtz-tee",
      description: "🔥 Stonerdays x Top Shelf Exotics — Ultra-Limited Drop. Premium cotton tee featuring the Red Runtz design. Limited run, don't sleep.",
      price: 35,
      originalPrice: 45,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Red_Runtz_Detail_3.png?v=1752594997"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/Red_Runtz_Detail_3.png?v=1752594997"]),
      rating: 4.7,
      reviewsCount: 112,
      badge: "Limited",
      stock: "IN_STOCK",
      brand: "Stonerdays",
      categorySlug: "apparel",
    },
    {
      title: "Gumbo-Licious Snapback",
      slug: "gumbo-licious-snapback",
      description: "seedleSs. x Top Shelf Exotics collaboration snapback. Premium construction with embroidered Gumbo-Licious design. One size fits all.",
      price: 29,
      originalPrice: 29,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/GumboLiciousLeft2_ebfbcb6b-0707-4211-acf4-897da26f5b4f.png?v=1766299479"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/GumboLiciousLeft2_ebfbcb6b-0707-4211-acf4-897da26f5b4f.png?v=1766299479"]),
      rating: 4.5,
      reviewsCount: 67,
      badge: "New",
      stock: "IN_STOCK",
      brand: "seedleSs.",
      categorySlug: "snapbacks",
    },
    {
      title: "Sour Tangie Snapback",
      slug: "sour-tangie-snapback",
      description: "seedleSs. x Top Shelf Exotics collaboration snapback. Premium construction with embroidered Sour Tangie design. One size fits all.",
      price: 29,
      originalPrice: 29,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/SourTangieLeft2.1.png?v=1766301085"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/SourTangieLeft2.1.png?v=1766301085"]),
      rating: 4.6,
      reviewsCount: 54,
      badge: "New",
      stock: "IN_STOCK",
      brand: "seedleSs.",
      categorySlug: "snapbacks",
    },
    {
      title: "Zelato Snapback",
      slug: "zelato-snapback",
      description: "seedleSs. x Top Shelf Exotics collaboration snapback. Premium construction with embroidered Zelato design. One size fits all.",
      price: 29,
      originalPrice: 29,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/ZelatoLeft2.png?v=1766300048"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/ZelatoLeft2.png?v=1766300048"]),
      rating: 4.4,
      reviewsCount: 43,
      badge: "New",
      stock: "IN_STOCK",
      brand: "seedleSs.",
      categorySlug: "snapbacks",
    },
    {
      title: "Vibes Collab Pack",
      slug: "vibes-collab-pack",
      description: "Limited edition Top Shelf Exotics x Vibes collab pack. Only 250 worldwide. Includes exclusive gear and premium smokeware.",
      price: 99,
      originalPrice: 129,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/X_34.png?v=1756851273"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VibesXTSE.png?v=1766308715"]),
      rating: 5.0,
      reviewsCount: 24,
      badge: "Limited",
      stock: "LOW_STOCK",
      brand: "Vibes",
      categorySlug: "packs",
    },
    {
      title: "Cali by VIBES 8-Pack",
      slug: "cali-by-vibes-8-pack",
      description: "Organic hemp 3PC 2gram cones in a convenient 8-pack box. When culture meets quality, the streets take notice. Premium rolling experience.",
      price: 40,
      originalPrice: 40,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/rn-image_picker_lib_temp_756cf69a-cfcb-4e8f-82ff-f484e61cc706.jpg?v=1766308715"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VibesXTSE.png?v=1766308715"]),
      rating: 4.8,
      reviewsCount: 189,
      badge: "Best Seller",
      stock: "IN_STOCK",
      brand: "Vibes",
      categorySlug: "smokeware",
    },
    {
      title: "Vibes Slingbag",
      slug: "vibes-slingbag",
      description: "Limited Edition Vibes x Top Shelf Exotics SLINGBAG. Premium branded slingbag for everyday carry. Street-ready style meets functionality.",
      price: 15,
      originalPrice: 25,
      images: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VIBES_artwork_1.png?v=1766302633"]),
      hoverImages: JSON.stringify(["https://cdn.shopify.com/s/files/1/0743/2352/5869/files/VibesXTSE.png?v=1766308715"]),
      rating: 4.5,
      reviewsCount: 78,
      badge: "-40%",
      stock: "IN_STOCK",
      brand: "Vibes",
      categorySlug: "accessories",
    },
  ];

  for (const p of productData) {
    const { categorySlug, ...rest } = p;
    await prisma.product.create({
      data: {
        ...rest,
        categoryId: catMap[categorySlug],
        colors: JSON.stringify([]),
      },
    });
  }

  const adminPassword = await bcrypt.hash("Admin123!", 10);
  await prisma.user.create({
    data: {
      email: "admin@topshelffarms.com",
      passwordHash: adminPassword,
      name: "Admin",
      role: "ADMIN",
      emailVerified: true,
    },
  });

  const customerPassword = await bcrypt.hash("password123", 10);
  await prisma.user.create({
    data: {
      email: "guy@topshelffarms.com",
      passwordHash: customerPassword,
      name: "Guy",
      role: "USER",
      emailVerified: true,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
