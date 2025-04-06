import { drive_v3 } from 'googleapis';

export type GDUploadFileRequest = {
  body: any;
  fileName: string;
  mimeType: string;
  folderId?: string;
};
export type GDUploadFileResponse = {
  fileUrl: string;
} & drive_v3.Schema$File;
