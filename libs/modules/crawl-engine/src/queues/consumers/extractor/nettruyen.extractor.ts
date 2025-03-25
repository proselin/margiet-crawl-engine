import { Extractor } from './extractor.abstract';
import { Injectable } from '@nestjs/common';
import { NettruyenHttpService } from '../services/nettruyen-http.service';
import { IInfoExtractedComicPageResult$1 } from '../../../models/jobs';

@Injectable()
export class NettruyenExtractor
  implements Extractor<IInfoExtractedComicPageResult$1>
{
  private htmlContent?: string;
  private domain?: string;
  private comicId?: string;
  private comicSlug?: string;

  constructor(private readonly nettruyenHttpService: NettruyenHttpService) {}

  private extractSlug() {
    const slugPattern = /gOpts\.comicSlug\s*=\s*['"]([^'"]*)['"];/g;
    const slugMatch = slugPattern.exec(this.htmlContent);
    if (!slugMatch || !slugMatch[1]) throw new Error('slug is not found !!');
    return slugMatch[1];
  }

  private extractTitle() {
    const namePattern = /gOpts\.comicName\s*=\s*['"]([^'"]*)['"];/g;
    const nameMatch = namePattern.exec(this.htmlContent);
    if (!nameMatch || !nameMatch[1]) throw new Error('Header is not found !!');
    return nameMatch[1];
  }

  private extractId() {
    const idPattern = /gOpts\.comicId\s*=\s*['"]([^'"]*)['"];/g;
    const idMatch = idPattern.exec(this.htmlContent);
    if (!idMatch || !idMatch[1]) throw new Error('comicId is not found !!');
    return idMatch[1];
  }

  async extractChapter(): Promise<IInfoExtractedComicPageResult$1['chapters']> {
    return this.nettruyenHttpService
      .getChapterList(this.domain, this.comicSlug, this.comicId)
      .then((r) => {
        return r.data.data.map((item) => {
          return {
            href: `${this.domain}/${this.generateChapterUrl(this.comicSlug, item.chapter_slug)}`,
            chapterNumber: item.chapter_num + '',
          } satisfies IInfoExtractedComicPageResult$1['chapters'][number];
        });
      });
  }

  // from main.js nettruyen
  private generateChapterUrl(comicSlug: string, chapter_slug: string) {
    return `/truyen-tranh/${comicSlug}/${chapter_slug}`;
  }

  extractThumb() {
    //Extract thumb url
    const thumbImageRegex = /<img[^>]*data-src=["']([^"]*)["']/g;
    const thumbMatch = thumbImageRegex.exec(this.htmlContent);
    if (!thumbMatch || !thumbMatch[1]) {
      throw new Error('Not found thumb url !!');
    }
    return thumbMatch[1];
  }

  async extract(htmlContent: string, url: string) {
    this.htmlContent = htmlContent;
    this.domain = new URL(url).origin;

    this.comicId = this.extractId();
    this.comicSlug = this.extractSlug();
    const chapters = await this.extractChapter();
    return {
      title: this.extractTitle(),
      thumbUrl: this.extractThumb(),
      chapters,
      slug: this.extractSlug(),
      comicId: this.comicId,
      domain: this.domain,
    } satisfies IInfoExtractedComicPageResult$1;
  }
}
