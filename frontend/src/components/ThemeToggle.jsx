import { Sun, Moon } from "lucide-react";
import { useTheme } from "./Theme";
export default function ThemeToggle() {
  const { lit, toggle } = useTheme();
  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={lit ? "Use dark theme" : "Use light theme"}
      aria-pressed={lit}
      onClick={toggle}
    >
      {lit ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
}
