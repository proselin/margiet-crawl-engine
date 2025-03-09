import { Extractor } from './extractor.abstract';
import { InfoExtractedResult$1 } from '../../../../common';
import { LinkCrawlModel } from '../../../../models/jobs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class NettruyenExtractor implements Extractor<InfoExtractedResult$1> {
  private htmlContent?: string;
  private domain?: string;

  constructor() {}

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

  async extractChapter() {
    const ulRegexs = [
      /<ul[^>]*style="[^"]*display:\s*block[^"]*"[^>]*>([\s\S]*?)<\/ul>/,
      /<ul[^>]*id="chapter_list"[^>]*>([\s\S]*?)<\/ul>/,
    ];

    let ulMatch
    for (const regex of ulRegexs) {
      const regexResult = regex.exec(this.htmlContent);
      if(!!regexResult) {
        ulMatch = regexResult
        break;
      }
    }

    // Match the specific <ul>

    if (!ulMatch) {
      throw new Error('No <ul> with display:block found.');
    }

    const ulContent = ulMatch[1]; // Content inside the specific <ul>

    // Regex to match <a> tags within the extracted <ul>
    const linkRegex =
      /<a\s+href="([^"]+)"\s+data-id="([^"]+)">Chapter\s+(\d+)<\/a>/g;

    // Array to store the results
    const chapters: InfoExtractedResult$1['chapters'] = [];

    // Extract data from <a> tags within the specific <ul>
    let linkMatch;
    while ((linkMatch = linkRegex.exec(ulContent)) !== null) {
      const item: InfoExtractedResult$1['chapters'][number] = {
        href: linkMatch[1],
        chapterNumber: linkMatch[3],
      };
      await LinkCrawlModel.validateAsync(item);
      chapters.push(item);
    }
    //Reverse list because display the latest chapter is on top
    chapters.reverse();
    if(!chapters) throw new Error("No Chapter were founded")
    return chapters;
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

  init(htmlContent: string, url: string) {
    this.htmlContent = htmlContent;
    this.domain = (new URL(url)).origin;
    return this;
  }

  async extract() {
    const chapters = await this.extractChapter();
    return {
      title: this.extractTitle(),
      thumbUrl: this.extractThumb(),
      chapters,
      slug: this.extractSlug(),
      comicId: this.extractId(),
      domain: this.domain,
    } satisfies InfoExtractedResult$1;
  }
}