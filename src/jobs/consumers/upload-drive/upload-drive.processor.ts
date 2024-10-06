import { ConstantBase } from "@/common/utils/constant.base";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { UploadDriveConstant } from "./upload-drive.constant";
import { UploadDriveService } from "./upload-drive.service";

@Injectable()
@Processor(ConstantBase.QUEUE_UPLOAD_NAME)
export class UploadDriveProcessor extends WorkerHost { 
    constructor(
        private readonly uploadService: UploadDriveService,
    )     {
        super()
    }

    async process(job: Job) {
        switch (job.name) {
            case UploadDriveConstant.UPLOAD_JOB_NAME: {
                return this.uploadService.handleUploadImage(job)
            }
            default: throw new Error (`Invalid name: ${job.name} to process`)
        }
        
    }   

}