export async function onRequest() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/",
      "Set-Cookie": "essayspros_session=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax",
    },
  });
}
