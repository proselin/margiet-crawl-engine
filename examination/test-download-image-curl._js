const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Replace with your target URL
const url = ' https://cdn1.cloud-zzz.com/nettruyen/hay-ru-em-ngu/1/6.jpg';

const homeDir = os.homedir();
const filePath = path.join(homeDir, 'file.jpg');

// Construct the curl command to get both headers and body (using -i to include headers in the response)
const curlCommand = `curl -s -i ${url} \
                -H 'accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8' \
                -H 'accept-language: en-US,en;q=0.9,vi;q=0.8,vi-VN;q=0.7' \
                -H 'dnt: 1' \
                -H 'priority: u=1, i' \
                -H 'referer: https://nettruyenww.com/' \
                -H 'sec-ch-ua: "Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"' \
                -H 'sec-ch-ua-mobile: ?0' \
                -H 'sec-ch-ua-platform: "Linux"' \
                -H 'sec-fetch-dest: image' \
                -H 'sec-fetch-mode: no-cors' \
                -H 'sec-fetch-site: cross-site' \
                -H 'user-agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'`;

// Execute the curl command in a child process
exec(curlCommand, { encoding: 'buffer' , maxBuffer: 10 * 1024 * 1024}, (err, stdout, stderr) => {
  if (err) {
    // Detect the error if the command fails
    console.error(`Error executing curl: ${err.message}`);
    console.error(`Exit Code: ${err.code}`);
    return;
  }

  if (stderr &&  stderr.length > 0) {
    // If curl writes to stderr, it may indicate a problem
    console.error(`stderr: ${stderr}`);
    return;
  }

  if (!stdout || stdout.length === 0) {
    // If no data was returned, the fetch might have failed
    console.error('No data returned. The image might not have been fetched correctly.');
    return;
  }

  // Convert buffer to string for header extraction, but keep it raw for the body
  const response = stdout.toString('utf8'); // Decode headers to string for easier parsing

  // Split headers and body
  const headersEndIndex = response.indexOf("\r\n\r\n");
  const headers = response.substring(0, headersEndIndex);
  const body = stdout.slice(headersEndIndex + 4); // Extract the body as raw buffer

  // Extract HTTP status code from the first line of the response
  const statusLine = headers.split("\r\n")[0];
  const statusCode = statusLine.split(" ")[1]; // The status code is the second part
  console.log(`HTTP Status Code: ${statusCode}`);

  // Extract Content-Type from headers
  const contentTypeMatch = headers.match(/content-type:\s*(.*)/);
  if (contentTypeMatch && contentTypeMatch[1]) {
    const contentType = contentTypeMatch[1].trim();
    console.log(`Content-Type: ${contentType}`);
  } else {
    console.error('Content-Type not found in the response headers.');
    return;
  }

  // Get the buffer size in bytes for the body
  const bufferSize = body.length;
  console.log(`Buffer size: ${bufferSize} bytes`);

  // Check if the buffer size is less than 1KB (1024 bytes)
  if (bufferSize < 1024) {
    console.error('Image is too small (less than 1KB), rejecting...');
    return; // Reject the operation
  }

  // Write the raw body buffer (the image data) to a file
  fs.writeFile(filePath, body, (err) => {
    if (err) {
      console.error('Failed to save the file:', err);
    } else {
      console.log(`Image saved successfully to ${filePath}`);
    }
  });
});
