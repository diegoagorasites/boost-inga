const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

async function simulateVisits() {
  const USER_AGENT =
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36';

  const urls = [
    'https://dhpdigital.com.br/',
    'https://dhpdigital.com.br/',
    'https://dhpdigital.com.br/servicos/',
    'https://dhpdigital.com.br/contato/',
  ];

  function getRandomUrl() {
    const index = Math.floor(Math.random() * urls.length);
    return urls[index];
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (let i = 1; i <= 10; i++) {
    const url = getRandomUrl();
    const fullUrl = `${url}?utm_source=puppeteer&utm_campaign=simulador&v=${i}`;
    console.log(`🔁 Visitando ${fullUrl}`);

    let page;
    try {
      page = await browser.newPage();
      await page.setUserAgent(USER_AGENT);

      // Intercepta e bloqueia recursos pesados
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const blocked = ['image', 'stylesheet', 'font'];
        if (blocked.includes(req.resourceType())) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Zera os cookies da aba
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');

      // Vai para a URL
      await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });

      // Tenta aceitar o cookie
      try {
        const consentButton = '#adopt-accept-all-button';
        await page.waitForSelector(consentButton, { timeout: 3000 });
        await page.click(consentButton);
        console.log(`✅ Consentimento aceito`);
      } catch {
        console.log(`⚠️ Botão de consentimento não encontrado ou já aceito`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
      await page.close();
      console.log(`✅ Visita ${i} finalizada\n`);
    } catch (err) {
      console.error(`❌ Erro durante a visita ${i}: ${err.message}`);
      if (page) await page.close();
    }
  }

  await browser.close();
  console.log('🎯 Todas as visitas concluídas.');
}

app.get('/', async (req, res) => {
  console.log('🚀 Disparando visitas...');
  try {
    await simulateVisits();
    res.send('🎯 Visitas simuladas com sucesso!');
  } catch (error) {
    console.error(`❌ Erro geral: ${error.message}`);
    res.status(500).send('❌ Erro ao simular visitas');
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 Servidor rodando na porta ${PORT}`);
});