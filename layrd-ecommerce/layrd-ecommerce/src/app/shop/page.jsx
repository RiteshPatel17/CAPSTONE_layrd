"use client";
// TODO: Shop — full UI build is Phase 3 (see jira-reference.md, Aaryan's page)
// Owner: see jira-reference.md for assignment
//
// This is a MINIMAL version for Day 2 testing purposes — it proves
// getProducts() successfully pulls live data from Supabase. The real
// shop grid, filters, product cards, etc. get built in Phase 3.

import { useEffect, useState } from "react";
import { getProducts } from "@/lib/admin-products";

export default function Page() {
  // products: holds the array of products once fetched
  // loading: true while the fetch is in progress
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Runs once when the page loads. Calls our lib function (not Supabase
    // directly — keeping with the service layer pattern from TRD 4.3).
    async function loadProducts() {
      const data = await getProducts();
      setProducts(data);
      setLoading(false);
    }

    loadProducts();
  }, []);

  if (loading) {
    return <div style={{ padding: "40px" }}>Loading products...</div>;
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Shop — Placeholder (Live Data Test)</h1>
      <p>{products.length} products loaded from Supabase</p>

      <ul>
        {products.map((product) => (
          <li key={product.id} style={{ marginBottom: "12px" }}>
            <strong>{product.name}</strong> — ${product.price} ({product.status})
          </li>
        ))}
      </ul>
    </div>
  );
}