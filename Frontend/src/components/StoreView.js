import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BsGrid3X3Gap, BsGrid, BsListUl, BsFunnel, BsX, BsSearch } from "react-icons/bs";
import ProductGrid from "./ProductCard";
import EmptyState from "./EmptyState";
import { productSevice } from "../features/products/productService";

const PAGE_SIZE = 12;
const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
const SORTS = [
  { value: "-createdAt", label: "Newest first" },
  { value: "-sold", label: "Best selling" },
  { value: "price", label: "Price: low to high" },
  { value: "-price", label: "Price: high to low" },
  { value: "-totalrating", label: "Top rated" },
  { value: "title", label: "Name: A–Z" },
  { value: "-title", label: "Name: Z–A" },
];
const VIEWS = [
  { value: "4", icon: <BsGrid3X3Gap />, label: "Four per row" },
  { value: "3", icon: <BsGrid />, label: "Three per row" },
  { value: "list", icon: <BsListUl />, label: "List" },
];

const countBy = (items, key) => {
  const counts = {};
  items.forEach((p) => {
    const v = p[key];
    if (v) counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
};

const FilterPanel = ({ facets, params, setParam, fixedCategory, priceDraft, setPriceDraft }) => (
  <div className="filter-panel">
    {!fixedCategory && facets.categories.length > 0 && (
      <div className="filter-section">
        <h6>Category</h6>
        <button
          type="button"
          className={`filter-option ${!params.category ? "active" : ""}`}
          onClick={() => setParam("category", null)}
        >
          All categories
        </button>
        {facets.categories.map(([name, count]) => (
          <button
            type="button"
            key={name}
            className={`filter-option ${params.category === name ? "active" : ""}`}
            onClick={() => setParam("category", params.category === name ? null : name)}
          >
            {name} <span className="count">{count}</span>
          </button>
        ))}
      </div>
    )}

    <div className="filter-section">
      <h6>Price (₹)</h6>
      <div className="price-inputs">
        <input
          type="number"
          min="0"
          className="form-control"
          placeholder="Min"
          aria-label="Minimum price"
          value={priceDraft.min}
          onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
        />
        <span className="text-muted">–</span>
        <input
          type="number"
          min="0"
          className="form-control"
          placeholder="Max"
          aria-label="Maximum price"
          value={priceDraft.max}
          onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
        />
      </div>
    </div>

    {facets.sizes.length > 0 && (
      <div className="filter-section">
        <h6>Size</h6>
        <div className="chip-row">
          {facets.sizes.map((s) => (
            <button
              type="button"
              key={s}
              className={`chip ${params.size === s ? "active" : ""}`}
              onClick={() => setParam("size", params.size === s ? null : s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    )}

    {facets.brands.length > 0 && (
      <div className="filter-section">
        <h6>Brand</h6>
        <div className="chip-row">
          {facets.brands.map(([name]) => (
            <button
              type="button"
              key={name}
              className={`chip ${params.brand === name ? "active" : ""}`}
              onClick={() => setParam("brand", params.brand === name ? null : name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    )}

    {facets.tags.length > 0 && (
      <div className="filter-section">
        <h6>Tags</h6>
        <div className="chip-row">
          {facets.tags.map(([name]) => (
            <button
              type="button"
              key={name}
              className={`chip ${params.tag === name ? "active" : ""}`}
              onClick={() => setParam("tag", params.tag === name ? null : name)}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
);

/**
 * Product listing with filters kept in the URL (?category=&brand=&size=&min=&max=&sort=).
 * Used by the store, category and search pages.
 */
const StoreView = ({ fixedCategory, searchQuery }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [catalog, setCatalog] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const requestId = useRef(0);

  const params = {
    category: fixedCategory || searchParams.get("category"),
    brand: searchParams.get("brand"),
    tag: searchParams.get("tag"),
    size: searchParams.get("size"),
    min: searchParams.get("min") || "",
    max: searchParams.get("max") || "",
    sort: searchParams.get("sort") || "-createdAt",
    view: searchParams.get("view") || "4",
  };
  const [priceDraft, setPriceDraft] = useState({ min: params.min, max: params.max });

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === undefined) next.delete(key);
    else next.set(key, value);
    setSearchParams(next, { replace: true });
  };

  // Facets come from the unfiltered catalogue so options don't vanish while filtering
  useEffect(() => {
    productSevice
      .getProducts({ category: fixedCategory, q: searchQuery })
      .then((data) => setCatalog(Array.isArray(data) ? data : []))
      .catch(() => setCatalog([]));
  }, [fixedCategory, searchQuery]);

  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true);
    productSevice
      .getProducts({
        category: params.category,
        brand: params.brand,
        tag: params.tag,
        size: params.size,
        minPrice: params.min,
        maxPrice: params.max,
        sort: params.sort,
        q: searchQuery,
      })
      .then((data) => {
        if (id !== requestId.current) return; // a newer request is in flight
        setProducts(Array.isArray(data) ? data : []);
        setVisible(PAGE_SIZE);
      })
      .catch(() => id === requestId.current && setProducts([]))
      .finally(() => id === requestId.current && setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.category, params.brand, params.tag, params.size, params.min, params.max, params.sort, searchQuery]);

  // Price inputs apply after a short pause in typing
  useEffect(() => {
    const t = setTimeout(() => {
      if (priceDraft.min !== params.min || priceDraft.max !== params.max) {
        const next = new URLSearchParams(searchParams);
        priceDraft.min ? next.set("min", priceDraft.min) : next.delete("min");
        priceDraft.max ? next.set("max", priceDraft.max) : next.delete("max");
        setSearchParams(next, { replace: true });
      }
    }, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priceDraft]);

  const facets = useMemo(() => {
    const sizes = new Set();
    catalog.forEach((p) => p.sizeStock?.forEach((s) => s.quantity > 0 && sizes.add(s.size)));
    return {
      categories: countBy(catalog, "category"),
      brands: countBy(catalog, "brand"),
      tags: countBy(catalog, "tags"),
      sizes: SIZE_ORDER.filter((s) => sizes.has(s)),
    };
  }, [catalog]);

  const activeChips = [
    !fixedCategory && params.category && { key: "category", label: params.category },
    params.brand && { key: "brand", label: params.brand },
    params.tag && { key: "tag", label: `#${params.tag}` },
    params.size && { key: "size", label: `Size ${params.size}` },
    params.min && { key: "min", label: `From ₹${params.min}` },
    params.max && { key: "max", label: `Up to ₹${params.max}` },
  ].filter(Boolean);

  const clearAll = () => {
    const next = new URLSearchParams();
    if (searchParams.get("view")) next.set("view", searchParams.get("view"));
    if (searchParams.get("sort")) next.set("sort", searchParams.get("sort"));
    setPriceDraft({ min: "", max: "" });
    setSearchParams(next, { replace: true });
  };

  const removeChip = (key) => {
    if (key === "min" || key === "max") setPriceDraft((d) => ({ ...d, [key]: "" }));
    setParam(key, null);
  };

  const panelProps = { facets, params, setParam, fixedCategory, priceDraft, setPriceDraft };
  const shown = products.slice(0, visible);

  return (
    <div className="store-layout">
      <FilterPanel {...panelProps} />

      <div>
        <div className="toolbar">
          <div className="d-flex align-items-center gap-2">
            <button type="button" className="button button-outline button-sm d-lg-none" onClick={() => setDrawerOpen(true)}>
              <BsFunnel /> Filters{activeChips.length ? ` (${activeChips.length})` : ""}
            </button>
            <span className="result-count">
              {loading ? "Loading…" : `${products.length} ${products.length === 1 ? "product" : "products"}`}
            </span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <select
              className="form-select"
              aria-label="Sort products"
              value={params.sort}
              onChange={(e) => setParam("sort", e.target.value)}
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="view-toggle d-none d-md-inline-flex" role="group" aria-label="Layout">
              {VIEWS.map((v) => (
                <button
                  type="button"
                  key={v.value}
                  className={params.view === v.value ? "active" : ""}
                  aria-label={v.label}
                  aria-pressed={params.view === v.value}
                  onClick={() => setParam("view", v.value === "4" ? null : v.value)}
                >
                  {v.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="chip-row mb-3 align-items-center">
            {activeChips.map((c) => (
              <button type="button" key={c.key} className="chip active" onClick={() => removeChip(c.key)}>
                {c.label} <BsX />
              </button>
            ))}
            <button type="button" className="button button-ghost button-sm" onClick={clearAll}>
              Clear all
            </button>
          </div>
        )}

        {!loading && products.length === 0 ? (
          <EmptyState
            icon={<BsSearch />}
            title="No products found"
            message={
              activeChips.length
                ? "Try removing a filter or widening the price range."
                : searchQuery
                ? `We couldn't find anything for “${searchQuery}”. Try a different word.`
                : "Products will show up here once they're added."
            }
            actionLabel={activeChips.length ? "Clear filters" : undefined}
            onAction={activeChips.length ? clearAll : undefined}
          />
        ) : (
          <ProductGrid
            products={shown}
            loading={loading}
            view={params.view === "list" ? "list" : "grid"}
            cols={params.view === "3" ? 3 : 4}
          />
        )}

        {!loading && visible < products.length && (
          <div className="text-center mt-4">
            <p className="result-count mb-2">
              Showing {shown.length} of {products.length}
            </p>
            <button type="button" className="button button-outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
              Load more
            </button>
          </div>
        )}
      </div>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer right" aria-label="Filters">
            <div className="drawer-head">
              <strong>Filters</strong>
              <button type="button" className="icon-btn" aria-label="Close filters" onClick={() => setDrawerOpen(false)}>
                <BsX />
              </button>
            </div>
            <div className="drawer-body">
              <FilterPanel {...panelProps} />
            </div>
            <div className="p-3 border-top d-flex gap-2">
              <button type="button" className="button button-outline flex-fill" onClick={clearAll}>Clear</button>
              <button type="button" className="button flex-fill" onClick={() => setDrawerOpen(false)}>
                Show {products.length} results
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
};

export default StoreView;
