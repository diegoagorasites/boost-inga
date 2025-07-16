const puppeteer = require('puppeteer');

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

// Lista ponderada de URLs (homepage aparece 2x mais)
const urls = [
  'https://dhpdigital.com.br/', // homepage
  'https://dhpdigital.com.br/', // homepage
  'https://dhpdigital.com.br/servicos/',
  'https://dhpdigital.com.br/contato/',
  'https://dhpdigital.com.br/blog/',
];

function getRandomUrl() {
  const index = Math.floor(Math.random() * urls.length);
  return urls[index];
}

async function simulateVisit(browser, visitNumber, url) {
  const page = await browser.newPage();
  await page.setUserAgent(USER_AGENT);

  const client = await page.target().createCDPSession();
  await client.send('Network.clearBrowserCookies');

  const fullUrl = `${url}?utm_source=puppeteer&utm_campaign=simulador&v=${visitNumber}`;
  console.log(`🔁 Visitando ${fullUrl}`);

  await page.goto(fullUrl, { waitUntil: 'domcontentloaded' });

  try {
    const consentButton = '#adopt-accept-all-button';
    await page.waitForSelector(consentButton, { timeout: 5000 });
    await page.click(consentButton);
    console.log(`✅ Consentimento aceito`);
  } catch {
    console.log(`⚠️ Botão de consentimento não encontrado ou já aceito`);
  }

  await new Promise(resolve => setTimeout(resolve, 7000));
  await page.close();
}

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox']
  });

  const total = 20;

  for (let i = 1; i <= total; i++) {
    const url = getRandomUrl();
    await simulateVisit(browser, i, url);
  }

  await browser.close();
  console.log('🎯 Visitas concluídas.');
})();