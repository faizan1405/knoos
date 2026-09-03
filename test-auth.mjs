import Google from "@auth/core/providers/google";
console.log("Instantiating Google...");
const g = Google({
  clientId: "test",
  clientSecret: "test",
  authorization: {
    url: "https://accounts.google.com/o/oauth2/v2/auth",
    params: { prompt: "select_account", response_type: "code", scope: "openid profile email" }
  },
  token: "https://oauth2.googleapis.com/token",
  userinfo: "https://openidconnect.googleapis.com/v1/userinfo",
  jwks_endpoint: "https://www.googleapis.com/oauth2/v3/certs",
  issuer: "https://accounts.google.com",
});
console.log("Success:", g.id);
