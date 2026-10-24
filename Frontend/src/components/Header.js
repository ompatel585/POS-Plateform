import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import {
  BsSearch,
  BsHeart,
  BsPerson,
  BsBag,
  BsList,
  BsX,
  BsGrid,
  BsChevronDown,
  BsBoxSeam,
  BsBoxArrowRight,
} from "react-icons/bs";
import { getUserCart, getuserProductWishlist } from "../features/user/userSlice";
import { base_url } from "../utils/axiosConfig";
import { cartSubtotal, formatPrice, FREE_SHIPPING_ABOVE } from "../utils/pricing";
import ThemeToggle from "./ThemeToggle";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/product", label: "Shop" },
  { to: "/my-orders", label: "My Orders" },
  { to: "/blogs", label: "Blogs" },
  { to: "/contact", label: "Contact" },
];

const MAX_SUGGESTIONS = 6;

export const logoutCustomer = () => {
  // Only remove session data, so theme and recently viewed survive a logout
  ["customer", "token", "address"].forEach((key) => localStorage.removeItem(key));
  window.location.replace("/");
};

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector((state) => state?.auth?.user);
  const cart = useSelector((state) => state?.auth?.cartProducts);
  const wishlistIds = useSelector((state) => state?.auth?.wishlistIds) || [];

  const [catalog, setCatalog] = useState([]);
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);

  useEffect(() => {
    if (user) {
      dispatch(getUserCart());
      dispatch(getuserProductWishlist());
    }
  }, [dispatch, user]);

  // The header keeps its own copy of the catalogue, so search and categories
  // are not affected by filters applied on the store page
  useEffect(() => {
    axios
      .get(`${base_url}product`, { params: { store: true } })
      .then((res) => setCatalog(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCatalog([]));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setShowSuggestions(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const close = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const categories = useMemo(
    () => [...new Set(catalog.map((p) => p.category).filter(Boolean))].sort(),
    [catalog]
  );

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return catalog
      .filter((p) =>
        [p.title, p.brand, p.category].some((f) => f?.toLowerCase().includes(q))
      )
      .slice(0, MAX_SUGGESTIONS);
  }, [catalog, query]);

  const cartCount = cart?.length || 0;
  const cartTotal = cartSubtotal(cart);

  const goToSearch = (e) => {
    e?.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      navigate(`/product/${suggestions[activeIndex]._id}`);
    } else if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const onSearchKeyDown = (e) => {
    if (!suggestions.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <>
      <header className={`site-header ${scrolled ? "scrolled" : ""}`}>
        <div className="topbar py-2">
          <div className="container-xxl d-flex justify-content-between gap-3">
            <span>Free shipping on orders over {formatPrice(FREE_SHIPPING_ABOVE)}</span>
            <span className="d-none d-sm-inline">
              Hotline: <a href="tel:+918264954234">+91 82649 54234</a>
            </span>
          </div>
        </div>

        <div className="container-xxl">
          <div className="navbar-main">
            <button
              type="button"
              className="icon-btn d-lg-none text-white"
              aria-label="Open menu"
              onClick={() => setDrawerOpen(true)}
            >
              <BsList />
            </button>

            <Link to="/" className="brand-logo">
              Cart<span>Corner</span>
            </Link>

            <div className="search-box" ref={searchRef}>
              <form onSubmit={goToSearch} role="search">
                <input
                  type="search"
                  value={query}
                  placeholder="Search products, brands and categories"
                  aria-label="Search products"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowSuggestions(true);
                    setActiveIndex(-1);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={onSearchKeyDown}
                />
                <button type="submit" aria-label="Search">
                  <BsSearch />
                </button>
              </form>
              {showSuggestions && query.trim() && (
                <div className="search-results">
                  {suggestions.length === 0 ? (
                    <div className="p-3 text-muted small">No matches for “{query}”</div>
                  ) : (
                    suggestions.map((p, i) => (
                      <button
                        type="button"
                        key={p._id}
                        className={`search-result ${i === activeIndex ? "active" : ""}`}
                        onMouseEnter={() => setActiveIndex(i)}
                        onClick={() => navigate(`/product/${p._id}`)}
                      >
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt="" />
                        ) : (
                          <img alt="" />
                        )}
                        <span className="flex-grow-1">
                          <span className="title d-block">{p.title}</span>
                          <span className="meta">
                            {p.brand} · {p.category}
                          </span>
                        </span>
                        <strong>{formatPrice(p.price)}</strong>
                      </button>
                    ))
                  )}
                  <Link className="search-all" to={`/search?q=${encodeURIComponent(query.trim())}`}>
                    See all results for “{query.trim()}”
                  </Link>
                </div>
              )}
            </div>

            <div className="header-actions">
              <ThemeToggle />
              <Link to="/wishlist" className="icon-btn d-none d-sm-inline-flex" aria-label="Wishlist">
                <BsHeart />
                {wishlistIds.length > 0 && <span className="badge-count">{wishlistIds.length}</span>}
              </Link>

              {user ? (
                <div className="dropdown">
                  <button
                    type="button"
                    className="icon-btn"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    aria-label="Account menu"
                  >
                    <BsPerson />
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li className="px-3 py-2 small text-muted">
                      Hi, <strong className="text-dark">{user.firstname}</strong>
                    </li>
                    <li><Link className="dropdown-item" to="/my-profile">My Profile</Link></li>
                    <li><Link className="dropdown-item" to="/my-orders">My Orders</Link></li>
                    <li><Link className="dropdown-item" to="/wishlist">Wishlist</Link></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button type="button" className="dropdown-item text-danger" onClick={logoutCustomer}>
                        Log out
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <Link to="/login" className="icon-btn" aria-label="Log in">
                  <BsPerson />
                </Link>
              )}

              <Link to="/cart" className="d-flex align-items-center gap-2 text-white ms-1">
                <span className="icon-btn" aria-hidden="true">
                  <BsBag />
                  {cartCount > 0 && <span className="badge-count">{cartCount}</span>}
                </span>
                <span className="header-action-label d-none d-xl-block">
                  Cart
                  <strong>{formatPrice(cartTotal)}</strong>
                </span>
              </Link>
            </div>
          </div>
        </div>

        <nav className="nav-strip" aria-label="Main">
          <div className="container-xxl">
            <div className="dropdown">
              <button type="button" className="cat-menu-btn" data-bs-toggle="dropdown" aria-expanded="false">
                <BsGrid /> Shop by category <BsChevronDown size={12} />
              </button>
              <ul className="dropdown-menu cat-menu">
                {categories.length === 0 && <li className="px-3 py-2 small text-muted">No categories yet</li>}
                {categories.map((c) => (
                  <li key={c}>
                    <Link className="dropdown-item" to={`/category/${encodeURIComponent(c)}`}>
                      {c}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="d-flex align-items-center gap-1 ms-auto">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => `nav-link-item ${isActive ? "active" : ""}`}
                >
                  {l.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>
      </header>

      {drawerOpen && (
        <>
          <div className="drawer-backdrop" onClick={() => setDrawerOpen(false)} />
          <aside className="drawer left" aria-label="Menu">
            <div className="drawer-head">
              <Link to="/" className="brand-logo" style={{ color: "var(--text)" }}>
                Cart<span>Corner</span>
              </Link>
              <button type="button" className="icon-btn" aria-label="Close menu" onClick={() => setDrawerOpen(false)}>
                <BsX />
              </button>
            </div>
            <div className="drawer-body">
              {NAV_LINKS.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end}
                  className={({ isActive }) => `drawer-link ${isActive ? "active" : ""}`}
                >
                  {l.label}
                </NavLink>
              ))}
              <NavLink to="/wishlist" className="drawer-link">Wishlist</NavLink>

              {categories.length > 0 && <div className="drawer-title">Categories</div>}
              {categories.map((c) => (
                <Link key={c} to={`/category/${encodeURIComponent(c)}`} className="drawer-link text-capitalize">
                  {c}
                </Link>
              ))}

              <div className="drawer-title">Account</div>
              {user ? (
                <>
                  <Link to="/my-profile" className="drawer-link"><BsPerson /> {user.firstname}'s profile</Link>
                  <Link to="/my-orders" className="drawer-link"><BsBoxSeam /> My orders</Link>
                  <button type="button" className="drawer-link border-0 bg-transparent w-100 text-danger" onClick={logoutCustomer}>
                    <BsBoxArrowRight /> Log out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="drawer-link">Log in</Link>
                  <Link to="/signup" className="drawer-link">Create account</Link>
                </>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
};

export default Header;
