import { useEffect, useState } from "react";

export default function Callback() {
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    const STORAGE_KEY = "essayspros_active_email";

    function safeReturnPath() {
      const raw = (localStorage.getItem("returnAfterAuth") || "").trim();
      if (!raw) return "/orders.html";
      if (!raw.startsWith("/")) return "/orders.html";
      if (raw.includes("://")) return "/orders.html";
      return raw;
    }

    function setEmail(email) {
      const v = String(email || "").trim();
      if (v) localStorage.setItem(STORAGE_KEY, v);
      else localStorage.removeItem(STORAGE_KEY);
    }

    function extractEmailFromUrl() {
      const url = new URL(window.location.href);

      const candidates = [
        url.searchParams.get("email"),
        url.searchParams.get("user"),
        url.searchParams.get("username")
      ];

      const found = candidates.find(Boolean);
      return (found || "").trim();
    }

    async function fetchMeEmail() {
      const endpoints = [
        "/auth/me",
        "/api/auth/me",
        "/auth/user",
        "/api/user",
        "/api/me"
      ];

      for (const ep of endpoints) {
        try {
          const res = await fetch(ep, { credentials: "include" });
          if (!res.ok) continue;

          const data = await res.json();

          const email =
            String(data?.email || data?.user?.email || data?.profile?.email || "").trim();

          if (email) return email;
        } catch {
          continue;
        }
      }

      return "";
    }

    async function run() {
      try {
        setMessage("Finalizing authentication...");

        const fromUrl = extractEmailFromUrl();
        if (fromUrl) {
          setEmail(fromUrl);
          window.location.replace(safeReturnPath());
          return;
        }

        const fromApi = await fetchMeEmail();
        if (fromApi) {
          setEmail(fromApi);
          window.location.replace(safeReturnPath());
          return;
        }

        setEmail("");
        localStorage.setItem("auth_error", "Could not determine signed in email.");
        window.location.replace("/auth/google/login.html");
      } catch {
        setEmail("");
        localStorage.setItem("auth_error", "Callback failed.");
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
