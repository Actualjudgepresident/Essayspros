// pages/auth/google/callback.jsx (or wherever you render the callback page in your site)
// This is React and stays .jsx, but it should not try to store email.
// It should only redirect to the correct page after the server sets the cookie.

import { useEffect, useState } from "react";

export default function Callback() {
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    function safeReturnPath() {
      const raw = (localStorage.getItem("returnAfterAuth") || "").trim();
      if (!raw) return "/orders.html";
      if (!raw.startsWith("/")) return "/orders.html";
      if (raw.includes("://")) return "/orders.html";
      return raw;
    }

    async function run() {
      try {
        setMessage("Verifying session...");

        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
          window.location.replace("/auth/google/login.html");
          return;
        }

        window.location.replace(safeReturnPath());
      } catch {
        window.location.replace("/auth/google/login.html");
      }
    }

    run();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Signing in</h1>
      <p style={{ marginTop: 10 }}>{message}</p>
    </div>
  );
}
