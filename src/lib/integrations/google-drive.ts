import type { DriveSyncAdapter } from "./types";

/**
 * Stub Google Drive adapter. Plugs into src/lib/actions/projects.ts
 * (auto-create a folder when a project is created, if `google_drive` is
 * connected) and src/lib/actions/files.ts#createFileAction (upload the real
 * bytes instead of just recording metadata, once this returns a fileUrl).
 *
 * Real implementation notes:
 *  - OAuth: googleapis' `google.auth.OAuth2`, scope
 *    "https://www.googleapis.com/auth/drive.file" (only files the app
 *    creates — never full Drive access).
 *  - Folder structure mirrors spec section 12: one root folder per project,
 *    with per-category subfolders matching FileCategory.
 */
export const googleDriveAdapter: DriveSyncAdapter = {
  async createProjectFolder(): Promise<{ folderId: string; folderUrl: string }> {
    throw new Error(
      "Google Drive isn't connected in this environment. Connect it from Settings → Integrations once GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are configured."
    );
  },
  async uploadFile(): Promise<{ fileId: string; fileUrl: string }> {
    throw new Error("Google Drive sync is not configured.");
  },
};
