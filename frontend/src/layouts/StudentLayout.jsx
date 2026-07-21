import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import Header from "../components/layout/Header";
import "../styles/Layout.css";

function StudentLayout() {
  return (
    <div className="app-layout">
      <Sidebar type="student" />

      <div className="layout-content">
        <Header />

        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
