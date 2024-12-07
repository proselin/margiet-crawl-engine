const { execSync } = require('child_process');

try {
  const url =
    'https://nettruyenww.com/truyen-tranh/toi-phai-duy-tri-hinh-tuong-me-ke-cua-minh-26432'; // Replace with your URL
  const response = execSync(
    `
        curl -s -i ${url} \
            -H 'accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
            -H 'accept-language: en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7' \
            -H 'cookie: _ga=GA1.1.1791487263.1733478889; location=VN; _location_evoads_=VN; _ip_evoads_=2001%3Aee0%3A4161%3Aa938%3Af651%3A4398%3A651c%3A7e80; _ga_9QE79X1JWX=GS1.1.1733581738.3.0.1733581738.0.0.0; _location=VN; _puTimeAccess_evoads_=1733581738207' \
            -H 'dnt: 1' \
            -H 'priority: u=0, i' \
            -H 'sec-ch-ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' \
            -H 'sec-ch-ua-mobile: ?0' \
            -H 'sec-ch-ua-platform: "Linux"' \
            -H 'sec-fetch-dest: document' \
            -H 'sec-fetch-mode: navigate' \
            -H 'sec-fetch-site: same-origin' \
            -H 'sec-fetch-user: ?1' \
            -H 'upgrade-insecure-requests: 1' \
            -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    `,
    { encoding: 'utf-8' },
  );

  // Separate headers and body
  const [headers, body] = response.split('\r\n\r\n', 2);

  // Extract status code
  const statusLine = headers.split('\r\n')[0];
  const statusCode = parseInt(statusLine.split(' ')[1], 10);

  console.log('Status Code:', statusCode);
  console.log('HTML Body:', body);

  // Check status code
  if (statusCode === 200) {
    console.log('Request succeeded!');
  } else {
    console.log('Request failed with status:', statusCode);
  }
} catch (error) {
  console.error('Error executing curl:', error.message);
}
