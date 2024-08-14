const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: '/usr/bin/google-chrome-stable',
  });
  const page = await browser.newPage();
  let count = 1;
  page.on('response', async (response) => {
    const url = response.url();
    console.log(url);
    if (response.request().resourceType() === 'image') {
      response.buffer().then((file) => {
        const fileName = new Date() + count + 'Oke' + '.jpg';
        const filePath = path.resolve(__dirname, fileName);
        const writeStream = fs.createWriteStream(filePath);
        writeStream.write(file);
      });
      count++;
    }
  });
  await page.goto(
    'https://nettruyenaa.com/truyen-tranh/nha-vo-dich-voi-chuc-nghiep-vo-nang-va-co-cong-chua-cung-nhau-di-tim-hanh-phuc/chapter-1/2',
  );
})();
