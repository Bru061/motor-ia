import { useContext } from "react";
import { ThemeContext } from "../context/themeContext";

function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme debe usarse dentro de ThemeProvider");
  }

  return context;
}

export default useTheme;
