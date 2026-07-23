// ─────────────────────────────────────────────
// LÄYRD – product-mapper.js
// Converts raw Supabase DB rows → the shape that frontend components expect.
//
// The live DB uses different casing/naming than the original seed-products.js:
//   DB status  → "Available" / "Coming Soon"   (capitalized)
//   DB category → "cake" / "espresso"          (not core/limited)
//   DB flavour_type → "core" / "limited"
//   DB size    → "250ml" (string)              (seed used number 250)
// ─────────────────────────────────────────────

/**
 * Map a single Supabase products row to the frontend shape.
 * @param {Object} row - Raw DB row
 * @returns {Object} - Normalised product
 */
export function mapProduct(row) {
  if (!row) return null;
  return {
    id:          row.id,
    flavourId:   row.id,                               // legacy compat
    name:        row.name,
    flavour:     row.flavour ?? row.name,
    category:    row.flavour_type ?? row.category,     // "core" | "limited" | "espresso"
    dbCategory:  row.category,                         // "cake" | "espresso" (raw DB value)
    size:        parseInt(row.size) || row.size,       // convert "250ml" → 250
    price:       parseFloat(row.price),
    status:      normaliseStatus(row.status),          // always lowercase
    description: row.description ?? "",
    ingredients: row.ingredients ?? "",
    allergens:   normaliseAllergens(row.allergens),    // always array
    imageUrl:    row.image_url ?? null,
    image:       row.image_url ?? null,                // legacy compat
    releaseDate: row.release_date ?? null,
    createdAt:   row.created_at,
    featured:    row.featured ?? false,
  };
}

/**
 * Map an array of rows.
 * @param {Array} rows
 * @returns {Array}
 */
export function mapProducts(rows = []) {
  return rows.map(mapProduct);
}

/**
 * Normalise status to lowercase so existing filter logic works unchanged.
 * DB: "Available" / "Coming Soon" / "Sold Out" / "Hidden"
 */
function normaliseStatus(status = "") {
  const map = {
    "available":   "available",
    "coming soon": "coming_soon",
    "sold out":    "sold_out",
    "hidden":      "hidden",
  };
  return map[status.toLowerCase()] ?? status.toLowerCase().replace(" ", "_");
}

/**
 * Normalise allergens to an array.
 * DB stores as a comma-separated string: "Dairy, Gluten, Soy"
 */
function normaliseAllergens(allergens) {
  if (!allergens) return [];
  if (Array.isArray(allergens)) return allergens;
  return allergens.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean);
}

/**
 * Convert a frontend status filter value → the DB's capitalised form for querying.
 * e.g. "available" → "Available",  "coming_soon" → "Coming Soon"
 */
export function statusToDb(status) {
  const map = {
    available:   "Available",
    coming_soon: "Coming Soon",
    sold_out:    "Sold Out",
    hidden:      "Hidden",
  };
  return map[status] ?? status;
}

/**
 * Convert a frontend category filter (core/limited/espresso/bundle)
 * to the correct Supabase column + value to filter on.
 * Returns { column, value } or null if no DB filter needed.
 */
export function categoryToDbFilter(category) {
  switch (category) {
    case "core":
      return { column: "flavour_type", value: "core" };
    case "limited":
      return { column: "flavour_type", value: "limited" };
    case "espresso":
      return { column: "category", value: "espresso" };
    case "cake":
      return { column: "category", value: "cake" };
    default:
      return null;
  }
}
