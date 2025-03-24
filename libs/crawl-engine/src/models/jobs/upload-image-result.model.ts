import { IUploadMinioResponse$1 } from './upload-minio-response.model';

export interface IUploadImageResultModel$1 extends IUploadMinioResponse$1 {
  fileUrl: string | null;
  fileName: string | null;
  bucketName: string | null;
  position: number;
  originUrls: string[];
}
