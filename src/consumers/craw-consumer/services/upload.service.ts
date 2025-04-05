import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

import { nanoid } from "nanoid";
import { UploadDriveResponse } from "../../../common";
import { Utils } from "../../../utils";
import { GoogleDriveService } from "@libs/google-drive";

interface IUploadService {
  uploadToDriveGoogle(file: Buffer, contentType: string, fileName: string): Promise<UploadDriveResponse>;

  generateFileName(prefixFileName: string, contentType: string): Promise<string>;
}

@Injectable()
export class UploadService implements IUploadService {
  private logger = new Logger(UploadService.name);

  constructor(
    private configService: ConfigService,
    private googleDriveService: GoogleDriveService,
  ) {}

  private get driverUploadImageFolder() {
    return this.configService.get("google-drive.upload-image-folder-id");
  }

  async uploadToDriveGoogle(file: Buffer, contentType: string, fileName: string): Promise<UploadDriveResponse> {
    const response = await this.googleDriveService.uploadFile({
      fileName,
      body: GoogleDriveService.bufferToStream(file),
      mimeType: contentType,
      folderId: this.driverUploadImageFolder,
    });
    if (response.status !== 200) {
      throw new Error("Fail to upload to drive");
    }

    return {
      fileName,
      fileUrl: await this.googleDriveService.getFileURL(response.data.id),
      parentFolderId: this.driverUploadImageFolder,
    };
  }

  async generateFileName(prefixFileName: string, contentType: string) {
    const extension = Utils.getFileExtensionFromContentType(contentType);
    if (!extension) {
      throw new Error("Unsupported content type");
    }
    const hash = nanoid(10);
    return `${prefixFileName}-${hash}.${extension}`;
  }
}
