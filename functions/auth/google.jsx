export async function onRequest(context) {
  const { env } = context;

  const clientId = env.GOOGLE_CLIENT_ID;
  const baseUrl = env.BASE_URL;

  const state = crypto.randomUUID();

  const redirectUri = `${baseUrl}/auth/callback`;
  const scope = encodeURIComponent("openid email profile");

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${scope}` +
    `&state=${encodeURIComponent(state)}` +
    `&access_type=online` +
    `&prompt=select_account`;

  return new Response(null, {
    status: 302,
    headers: {
      Location: authUrl,
      "Set-Cookie": makeCookie("oauth_state", state, { maxAge: 600 }),
    },
  });
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
