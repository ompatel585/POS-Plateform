import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import moment from "moment";
import { toast } from "react-toastify";
import {
  BsTruck,
  BsCashStack,
  BsArrowRepeat,
  BsHeadset,
  BsChevronLeft,
  BsChevronRight,
} from "react-icons/bs";
import Container from "../components/Container";
import Meta from "../components/Meta";
import BlogCard from "../components/BlogCard";
import ProductGrid from "../components/ProductCard";
import ShopTheLook from "../components/ShopTheLook";
import RecentlyViewed from "../components/RecentlyViewed";
import { getAllBlogs } from "../features/blogs/blogSlice";
import { getAllProducts } from "../features/products/productSlilce";
import { base_url } from "../utils/axiosConfig";
import { formatPrice, FREE_SHIPPING_ABOVE } from "../utils/pricing";

const SLIDES = [
  {
    image: "/images/main-banner-1.jpg",
    eyebrow: "Just landed",
    title: "Fresh arrivals, every week",
    text: "Discover the newest products from the brands you love.",
    cta: "Shop new arrivals",
    to: "/product",
  },
  {
    image: "/images/main-banner.jpg",
    eyebrow: "Tech & gadgets",
    title: "Upgrade your everyday",
    text: "Laptops, audio and accessories picked for work and play.",
    cta: "Browse the store",
    to: "/product",
  },
  {
    image: "/images/catbanner-03.jpg",
    eyebrow: "Free delivery",
    title: `Free shipping over ${formatPrice(FREE_SHIPPING_ABOVE)}`,
    text: "Fast, tracked delivery across India with easy returns.",
    cta: "Start shopping",
    to: "/product",
  },
];

const SERVICES = [
  { icon: <BsTruck />, title: "Free shipping", text: `On orders over ${formatPrice(FREE_SHIPPING_ABOVE)}` },
  { icon: <BsCashStack />, title: "Cash on delivery", text: "Pay when your order arrives" },
  { icon: <BsArrowRepeat />, title: "Easy returns", text: "Hassle-free refunds" },
  { icon: <BsHeadset />, title: "Support", text: "We're here to help" },
];

const SLIDE_MS = 5000;

const HeroCarousel = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), SLIDE_MS);
    return () => clearInterval(id);
  }, [paused]);

  const go = (delta) => setIndex((i) => (i + delta + SLIDES.length) % SLIDES.length);

  return (
    <div
      className="hero"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      {SLIDES.map((s, i) => (
        <div key={s.title} className={`hero-slide ${i === index ? "active" : ""}`} aria-hidden={i !== index}>
          <img src={s.image} alt="" />
          <div className="hero-content">
            <span className="hero-eyebrow">{s.eyebrow}</span>
            <h1>{s.title}</h1>
            <p>{s.text}</p>
            <Link to={s.to} className="button button-accent" tabIndex={i === index ? 0 : -1}>
              {s.cta}
            </Link>
          </div>
        </div>
      ))}
      <button type="button" className="hero-arrow prev" aria-label="Previous slide" onClick={() => go(-1)}>
        <BsChevronLeft />
      </button>
      <button type="button" className="hero-arrow next" aria-label="Next slide" onClick={() => go(1)}>
        <BsChevronRight />
      </button>
      <div className="hero-controls">
        {SLIDES.map((s, i) => (
          <button
            type="button"
            key={s.title}
            className={`hero-dot ${i === index ? "active" : ""}`}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
};

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  // Sign-ups are stored as enquiries so they show up in the admin panel
  const subscribe = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email");
    setSending(true);
    try {
      await axios.post(`${base_url}enquiry`, {
        name: "Newsletter subscriber",
        email,
        mobile: "-",
        comment: "Newsletter sign-up from the home page",
      });
      toast.success("Thanks for subscribing!");
      setEmail("");
    } catch {
      toast.error("Could not subscribe right now, please try again");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="newsletter-band">
      <div>
        <h3>Get the good stuff first</h3>
        <p>New arrivals, restocks and member-only offers in your inbox.</p>
      </div>
      <form className="newsletter-form" onSubmit={subscribe}>
        <input
          type="email"
          placeholder="Your email address"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button type="submit" className="button button-accent" disabled={sending}>
          {sending ? "Subscribing…" : "Subscribe"}
        </button>
      </form>
    </div>
  );
};

const Section = ({ title, subtitle, link, children }) => (
  <Container class1="py-4">
    <div className="section-head">
      <div>
        <h2 className="section-heading">{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {link && (
        <Link to={link} className="section-link">
          View all →
        </Link>
      )}
    </div>
    {children}
  </Container>
);

const Home = () => {
  const dispatch = useDispatch();
  const blogState = useSelector((state) => state?.blog?.blog);
  const productState = useSelector((state) => state?.product?.product);
  const loading = useSelector((state) => state?.product?.isLoading);

  useEffect(() => {
    dispatch(getAllBlogs());
    dispatch(getAllProducts());
  }, [dispatch]);

  const products = useMemo(() => (Array.isArray(productState) ? productState : []), [productState]);

  const categories = useMemo(() => {
    const map = new Map();
    products.forEach((p) => {
      if (!p.category) return;
      const entry = map.get(p.category) || { name: p.category, count: 0, image: null };
      entry.count += 1;
      entry.image = entry.image || p.images?.[0]?.url;
      map.set(p.category, entry);
    });
    return [...map.values()].sort((a, b) => b.count - a.count).slice(0, 12);
  }, [products]);

  const newArrivals = useMemo(
    () => [...products].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 8),
    [products]
  );
  const bestSellers = useMemo(
    () => [...products].filter((p) => p.sold > 0).sort((a, b) => b.sold - a.sold).slice(0, 8),
    [products]
  );
  const byTag = (tag) => products.filter((p) => p.tags === tag).slice(0, 8);
  const featured = byTag("featured");
  const special = byTag("special");
  const popular = byTag("popular");

  const showGrid = (list) => loading || list.length > 0;

  return (
    <>
      <Meta title="Cart Corner – Shop online" />

      <Container class1="pt-4 pb-3">
        <div className="row g-3">
          <div className="col-12 col-lg-8">
            <HeroCarousel />
          </div>
          <div className="col-12 col-lg-4 d-flex flex-column flex-sm-row flex-lg-column gap-3">
            <Link to="/product" className="promo-tile flex-fill">
              <img src="/images/catbanner-01.jpg" alt="" />
              <div className="promo-content">
                <h4>Best sellers</h4>
                <h5>Laptops & more</h5>
                <p>Power for every task</p>
              </div>
            </Link>
            <Link to="/product" className="promo-tile flex-fill">
              <img src="/images/catbanner-02.jpg" alt="" />
              <div className="promo-content">
                <h4>New arrival</h4>
                <h5>Smart watches</h5>
                <p>Track every move</p>
              </div>
            </Link>
          </div>
        </div>
      </Container>

      <Container class1="py-3">
        <div className="service-strip">
          {SERVICES.map((s) => (
            <div className="service-item" key={s.title}>
              <div className="service-icon">{s.icon}</div>
              <div>
                <h6>{s.title}</h6>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      {categories.length > 0 && (
        <Section title="Shop by category" subtitle="Find exactly what you're looking for">
          <div className="category-grid">
            {categories.map((c) => (
              <Link key={c.name} to={`/category/${encodeURIComponent(c.name)}`} className="category-tile">
                <div className="category-thumb">
                  {c.image ? <img src={c.image} alt="" loading="lazy" /> : c.name.charAt(0)}
                </div>
                <div>
                  <div className="name">{c.name}</div>
                  <div className="count">{c.count} {c.count === 1 ? "product" : "products"}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {showGrid(newArrivals) && (
        <Section title="New arrivals" subtitle="The latest additions to the store" link="/product?sort=-createdAt">
          <ProductGrid products={newArrivals} loading={loading} skeletons={4} />
        </Section>
      )}

      <Container class1="py-4">
        <ShopTheLook products={products} />
      </Container>

      {bestSellers.length > 0 && (
        <Section title="Best sellers" subtitle="What everyone's buying right now" link="/product?sort=-sold">
          <ProductGrid products={bestSellers} />
        </Section>
      )}

      {featured.length > 0 && (
        <Section title="Featured collection">
          <ProductGrid products={featured} />
        </Section>
      )}
      {special.length > 0 && (
        <Section title="Special products">
          <ProductGrid products={special} />
        </Section>
      )}
      {popular.length > 0 && (
        <Section title="Popular products">
          <ProductGrid products={popular} />
        </Section>
      )}

      <Container class1="py-4">
        <RecentlyViewed />
      </Container>

      {Array.isArray(blogState) && blogState.length > 0 && (
        <Section title="From the blog" link="/blogs">
          <div className="row g-3">
            {blogState.slice(0, 4).map((item) => (
              <div className="col-12 col-sm-6 col-lg-3" key={item._id}>
                <BlogCard
                  id={item?._id}
                  title={item?.title}
                  description={item?.description}
                  image={item?.images?.[0]?.url}
                  date={moment(item?.createdAt).format("MMM D, YYYY")}
                />
              </div>
            ))}
          </div>
        </Section>
      )}

      <Container class1="py-4">
        <Newsletter />
      </Container>
    </>
  );
};

export default Home;
