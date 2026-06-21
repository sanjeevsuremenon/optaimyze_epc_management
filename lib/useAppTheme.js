import { useTheme } from "next-themes";

/** Returns 'light' | 'dark' for shared components that support both themes. */
export function useAppTheme() {
  const { resolvedTheme } = useTheme();
  return resolvedTheme === "dark" ? "dark" : "light";
}
