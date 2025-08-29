import { validate } from 'class-validator';
import { UploadImageToDriveJobModel } from './upload-image-to-drive-job.model';

describe('UploadImageToDriveJobModel', () => {
  let model: UploadImageToDriveJobModel;

  beforeEach(() => {
    model = new UploadImageToDriveJobModel();
  });

  it('should be defined', () => {
    expect(model).toBeDefined();
  });

  it('should validate a valid model', async () => {
    model.bucket = 'test-bucket';
    model.url = 'https://example.com/image.jpg';
    model.fileName = 'test-image.jpg';
    model.chapterId = 1;
    model.comicId = 1;
    model.imageId = 1;
    model.position = 1;

    const errors = await validate(model);
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with missing required fields', async () => {
    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('should fail validation with empty bucket', async () => {
    model.bucket = '';
    model.url = 'https://example.com/image.jpg';
    model.fileName = 'test-image.jpg';
    model.chapterId = 1;
    model.comicId = 1;
    model.imageId = 1;
    model.position = 1;

    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('bucket');
  });

  it('should fail validation with empty url', async () => {
    model.bucket = 'test-bucket';
    model.url = '';
    model.fileName = 'test-image.jpg';
    model.chapterId = 1;
    model.comicId = 1;
    model.imageId = 1;
    model.position = 1;

    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors[0].property).toBe('url');
  });

  it('should fail validation with invalid imageId type', async () => {
    model.bucket = 'test-bucket';
    model.url = 'https://example.com/image.jpg';
    model.fileName = 'test-image.jpg';
    model.chapterId = 1;
    model.comicId = 1;
    model.imageId = 'invalid' as any; // Testing invalid type
    model.position = 1;

    const errors = await validate(model);
    expect(errors.length).toBeGreaterThan(0);
  });
});