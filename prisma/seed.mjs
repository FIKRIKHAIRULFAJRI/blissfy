import { existsSync, readFileSync } from "node:fs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

function loadLocalEnv(path) {
  if (!existsSync(path)) {
    return;
  }

  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const rawValue = trimmed.slice(separator + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadLocalEnv(".env.local");

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to seed Blissfy.co catalog data.");
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const now = new Date();
const startsAt = new Date(now);
startsAt.setDate(startsAt.getDate() - 7);
const endsAt = new Date(now);
endsAt.setDate(endsAt.getDate() + 45);

const categories = [
  {
    slug: "atasan",
    name: "Atasan",
    description: "Kemeja, knit, dan atasan ringan untuk gaya harian.",
  },
  {
    slug: "bawahan",
    name: "Bawahan",
    description: "Celana dan rok dengan potongan nyaman untuk rutinitas.",
  },
  {
    slug: "outerwear",
    name: "Outerwear",
    description: "Layer ringan untuk tampilan rapi dan santai.",
  },
  {
    slug: "essentials",
    name: "Essentials",
    description: "Produk esensial Blissfy.co dengan warna netral.",
  },
];

const products = [
  {
    categorySlug: "atasan",
    slug: "relaxed-linen-shirt",
    name: "Relaxed Linen Shirt",
    description:
      "Kemeja linen blend dengan potongan longgar, mudah dipadukan untuk tampilan kerja atau akhir pekan.",
    normalPrice: 189000,
    image: "/products/placeholder-ivory.svg",
    imageAlt: "Relaxed Linen Shirt warna ivory pada latar netral",
    discount: { type: "PERCENTAGE", value: 15 },
    variants: [
      ["Ivory", "#ECE5D8", "S", 260, 8],
      ["Ivory", "#ECE5D8", "M", 270, 10],
      ["Olive", "#6F7254", "M", 270, 7],
      ["Charcoal", "#2B2B27", "L", 280, 6],
    ],
  },
  {
    categorySlug: "bawahan",
    slug: "easy-straight-trouser",
    name: "Easy Straight Trouser",
    description:
      "Celana straight cut dengan pinggang nyaman dan struktur ringan untuk bergerak sepanjang hari.",
    normalPrice: 229000,
    image: "/products/placeholder-stone.svg",
    imageAlt: "Easy Straight Trouser warna stone pada latar hangat",
    discount: { type: "FIXED_AMOUNT", value: 30000 },
    variants: [
      ["Stone", "#B9B4A8", "S", 420, 6],
      ["Stone", "#B9B4A8", "M", 430, 9],
      ["Taupe", "#A59A86", "M", 430, 8],
      ["Taupe", "#A59A86", "L", 440, 5],
    ],
  },
  {
    categorySlug: "outerwear",
    slug: "soft-utility-outer",
    name: "Soft Utility Outer",
    description:
      "Outer utility berbahan ringan dengan detail saku bersih dan warna natural.",
    normalPrice: 279000,
    image: "/products/placeholder-olive.svg",
    imageAlt: "Soft Utility Outer warna olive pada latar editorial",
    discount: { type: "PERCENTAGE", value: 10 },
    variants: [
      ["Olive", "#6F7254", "S", 520, 5],
      ["Olive", "#6F7254", "M", 530, 7],
      ["Sand", "#D6C9B7", "M", 530, 6],
      ["Black", "#171713", "L", 540, 4],
    ],
  },
  {
    categorySlug: "essentials",
    slug: "daily-fine-knit",
    name: "Daily Fine Knit",
    description:
      "Knit halus dengan siluet bersih dan tekstur lembut untuk layering sehari-hari.",
    normalPrice: 169000,
    image: "/products/placeholder-taupe.svg",
    imageAlt: "Daily Fine Knit warna taupe pada latar minimal",
    discount: null,
    variants: [
      ["Taupe", "#A59A86", "S", 310, 8],
      ["Taupe", "#A59A86", "M", 320, 9],
      ["Cream", "#F4EFE4", "M", 320, 7],
      ["Cream", "#F4EFE4", "L", 330, 5],
    ],
  },
  {
    categorySlug: "atasan",
    slug: "boxy-cotton-tee",
    name: "Boxy Cotton Tee",
    description:
      "Kaos katun boxy dengan neckline rapi, cocok menjadi dasar outfit harian.",
    normalPrice: 129000,
    image: "/products/placeholder-cream.svg",
    imageAlt: "Boxy Cotton Tee warna cream pada latar netral",
    discount: { type: "FIXED_AMOUNT", value: 20000 },
    variants: [
      ["Cream", "#F4EFE4", "S", 220, 12],
      ["Cream", "#F4EFE4", "M", 230, 14],
      ["Black", "#171713", "M", 230, 10],
      ["Black", "#171713", "L", 240, 9],
    ],
  },
  {
    categorySlug: "bawahan",
    slug: "a-line-midi-skirt",
    name: "A-Line Midi Skirt",
    description:
      "Rok midi A-line dengan jatuh kain natural dan pinggang yang tetap nyaman.",
    normalPrice: 219000,
    image: "/products/placeholder-clay.svg",
    imageAlt: "A-Line Midi Skirt warna clay pada latar hangat",
    discount: { type: "PERCENTAGE", value: 12 },
    variants: [
      ["Clay", "#B9654A", "S", 360, 5],
      ["Clay", "#B9654A", "M", 370, 6],
      ["Charcoal", "#2B2B27", "M", 370, 7],
      ["Charcoal", "#2B2B27", "L", 380, 4],
    ],
  },
];

async function main() {
  const categoryBySlug = new Map();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: true,
      },
      create: {
        ...category,
        isActive: true,
      },
    });

    categoryBySlug.set(saved.slug, saved);
  }

  for (const product of products) {
    const category = categoryBySlug.get(product.categorySlug);

    if (!category) {
      throw new Error(`Missing category for ${product.name}`);
    }

    const saved = await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        categoryId: category.id,
        name: product.name,
        description: product.description,
        normalPrice: product.normalPrice,
        isActive: true,
      },
      create: {
        categoryId: category.id,
        slug: product.slug,
        name: product.name,
        description: product.description,
        normalPrice: product.normalPrice,
        isActive: true,
      },
    });

    await prisma.productImage.deleteMany({
      where: { productId: saved.id },
    });
    await prisma.productImage.create({
      data: {
        productId: saved.id,
        url: product.image,
        altText: product.imageAlt,
        sortOrder: 0,
        isPrimary: true,
      },
    });

    for (const [colorName, colorHex, size, weightGram, stock] of product.variants) {
      const sku = `BLF-${product.slug
        .split("-")
        .map((part) => part[0])
        .join("")
        .toUpperCase()}-${colorName.slice(0, 3).toUpperCase()}-${size}`;

      await prisma.productVariant.upsert({
        where: { sku },
        update: {
          productId: saved.id,
          colorName,
          colorHex,
          size,
          weightGram,
          stock,
          isActive: true,
        },
        create: {
          productId: saved.id,
          sku,
          colorName,
          colorHex,
          size,
          weightGram,
          stock,
          isActive: true,
        },
      });
    }

    await prisma.discount.deleteMany({
      where: { productId: saved.id },
    });

    if (product.discount) {
      await prisma.discount.create({
        data: {
          productId: saved.id,
          type: product.discount.type,
          value: product.discount.value,
          startsAt,
          endsAt,
          isActive: true,
        },
      });
    }
  }

  await prisma.storeSetting.deleteMany();
  await prisma.storeSetting.create({
    data: {
      storeName: "Blissfy.co",
      originAddress:
        "Jl. Mahoni, Temu Ireng, Sukorejo, Kec. Ulujami, Kabupaten Pemalang, Jawa Tengah 52371",
      originVillage: "Temu Ireng, Sukorejo",
      originDistrict: "Ulujami",
      originCity: "Kabupaten Pemalang",
      originProvince: "Jawa Tengah",
      originPostalCode: "52371",
      defaultPackagingWeightGram: null,
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    await prisma.$disconnect();
    throw error;
  });
