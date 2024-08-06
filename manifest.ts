import { Manifest } from "deno-slack-sdk/mod.ts";
import SubmitExpenseWorkflow from "./workflows/submit_expense.ts";
import GoogleProvider from "./external_auth/google_provider.ts";

/**
 * The app manifest contains the app's configuration. This
 * file defines attributes like app name and description.
 * https://api.slack.com/automation/manifest
 */
export default Manifest({
  name: "Expenses app",
  description: "File expenses directly from Slack",
  icon: "assets/icon.png",
  externalAuthProviders: [GoogleProvider],
  workflows: [SubmitExpenseWorkflow],
  outgoingDomains: ["files.slack.com", "www.googleapis.com", "content.googleapis.com"],
  botScopes: ["commands", "chat:write", "chat:write.public", "files:read"],
});
