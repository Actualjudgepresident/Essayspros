export async function onRequest(context) {
  const { request, env } = context;

  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  if (!code || !state) return new Response("Missing code or state", { status: 400 });

  const cookies = parseCookies(request.headers.get("Cookie") || "");
  if (!cookies.oauth_state || cookies.oauth_state !== state) {
    return new Response("Invalid state", { status: 400 });
  }

  const token = await exchangeCodeForToken(code, env);

  const idToken = token.id_token;
  if (!idToken) return new Response("Missing id_token", { status: 400 });

  const profile = await validateWithTokenInfo(idToken);
  if (!profile.email) return new Response("No email in token", { status: 400 });

  const sessionPayload = {
    sub: profile.sub,
    email: profile.email,
    name: profile.name || "",
    picture: profile.picture || "",
  };

  const jwt = await signJwt(sessionPayload, env.SESSION_SECRET);

  return new Response(null, {
    status: 302,
    headers: {
      Location: "/orders.html",
      "Set-Cookie": [
        clearCookie("oauth_state"),
        makeCookie("essayspros_session", jwt, { maxAge: 60 * 60 * 24 * 7 }),
      ].join(", "),
    },
  });
}

async function exchangeCodeForToken(code, env) {
  const redirectUri = `${env.BASE_URL}/auth/callback`;

  const form = new URLSearchParams();
  form.set("code", code);
  form.set("client_id", env.GOOGLE_CLIENT_ID);
  form.set("client_secret", env.GOOGLE_CLIENT_SECRET);
  form.set("redirect_uri", redirectUri);
  form.set("grant_type", "authorization_code");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token exchange failed: ${text}`);
  }
  return res.json();
}

async function validateWithTokenInfo(idToken) {
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Token validation failed: ${text}`);
  }
  return res.json();
}

function parseCookies(cookieHeader) {
  const out = {};
  cookieHeader.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i === -1) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    out[k] = decodeURIComponent(v);
  });
  return out;
}

function makeCookie(name, value, opts = {}) {
  const parts = [];
  parts.push(`${name}=${encodeURIComponent(value)}`);
  parts.push("Path=/");
  parts.push("HttpOnly");
  parts.push("Secure");
  parts.push("SameSite=Lax");
  if (opts.maxAge) parts.push(`Max-Age=${opts.maxAge}`);
  return parts.join("; ");
}

function clearCookie(name) {
  return `${name}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const exp = iat + 60 * 60 * 24 * 7;

  const body = { ...payload, iat, exp };

  const encHeader = base64UrlEncode(JSON.stringify(header));
  const encBody = base64UrlEncode(JSON.stringify(body));
  const data = `${encHeader}.${encBody}`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  const sig = base64UrlEncodeBytes(new Uint8Array(sigBuf));

  return `${data}.${sig}`;
}

function base64UrlEncode(str) {
  const bytes = new TextEncoder().encode(str);
  return base64UrlEncodeBytes(bytes);
}

function base64UrlEncodeBytes(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "0").replace(/\//g, "1").replace(/=+$/g, "");
}
