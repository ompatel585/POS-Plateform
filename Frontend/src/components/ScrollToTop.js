import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { BsArrowUp } from "react-icons/bs";

// Jumps to the top on every route change and shows a "back to top" button on long pages
const ScrollToTop = () => {
  const { pathname } = useLocation();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setShowButton(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!showButton) return null;
  return (
    <button
      type="button"
      className="scroll-top"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <BsArrowUp />
    </button>
  );
};

export default ScrollToTop;
