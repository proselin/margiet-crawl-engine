import { Test, TestingModule } from '@nestjs/testing';
import { GoogleDriveService } from './google-drive.service';
import { GOOGLE_DRIVE_CONFIG } from './google-drive.constant';
import { MOCK_GOOGLE_DRIVE_CONFIG } from '../../../src/test-setup';

describe('GoogleDriveService', () => {
  let service: GoogleDriveService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleDriveService,
        {
          provide: GOOGLE_DRIVE_CONFIG,
          useValue: MOCK_GOOGLE_DRIVE_CONFIG,
        },
      ],
    }).compile();

    service = module.get<GoogleDriveService>(GoogleDriveService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bufferToStream', () => {
    it('should convert buffer to stream', () => {
      const buffer = Buffer.from('test data');
      const stream = GoogleDriveService.bufferToStream(buffer);
      
      expect(stream).toBeDefined();
      expect(typeof stream.read).toBe('function');
    });
  });
});
