import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, forceLightTheme = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  useEffect(() => {
    // If forceLightTheme is true, always use light theme
    const theme = forceLightTheme ? 'light' : (isDarkMode ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    document.body.style.backgroundColor = forceLightTheme ? '#ffffff' : '';
    localStorage.setItem('theme', theme);
  }, [isDarkMode, forceLightTheme]);

  const toggleTheme = () => {
    console.log('Toggle theme called. Current mode:', isDarkMode); // Debug log
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
