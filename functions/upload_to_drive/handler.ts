import { SlackFunction } from "deno-slack-sdk/mod.ts";
import { UploadToDrive } from "./definition.ts";
import { drive } from "./drive.ts";

type DriveUpload = {
  kind: string;
  id: string;
  name: string;
  mimeType: string;
};

type DriveMetadata = {
  fileExtension: string;
  webViewLink: string;
};

export default SlackFunction(
  UploadToDrive,
  async ({ inputs, client, token }) => {
    // Gather required function inputs
    const { googleAccessTokenId, file } = inputs;

    // Gather optional function inputs
    const { folder, name, description } = inputs;

    // Get the Google access token
    const { external_token } = await client.apps.auth.external.get({
      external_token_id: googleAccessTokenId,
    });

    // Get info for the Slack-hosted file provided in the input
    const { file: { url_private_download, filetype } } = await client.files
      .info({
        file: file[0], // only one input file is supported in the function definition (maxItems: 1)
      });

    // Download the Slack-hosted file using download URL
    const headers = new Headers();
    headers.append("Authorization", `Bearer ${token}`);

    const response = await fetch(url_private_download, {
      method: "GET",
      headers,
    });

    // Create a new Blob from the downloaded file data from Slack-hosted file
    const fileData = await response.arrayBuffer();
    const fileBlob = new Blob([new Uint8Array(fileData)]);

    //
    // Creates/Uploads a new file in Google Drive
    //

    // Perform a simple upload to the root of the authenticated user's Drive
    // This upload type only uploads the file contents, metadata is set later
    const upload = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=media",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${external_token}`,
          "Content-Type": fileBlob.type,
        },
        body: fileBlob,
      },
    );

    if (!upload.ok) {
      return {
        error:
          `Could not upload file to Google Drive: ${upload.status}, ${upload.statusText}`,
        outputs: {},
      };
    }

    // Get the newly uploaded file id
    const { id }: DriveUpload = await upload.json();

    //
    // Rename newly uploaded file, and move it to a folder if desired
    //
    const update = await drive.update(
      id,
      external_token,
      filetype,
      folder,
      name,
      description,
    );

    if (!update.ok) {
      return {
        error:
          `File was uploaded but could not be renamed or moved: ${update.status}, ${update.statusText}`,
        outputs: { id },
      };
    }

    //
    // Get full file metadata
    //

    // Add more output fields to fields query parameter as needed
    // https://developers.google.com/drive/api/reference/rest/v3/files
    const metadata = await fetch(
      `https://www.googleapis.com/drive/v3/files/${id}?fields=fileExtension,webViewLink`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${external_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!metadata.ok) {
      return {
        error:
          `File was uploaded but there was an issue getting its metadata: ${update.status}, ${update.statusText}`,
        outputs: { id },
      };
    }

    // Get relevant properties
    const { fileExtension, webViewLink }: DriveMetadata = await metadata.json();

    return {
      outputs: { id, extension: fileExtension, link: webViewLink },
    };
  },
);
