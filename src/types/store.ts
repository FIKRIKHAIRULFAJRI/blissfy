export type ProductColor = {
  name: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  imageTone: "ivory" | "stone" | "olive" | "taupe";
  colors: ProductColor[];
};

export type Collection = {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "warm" | "deep";
};

export type ServicePromise = {
  title: string;
  description: string;
};
