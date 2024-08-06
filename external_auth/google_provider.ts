import { DefineOAuth2Provider, Schema } from "deno-slack-sdk/mod.ts";
import "std/dotenv/load.ts";

const GoogleProvider = DefineOAuth2Provider({
  provider_key: "google",
  provider_type: Schema.providers.oauth2.CUSTOM,
  options: {
    provider_name: "Google",
    authorization_url: "https://accounts.google.com/o/oauth2/auth",
    token_url: "https://oauth2.googleapis.com/token",
    client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/drive.file",
    ],
    authorization_url_extras: {
      prompt: "consent",
      access_type: "offline",
    },
    identity_config: {
      url: "https://www.googleapis.com/oauth2/v1/userinfo",
      account_identifier: "$.email",
    },
  },
});

export default GoogleProvider;
