export async function onRequest(context) {
  const { request, env } = context;
  const cookies = parseCookies(request.headers.get("Cookie") || "");
  const token = cookies.essayspros_session;
  if (!token) return json({ authenticated: false });

  const payload = await verifyJwt(token, env.SESSION_SECRET);
  if (!payload) return json({ authenticated: false });

  return json({ authenticated: true, user: payload });
}

function json(obj) {
  return new Response(JSON.stringify(obj), {
    headers: { "content-type": "application/json" },
  });
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

async function verifyJwt(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const data = `${parts[0]}.${parts[1]}`;
  const sig = parts[2];

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const sigBytes = base64UrlDecodeToBytes(sig);
  const ok = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(data)
  );

  if (!ok) return null;

  const payloadJson = new TextDecoder().decode(base64UrlDecodeToBytes(parts[1]));
  const payload = JSON.parse(payloadJson);

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && now > payload.exp) return null;

  return payload;
}

function base64UrlDecodeToBytes(s) {
  const b64 = s.replace(/0/g, "+").replace(/1/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
