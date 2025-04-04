export const enum QueueName {
  QUEUE_CRAWL = "crawl-queue",
}

export const enum JobName {
  CRAWL_COMIC = "crawl-comic",
  CRAWL_IMAGE = "crawl-image",
  CRAWL_CHAPTER = "crawl-chapter",
  UPDATE_COMIC = "update-comic",
  UPLOAD_DRIVE = "upload-image-to-drive",
  UPDATE_STATUS_CRAWLING_COMIC_DONE = "update-status-comic-crawling-to-done",
  UPDATE_STATUS_CRAWLING_CHAPTER_DONE = "update-status-chapter-crawling-to-done",
  UPDATE_THUMB_IMAGE_TO_COMIC = "update-thumb-image-to-comic",
}

export const enum FlowName {
  CRAWL_COMIC = "crawl-comic-flow",
}

export enum CrawlingStatus {
  ON_CRAWL = "0000",
  DONE = "9999",
}
