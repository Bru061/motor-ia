import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import "../styles/Layout.css";

function AdminLayout() {
  return (
    <div className="app-layout">
      <Sidebar type="admin" />

      <div className="layout-content">
        <Header title="Administrador" initials="A" />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
