import { createContext, useContext, useLayoutEffect, useState } from "react";
const ThemeContext = createContext(null);
export function ThemeProvider({ children }) {
  const [lit, setLit] = useState(() => {
    try {
      return localStorage.getItem("estrade-light") === "on";
    } catch {
      return false;
    }
  });
  useLayoutEffect(() => {
    document.documentElement.dataset.light = lit ? "on" : "off";
    try {
      localStorage.setItem("estrade-light", lit ? "on" : "off");
    } catch {
      /* Storage is optional. */
    }
  }, [lit]);
  return (
    <ThemeContext.Provider
      value={{ lit, toggle: () => setLit((value) => !value) }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
