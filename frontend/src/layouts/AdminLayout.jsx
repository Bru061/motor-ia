import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import SidebarProvider from "../context/SidebarContext.jsx";
import "../styles/Layout.css";

function AdminLayout() {
  return (
    <SidebarProvider>
      <div className="app-layout">
        <Sidebar type="admin" />

        <div className="layout-content">
          <Header />

          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default AdminLayout;
