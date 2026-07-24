import { useContext } from "react";
import { SidebarContext } from "../context/sidebarContext";

function useSidebar() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebar debe usarse dentro de SidebarProvider");
  }

  return context;
}

export default useSidebar;
