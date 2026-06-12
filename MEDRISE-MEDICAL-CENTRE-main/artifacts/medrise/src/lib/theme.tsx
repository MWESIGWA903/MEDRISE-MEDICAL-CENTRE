import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('medrise_theme');
      if (stored === 'dark' || stored === 'light') return stored;
    } catch (_) {}
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('medrise_theme', theme);
    } catch (_) {}
    // NOTE: .dark is NOT added to document.documentElement here.
    // Dark mode is scoped inside AdminLayout / StaffLayout containers only,
    // so the public website is structurally immune to any theme setting.
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
