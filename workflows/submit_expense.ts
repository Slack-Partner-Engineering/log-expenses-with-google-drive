import { DefineWorkflow, Schema } from "deno-slack-sdk/mod.ts";
import { UploadToDrive } from "../functions/upload_to_drive/definition.ts";
import { Connectors } from "deno-slack-hub/mod.ts";
import "std/dotenv/load.ts";

/**
 * A workflow is a set of steps that are executed in order.
 * Each step in a workflow is a function.
 * https://api.slack.com/automation/workflows
 */
const SubmitExpenseWorkflow = DefineWorkflow({
  callback_id: "submit_expense",
  title: "Submit an expense",
  description: "Record an expense's details and upload the receipt",
  input_parameters: {
    properties: {
      interactivity: {
        type: Schema.slack.types.interactivity,
      },
      timestamp: {
        type: Schema.slack.types.timestamp,
      },
      user_id: {
        type: Schema.slack.types.user_id,
      },
    },
    required: ["interactivity"],
  },
});

/**
 * For collecting input from users, we recommend the
 * built-in OpenForm function as a first step.
 * https://api.slack.com/automation/functions#open-a-form
 */
const inputForm = SubmitExpenseWorkflow.addStep(
  Schema.slack.functions.OpenForm,
  {
    title: "Expense details",
    interactivity: SubmitExpenseWorkflow.inputs.interactivity,
    submit_label: "Submit",
    fields: {
      elements: [
        {
          name: "date",
          title: "Transaction date",
          type: Schema.slack.types.date,
        },
        {
          name: "type",
          title: "Expense type",
          type: Schema.types.string,
          enum: [
            "meal",
            "supplies",
            "hotel",
            "taxi",
            "software",
            "bank",
            "other",
          ],
          choices: [
            {
              value: "meal",
              title: "Individual meal",
            },
            {
              value: "supplies",
              title: "Office supplies",
            },
            {
              value: "hotel",
              title: "Hotel & Lodging",
            },
            {
              value: "taxi",
              title: "Taxi & ride sharing",
            },
            {
              value: "software",
              title: "Software",
            },
            {
              value: "bank",
              title: "Bank & FX fees",
            },
            {
              value: "other",
              title: "Other",
            },
          ],
        },
        {
          name: "description",
          title: "Expense description",
          type: Schema.types.string,
          default: "My personal expense",
          long: true,
        },
        {
          name: "amount",
          title: "Amount ($CAD)",
          type: Schema.types.number,
          minimum: 0,
          default: 100,
        },
        {
          name: "receipt",
          title: "Receipt or invoice",
          type: Schema.types.array,
          maxItems: 1,
          items: {
            type: Schema.slack.types.file_id,
            allowed_filetypes: ["pdf", "png", "jpg", "gif"],
          },
        },
      ],
      required: ["date", "type", "description", "amount", "receipt"],
    },
  },
);

// Upload the file to Drive
// Only the googleAccessTokenId and file inputs are required
const uploadToDrive = SubmitExpenseWorkflow.addStep(
  UploadToDrive,
  {
    googleAccessTokenId: { credential_source: "DEVELOPER" },
    folder: Deno.env.get("PARENT_FOLDER_ID")!,
    description: inputForm.outputs.fields.description,
    name: `${SubmitExpenseWorkflow.inputs.interactivity.interactor.id}-receipt`,
    file: inputForm.outputs.fields.receipt,
  },
);

SubmitExpenseWorkflow.addStep(
  Connectors.GoogleSheets.functions.AddSpreadsheetRow,
  {
    // The ID of the spreadsheet
    spreadsheet_id: Deno.env.get("GOOGLE_SPREADSHEET_ID"),

    // The title of the sheet where the columns can be found
    sheet_title: Deno.env.get("GOOGLE_SHEET_TITLE"),

    // Add a new row to the sheet
    columns: {
      "0": SubmitExpenseWorkflow.inputs.timestamp,
      "1": inputForm.outputs.fields.date,
      "2": SubmitExpenseWorkflow.inputs.user_id,
      "3": inputForm.outputs.fields.type,
      "4": inputForm.outputs.fields.amount,
      "5": inputForm.outputs.fields.description,
      "6": uploadToDrive.outputs.link,
    },

    // TODO: credential source should be DEVELOPER but there is an issue selecting the auth
    google_access_token: { credential_source: "END_USER" },
  },
);

// Send the user DM to let them know the submission was successful
SubmitExpenseWorkflow.addStep(Schema.slack.functions.SendDm, {
  user_id: SubmitExpenseWorkflow.inputs.interactivity.interactor.id,
  message:
    `_Your expense was successfully submitted!_\n*Description*\n${inputForm.outputs.fields.description}\n\n*Amount*\n\`$${inputForm.outputs.fields.amount}\``,
});

export default SubmitExpenseWorkflow;
