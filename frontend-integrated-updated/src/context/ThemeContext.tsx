import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type ThemeName =
  | "pink"
  | "purple"
  | "emerald"
  | "teal"
  | "sunset"
  | "ruby";

type Theme = {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primarySoft: string;
};

const themes: Record<ThemeName, Theme> = {
  /* =====================================================
     SUBTLE PINK - DEFAULT
     ===================================================== */
  pink: {
    primary: "#d86b8a",
    primaryDark: "#b95572",
    primaryLight: "#f7dce5",
    primarySoft: "#fdf3f6",
  },

  /* =====================================================
     PURPLE
     ===================================================== */
  purple: {
    primary: "#7c3aed",
    primaryDark: "#6d28d9",
    primaryLight: "#ede9fe",
    primarySoft: "#f5f3ff",
  },

  /* =====================================================
     EMERALD
     ===================================================== */
  emerald: {
    primary: "#059669",
    primaryDark: "#047857",
    primaryLight: "#d1fae5",
    primarySoft: "#ecfdf5",
  },

  /* =====================================================
     TEAL
     ===================================================== */
  teal: {
    primary: "#0f766e",
    primaryDark: "#115e59",
    primaryLight: "#ccfbf1",
    primarySoft: "#f0fdfa",
  },

  /* =====================================================
     SUNSET
     ===================================================== */
  sunset: {
    primary: "#ea580c",
    primaryDark: "#c2410c",
    primaryLight: "#ffedd5",
    primarySoft: "#fff7ed",
  },

  /* =====================================================
     RUBY
     ===================================================== */
  ruby: {
    primary: "#dc2626",
    primaryDark: "#b91c1c",
    primaryLight: "#fee2e2",
    primarySoft: "#fef2f2",
  },
};

type ThemeContextType = {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  themes: typeof themes;
};

const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

export function ThemeProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const savedTheme = localStorage.getItem(
      "novacart-theme"
    ) as ThemeName | null;

    return savedTheme && themes[savedTheme]
      ? savedTheme
      : "pink";
  });

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);

    localStorage.setItem(
      "novacart-theme",
      newTheme
    );
  };

  useEffect(() => {
    const selectedTheme = themes[theme];

    const root = document.documentElement;

    root.style.setProperty(
      "--primary",
      selectedTheme.primary
    );

    root.style.setProperty(
      "--primary-dark",
      selectedTheme.primaryDark
    );

    root.style.setProperty(
      "--primary-light",
      selectedTheme.primaryLight
    );

    root.style.setProperty(
      "--primary-soft",
      selectedTheme.primarySoft
    );
  }, [theme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}