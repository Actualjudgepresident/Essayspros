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

    async function finalizeLogin() {
      try {
        setMessage("Verifying session...");

        const res = await fetch("/api/me", {
          credentials: "include",
          cache: "no-store"
        });

        if (!res.ok) {
          window.location.replace("/auth/google/login.html");
          return;
        }

        window.location.replace(safeReturnPath());
      } catch {
        window.location.replace("/auth/google/login.html");
      }
    }

    finalizeLogin();
  }, []);

  return (
    <div style={{ padding: 24, fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 20, margin: 0 }}>Signing in</h1>
      <p style={{ marginTop: 10 }}>{message}</p>
    </div>
  );
}
