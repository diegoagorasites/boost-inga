const puppeteer = require('puppeteer');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

const urls = [
  'https://dhpdigital.com.br/', // homepage
  'https://dhpdigital.com.br/',
  'https://dhpdigital.com.br/servicos/',
  'https://dhpdigital.com.br/contato/',
  'https://dhpdigital.com.br/blog/',
];

function getRandomUrl() {
  const index = Math.floor(Math.random() * urls.length);
  return urls[index];
}

async function simulateVisit(browser, visitNumber, url) {
  let page;
  try {
    page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);

    // Otimiza carregamento
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // Limpa cookies
    const client = await page.target().createCDPSession();
    await client.send('Network.clearBrowserCookies');

    const fullUrl = `${url}?utm_source=puppeteer&utm_campaign=simulador&v=${visitNumber}`;
    console.log(`🔁 Visitando ${fullUrl}`);

    await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

    // Tenta aceitar cookies
    try {
      const consentButton = '#adopt-accept-all-button';
      await page.waitForSelector(consentButton, { timeout: 3000 });
      await page.click(consentButton);
      console.log(`✅ Consentimento aceito`);
    } catch {
      console.log(`⚠️ Botão de consentimento não encontrado ou já aceito`);
    }

    // Aguarda simulação de leitura
    await new Promise(resolve => setTimeout(resolve, 5000));
  } catch (err) {
    console.error(`❌ Erro durante visita: ${err.message}`);
  } finally {
    if (page) {
      try {
        await page.close();
      } catch (err) {
        console.warn(`⚠️ Erro ao fechar a página: ${err.message}`);
      }
    }
  }
}

(async () => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const total = 20;

    for (let i = 1; i <= total; i++) {
      const url = getRandomUrl();
      await simulateVisit(browser, i, url);
    }

    console.log('🎯 Visitas concluídas.');
  } catch (err) {
    console.error(`❌ Erro ao iniciar o browser: ${err.message}`);
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (err) {
        console.warn(`⚠️ Erro ao fechar o navegador: ${err.message}`);
      }
    }
  }
})();