const puppeteer = require('puppeteer');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

const urls = [
  'https://dhpdigital.com.br/',
  'https://dhpdigital.com.br/',
  'https://dhpdigital.com.br/servicos/',
  'https://dhpdigital.com.br/contato/',
  'https://dhpdigital.com.br/blog/',
];

function getRandomUrl() {
  const index = Math.floor(Math.random() * urls.length);
  return urls[index];
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function simulateVisit(visitNumber, url) {
  let browser;
  let page;

  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const blocked = ['image', 'stylesheet', 'font'];
      if (blocked.includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    const fullUrl = `${url}?utm_source=puppeteer&utm_campaign=simulador&v=${visitNumber}`;
    console.log(`🔁 Visitando ${fullUrl}`);

    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    try {
      const consentButton = '#adopt-accept-all-button';
      await page.waitForSelector(consentButton, { timeout: 3000 });
      await page.click(consentButton);
      console.log('✅ Consentimento aceito');
    } catch {
      console.log('⚠️ Botão de consentimento não encontrado ou já aceito');
    }

    await delay(5000); // Tempo na página
  } catch (err) {
    console.error(`❌ Erro durante visita ${visitNumber}: ${err.message}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn(`⚠️ Erro ao fechar a página: ${err.message}`);
      }
    }
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.warn(`⚠️ Erro ao fechar o navegador: ${err.message}`);
      }
    }

    await delay(3000); // Delay entre visitas
  }
}

(async () => {
  const total = 10;

  for (let i = 1; i <= total; i++) {
    const url = getRandomUrl();
    await simulateVisit(i, url);
  }

  console.log('🎯 Visitas concluídas.');
})();
