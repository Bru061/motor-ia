import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import ToastProvider from "./context/ToastContext.jsx";
import "reactflow/dist/style.css";
import "./styles/global.css";
import "./styles/ui.css";
import "./styles/Pages.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
