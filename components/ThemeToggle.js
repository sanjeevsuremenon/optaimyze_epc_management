import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className="h-10 w-10 rounded-lg border border-app-border bg-app-surface"
        aria-hidden
      />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <div
      className="flex items-center rounded-lg border border-app-border bg-app-surface p-1 shadow-sm"
      role="group"
      aria-label="Theme"
    >
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-1 ${
          !isDark
            ? "bg-app-accent-soft text-app-accent"
            : "text-app-text-muted hover:bg-app-surface-muted hover:text-app-text"
        }`}
        aria-label="Light theme"
        aria-pressed={!isDark}
        title="Light theme"
      >
        <Sun className="h-4 w-4" aria-hidden />
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition focus:outline-none focus:ring-2 focus:ring-app-accent focus:ring-offset-1 ${
          isDark
            ? "bg-app-accent-soft text-app-accent"
            : "text-app-text-muted hover:bg-app-surface-muted hover:text-app-text"
        }`}
        aria-label="Dark theme"
        aria-pressed={isDark}
        title="Dark theme"
      >
        <Moon className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
