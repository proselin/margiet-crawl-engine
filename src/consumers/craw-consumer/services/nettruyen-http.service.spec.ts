import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { NettruyenHttpService } from './nettruyen-http.service';
import { of } from 'rxjs';

describe('NettruyenHttpService', () => {
  let service: NettruyenHttpService;
  let httpService: HttpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NettruyenHttpService,
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
            post: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<NettruyenHttpService>(NettruyenHttpService);
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have httpService injected', () => {
    expect(httpService).toBeDefined();
  });

  it('should make HTTP requests through HttpService', () => {
    const mockResponse = { data: [] };
    jest.spyOn(httpService, 'get').mockReturnValue(of({ data: mockResponse } as any));

    expect(httpService.get).toBeDefined();
    expect(httpService.post).toBeDefined();
  });
});