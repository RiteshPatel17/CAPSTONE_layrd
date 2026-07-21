// ─────────────────────────────────────────────
// LÄYRD – Mock product data (used until Supabase is connected)
// ─────────────────────────────────────────────

export const FLAVOURS = [
  {
    id: "lotus-cheesecake",
    name: "Lotus Cheesecake",
    category: "core",
    description:
      "Velvety cream cheese filling layered over a buttery Biscoff crust with ribbons of Lotus spread throughout. Pure indulgence in every spoonful.",
    ingredients:
      "Cream cheese, Lotus Biscoff spread, Lotus Biscoff cookies, whipping cream, sugar, butter, vanilla extract",
    allergens: ["dairy", "gluten", "soy"],
    colour: "#c4a882",
  },
  {
    id: "oreo-cheesecake",
    name: "Oreo Cheesecake",
    category: "core",
    description:
      "Classic Oreo cookies blended into a smooth, rich cheesecake filling. A timeless combination that never disappoints.",
    ingredients:
      "Cream cheese, Oreo cookies, whipping cream, sugar, butter, vanilla extract",
    allergens: ["dairy", "gluten", "soy"],
    colour: "#2a2a2a",
  },
  {
    id: "classic-tiramisu",
    name: "Classic Tiramisu",
    category: "core",
    description:
      "Espresso-soaked ladyfingers layered with mascarpone cream and a dusting of cocoa. An authentic Italian dessert reimagined.",
    ingredients:
      "Mascarpone cheese, ladyfinger biscuits, espresso, whipping cream, egg yolks, sugar, cocoa powder",
    allergens: ["dairy", "gluten", "eggs"],
    colour: "#6b4c2a",
  },
  {
    id: "bueno-cheesecake",
    name: "Bueno Cheesecake",
    category: "limited",
    description:
      "Hazelnut Kinder Bueno chocolate melted into a silky cheesecake — crispy wafer layers, creamy hazelnut filling. A European classic.",
    ingredients:
      "Cream cheese, Kinder Bueno, hazelnut cream, whipping cream, sugar, butter, vanilla extract",
    allergens: ["dairy", "gluten", "nuts", "soy"],
    colour: "#8b5e3c",
  },
  {
    id: "matcha-cheesecake",
    name: "Matcha Cheesecake",
    category: "limited",
    description:
      "Ceremonial-grade matcha blended into a smooth, lightly sweet cheesecake. Earthy, delicate, and beautifully balanced.",
    ingredients:
      "Cream cheese, ceremonial matcha powder, whipping cream, sugar, butter, white chocolate",
    allergens: ["dairy", "gluten", "soy"],
    colour: "#6b8f6b",
  },
  {
    id: "pistachio-tiramisu",
    name: "Pistachio Tiramisu",
    category: "limited",
    description:
      "Traditional tiramisu elevated with Sicilian pistachio cream. Nutty, aromatic, and utterly unforgettable.",
    ingredients:
      "Mascarpone cheese, pistachio cream, ladyfinger biscuits, espresso, whipping cream, sugar",
    allergens: ["dairy", "gluten", "nuts", "eggs"],
    colour: "#8faa6b",
  },
];

// 250 ml individual cans
export const PRODUCTS = [
  {
    id: "lotus-250",
    flavourId: "lotus-cheesecake",
    name: "Lotus Cheesecake – 250ml",
    size: 250,
    category: "core",
    price: 8,
    status: "available",
    stock: 24,
    image: null, // Replace with Supabase Storage URL
  },
  {
    id: "oreo-250",
    flavourId: "oreo-cheesecake",
    name: "Oreo Cheesecake – 250ml",
    size: 250,
    category: "core",
    price: 8,
    status: "available",
    stock: 18,
    image: null,
  },
  {
    id: "tiramisu-250",
    flavourId: "classic-tiramisu",
    name: "Classic Tiramisu – 250ml",
    size: 250,
    category: "core",
    price: 8,
    status: "available",
    stock: 20,
    image: null,
  },
  {
    id: "bueno-250",
    flavourId: "bueno-cheesecake",
    name: "Bueno Cheesecake – 250ml",
    size: 250,
    category: "limited",
    price: 9,
    status: "available",
    stock: 12,
    image: null,
  },
  {
    id: "matcha-250",
    flavourId: "matcha-cheesecake",
    name: "Matcha Cheesecake – 250ml",
    size: 250,
    category: "limited",
    price: 9,
    status: "coming_soon",
    stock: 0,
    image: null,
  },
  {
    id: "pistachio-250",
    flavourId: "pistachio-tiramisu",
    name: "Pistachio Tiramisu – 250ml",
    size: 250,
    category: "limited",
    price: 9,
    status: "coming_soon",
    stock: 0,
    image: null,
  },
];

// Espresso shots
export const ESPRESSO_PRODUCTS = [
  {
    id: "espresso-1",
    name: "Espresso Shot × 1",
    quantity: 1,
    price: 4,
    sweetness: ["Black", "Sugar", "Stevia", "Brown Sugar"],
    status: "available",
  },
  {
    id: "espresso-4",
    name: "Espresso Shots × 4",
    quantity: 4,
    price: 14,
    sweetness: ["Black", "Sugar", "Stevia", "Brown Sugar"],
    status: "available",
  },
  {
    id: "espresso-6",
    name: "Espresso Shots × 6",
    quantity: 6,
    price: 20,
    sweetness: ["Black", "Sugar", "Stevia", "Brown Sugar"],
    status: "available",
  },
];

// Bundle products (mix & match flavours)
export const BUNDLE_PRODUCTS = [
  {
    id: "bundle-4",
    name: "Core 4-Pack",
    description: "Choose any 4 core flavours. Mix and match freely.",
    canCount: 4,
    basePrice: 30, // all core
    limitedPremium: 1, // per limited flavour included
    status: "available",
    image: null,
  },
  {
    id: "bundle-6",
    name: "Core 6-Pack",
    description: "Choose any 6 core flavours. Mix and match freely.",
    canCount: 6,
    basePrice: 44,
    limitedPremium: 1,
    status: "available",
    image: null,
  },
];
