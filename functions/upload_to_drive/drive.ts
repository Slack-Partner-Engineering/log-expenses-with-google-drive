/**
 * The `update` function updates a file in Google Drive using the provided ID, token, folder, name, description, and filetype.
 * It returns a Promise that resolves to a Response object containing the updated file information.
 * @param id - The ID of the file to update.
 * @param token - The authentication token for the Google Drive API.
 * @param filetype - The file type of the file.
 * @param folder - The ID of the parent folder for the file.
 * @param name - The name of the file. A default value is used if name is not provided.
 * @param description - The description of the file.
 * @returns A Promise that resolves to a Response object containing the updated file information.
 */

function update(
  id: string,
  token: string | undefined,
  filetype: string,
  folder?: string,
  name?: string,
  description?: string,
): Promise<Response> {
  // Base URL for Google Drive API
  const url = new URL(`https://content.googleapis.com/drive/v3/files/${id}`);

  // If parent folder id is provided, use it
  if (folder) {
    url.searchParams.append("addParents", folder);
  }
  return fetch(
    url,
    {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name ? `${name}.${filetype}` : `file-${Date.now()}.${filetype}`,
        description: description ?? "Uploaded from Slack",
      }),
    },
  );
}

export const drive = { update };
