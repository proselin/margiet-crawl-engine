import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ExecuteCurlResult } from '../../../../common';
import { exec } from 'node:child_process';

@Injectable()
export class NettruyenHttpService {
  private logger = new Logger(NettruyenHttpService.name);

  constructor(private httpService: HttpService, private configService: ConfigService) {}

  private addHeader() {
    return {
      'referer': ""
    }
  }

  get(url: string,) {
    return firstValueFrom(this.httpService.get(url, { headers: this.addHeader() }));
  }

  getImages(url: string, domain: string) {

    return firstValueFrom(this.httpService.get(url, {
      headers: {
        "allow-origin": "*",
        'accept': '*/*',
        'origin': domain,
        'referer': domain + '/',
        'user-agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site'
      },
      responseType: 'arraybuffer'
    }))
  }

  async executeCurl(url: string, domain: string): Promise<ExecuteCurlResult> {
    return new Promise<ExecuteCurlResult>((resolve, reject) => {
      exec(
        `curl -s -i ${url} \
                -H 'accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' \
                -H 'accept-language: en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7' \
                -H 'referer: ${domain}' \
                `,
        { encoding: 'buffer', maxBuffer: 10 * 1024 * 1024 }, // Increase maxBuffer to 10 MB
        (error, stdout, stderr) => {
          if (error) {
            this.logger.error(`URL error ${url}`);
            reject(error);
            return;
          }
          if (stderr && stderr.length > 0) {
            this.logger.error(`URL stderr`);
            reject(stderr.toString());
            return;
          }

          if (!stdout || stdout.length === 0) {
            // If no data was returned, the fetch might have failed
            this.logger.error(
              'No data returned. The image might not have been fetched correctly.',
            );
            reject(
              'No data returned. The image might not have been fetched correctly.',
            );
            return;
          }

          // Convert buffer to string for header extraction, but keep it raw for the body
          const response = stdout.toString('utf8'); // Decode headers to string for easier parsing

          // Split headers and body
          const headersEndIndex = response.indexOf('\r\n\r\n');
          const headers = response.substring(0, headersEndIndex);
          const fileBuffer = stdout.subarray(headersEndIndex + 4); // Extract the body as raw buffer

          // Extract HTTP status code from the first line of the response
          const statusLine = headers.split('\r\n')[0];
          const statusCode = statusLine.split(' ')[1]; // The status code is the second part
          let contentType = null;

          if (Number.isInteger(+statusCode) && +statusCode === 200) {
            if (stdout && stdout.length < 1024) {
              this.logger.error(`URL ${url} response too small`);
              reject(`URL ${url} response too small`);
              return;
            }

            // Extract Content-Type from headers
            const contentTypeMatch = headers.match(/content-type:\s*(.*)/);
            if (contentTypeMatch && contentTypeMatch[1]) {
              contentType = contentTypeMatch[1].trim();
            } else {
              this.logger.error(
                'Content-Type not found in the response headers.',
              );
              reject('Content-Type not found in the response headers.');
              return;
            }
            resolve({
              fileBuffer,
              contentType,
            });
            return;
          }

          this.logger.error(`URL ${url} error with status ${statusCode}`);
          reject(`URL ${url} error with status ${statusCode}`);
        },
      );
    });
  }

}