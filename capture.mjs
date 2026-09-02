import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

(async () => {
  const browser = await puppeteer.launch({ executablePath: 'C:\\Users\\MY PC\\.cache\\puppeteer\\chrome\\win64-151.0.7922.77\\chrome-win64\\chrome.exe' });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('Navigating to localhost:4321...');
  await page.goto('http://localhost:4321/', { waitUntil: 'networkidle0' });
  
  console.log('Waiting for animations to settle...');
  await new Promise(r => setTimeout(r, 2000));
  
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }
  
  console.log('Capturing full page...');
  await page.screenshot({ path: path.join(screenshotsDir, 'full-page.png'), fullPage: true });

  console.log('Capturing sections...');
  const sections = await page.$$('section, main > div');
  let i = 1;
  for (const section of sections) {
    try {
        await section.screenshot({ path: path.join(screenshotsDir, `section-${i}.png`) });
        console.log(`Captured section-${i}.png`);
    } catch (e) {
        console.log(`Could not capture section ${i}: ${e.message}`);
    }
    i++;
  }
  
  await browser.close();
  console.log('Screenshots captured successfully in the "screenshots" folder.');
})();
