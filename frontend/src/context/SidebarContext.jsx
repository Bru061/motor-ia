import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { SidebarContext } from "./sidebarContext";

function SidebarProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // Cierra el sidebar automáticamente al navegar a otra ruta,
  // para que no se quede abierto tapando la pantalla en móvil.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const toggle = useCallback(() => {
    setIsOpen((current) => !current);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const value = useMemo(() => ({ isOpen, toggle, close }), [isOpen, toggle, close]);

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export default SidebarProvider;
