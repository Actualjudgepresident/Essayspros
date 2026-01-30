export async function onRequest(context) {
  const url = new URL(context.request.url);

  const clientId = context.env.GOOGLECLIENTID;
  const appUrl = context.env.APPURL || url.origin;

  if (!clientId) {
    return new Response("Missing GOOGLECLIENTID", { status: 500 });
  }

  const redirectUri = appUrl + "/auth/google/callback";
  const state = crypto.randomUUID();

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("redirect_uri", redirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("access_type", "online");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  const headers = new Headers();
  headers.set("Location", authUrl.toString());
  headers.append(
    "Set-Cookie",
    `oauthstate=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );

  return new Response(null, { status: 302, headers });
}
