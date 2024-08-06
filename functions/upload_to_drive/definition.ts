import { DefineFunction, Schema } from "deno-slack-sdk/mod.ts";

export const UploadToDrive = DefineFunction({
  callback_id: "upload_to_drive",
  title: "Upload a file to Google Drive",
  source_file: "functions/upload_to_drive/handler.ts",
  input_parameters: {
    properties: {
      googleAccessTokenId: {
        type: Schema.slack.types.oauth2,
        oauth2_provider_key: "google",
      },
      folder: {
        type: Schema.types.string,
      },
      name: {
        type: Schema.types.string,
        description: "",
      },
      description: {
        type: Schema.types.string,
      },
      file: {
        type: Schema.types.array,
        items: {
          type: Schema.slack.types.file_id,
          allowed_filetypes_group: "ALL",
        },
        maxItems: 1,
      },
    },
    required: ["googleAccessTokenId", "file"],
  },
  output_parameters: {
    properties: {
      id: {
        type: Schema.types.string,
        name: "ID",
      },
      extension: {
        type: Schema.types.string,
        name: "File extension",
      },
      link: {
        type: Schema.types.string,
        format: "url",
        name: "Link",
      },
    },
    required: [],
  },
});
