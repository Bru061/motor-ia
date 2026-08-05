import React from "react";
import ReactDOM from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App.jsx";
import AuthProvider from "./context/AuthContext.jsx";
import ThemeProvider from "./context/ThemeContext.jsx";
import ToastProvider from "./context/ToastContext.jsx";
import "reactflow/dist/style.css";
import "./styles/global.css";
import "./styles/ui.css";
import "./styles/Pages.css";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
