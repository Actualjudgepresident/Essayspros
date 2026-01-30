export async function onRequest(context) {
  const url = new URL(context.request.url);

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookie = context.request.headers.get("Cookie") || "";
  const stateMatch = cookie.match(/(?:^|;\s*)oauthstate=([^;]+)/);
  const storedState = stateMatch ? stateMatch[1] : null;

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }
  if (!state || !storedState || state !== storedState) {
    return new Response("Invalid state", { status: 400 });
  }

  const clientId = context.env.GOOGLECLIENTID;
  const clientSecret = context.env.GOOGLECLIENTSECRET;
  const appUrl = context.env.APPURL || url.origin;

  if (!clientId || !clientSecret) {
    return new Response("Missing Google client settings", { status: 500 });
  }

  const redirectUri = appUrl + "/auth/google/callback";

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    })
  });

  const tokenJson = await tokenRes.json();

  if (!tokenRes.ok) {
    return new Response(JSON.stringify(tokenJson), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  const idToken = tokenJson.id_token || "";

  const headers = new Headers();
  headers.set("Location", "/write.html");

  headers.append(
    "Set-Cookie",
    `glt=${idToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`
  );

  headers.append(
    "Set-Cookie",
    "oauthstate=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  );

  return new Response(null, { status: 302, headers });
}
