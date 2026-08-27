import * as React from "react";

// Dark mode has been removed site-wide — the app is light-only. This context
// stays only so components (like the sonner Toaster) that read a theme value
// keep working without changes.
interface ThemeContextValue {
  resolvedTheme: "light";
}

const ThemeContext = React.createContext<ThemeContextValue>({ resolvedTheme: "light" });

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("dark");
    root.classList.add("light");
  }, []);

  return (
    <ThemeContext.Provider value={{ resolvedTheme: "light" }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
