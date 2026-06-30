import { Outlet } from "react-router-dom";
import "../components/layout/Layout.css";

function PublicLayout() {
  return (
    <main className="public-layout">
      <div className="public-card">
        <Outlet />
      </div>
    </main>
  );
}

export default PublicLayout;