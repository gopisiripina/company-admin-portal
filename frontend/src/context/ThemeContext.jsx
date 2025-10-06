import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext({
  theme: "light",
  isDarkMode: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider = ({ children }) => {
  // Try persisted theme, then system preference, then default to light
  const getInitialTheme = () => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored;
    } catch (e) {
      // ignore
    }
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  };

  const [theme, setThemeState] = useState(getInitialTheme);
  const isDarkMode = theme === 'dark';

  // Apply or remove class on documentElement and persist choice
  useEffect(() => {
    const cls = "dark-theme";
    const el = document.documentElement;
    // Keep backwards-compatible class and also set data-theme attribute which
    // the project's CSS currently uses (:root[data-theme="dark"]).
    if (theme === "dark") {
      el.classList.add(cls);
      try {
        el.setAttribute('data-theme', 'dark');
      } catch (e) {
        // ignore if attribute can't be set
      }
    } else {
      el.classList.remove(cls);
      try {
        el.removeAttribute('data-theme');
      } catch (e) {
        // ignore
      }
    }
    try {
      localStorage.setItem("theme", theme);
    } catch (e) {
      // ignore write errors
    }
  }, [theme]);

  const setTheme = (value) => {
    if (value !== "light" && value !== "dark") return;
    setThemeState(value);
  };

  const toggleTheme = () => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
