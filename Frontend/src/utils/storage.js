// localStorage can be unavailable (private mode, blocked storage), so every access is guarded
export const readJSON = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

export const writeJSON = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
};

const RECENT_KEY = "recentlyViewed";
const RECENT_MAX = 8;

// Stores a small snapshot so the strip can render without refetching
export const addRecentlyViewed = (product) => {
  if (!product?._id) return;
  const snapshot = {
    _id: product._id,
    title: product.title,
    brand: product.brand,
    price: product.price,
    totalrating: product.totalrating,
    images: product.images?.slice(0, 1) || [],
  };
  const list = readJSON(RECENT_KEY, []).filter((p) => p._id !== product._id);
  writeJSON(RECENT_KEY, [snapshot, ...list].slice(0, RECENT_MAX));
};

export const getRecentlyViewed = () => readJSON(RECENT_KEY, []);
