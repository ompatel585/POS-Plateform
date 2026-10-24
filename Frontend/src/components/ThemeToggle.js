import React, { useState } from "react";
import { BsMoonStars, BsSun } from "react-icons/bs";
import { applyTheme, getInitialTheme } from "../utils/theme";

const ThemeToggle = ({ className = "icon-btn" }) => {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute("data-theme") || getInitialTheme()
  );

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return (
    <button
      type="button"
      className={`${className} theme-toggle`}
      onClick={toggle}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
    >
      {theme === "dark" ? <BsSun /> : <BsMoonStars />}
    </button>
  );
};

export default ThemeToggle;
