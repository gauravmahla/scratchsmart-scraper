const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const FL_LOTTERY_URL = 'https://floridalottery.com/games/scratch-offs';

async function runScraper() {
    console.log('Starting GitHub Actions Scraper...');
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();
    
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/114.0.0.0 Safari/537.36');
    await page.goto(FL_LOTTERY_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    const liveGames = await page.evaluate(() => {
        const games = [];
        document.querySelectorAll('table.scratch-offs-table tbody tr').forEach(row => {
            const gameNumberText = row.querySelector('.game-number')?.innerText.trim();
            if (!gameNumberText) return;

            games.push({
                id: parseInt(gameNumberText.replace(/\D/g, ''), 10),
                gameNumber: parseInt(gameNumberText.replace(/\D/g, ''), 10),
                name: row.querySelector('.game-name')?.innerText.trim(),
                price: parseFloat((row.querySelector('.ticket-price')?.innerText || '0').replace(/[^0-9.]/g, '')),
                topPrize: parseFloat((row.querySelector('.top-prize')?.innerText || '0').replace(/[^0-9.]/g, '')),
                topPrizesRemaining: parseInt((row.querySelector('.prizes-remaining')?.innerText || '0').replace(/\D/g, ''), 10),
                lastUpdated: new Date().toISOString().split('T')[0],
                status: "Active"
            });
        });
        return games;
    });

    console.log(`Extracted ${liveGames.length} games. Pushing to Supabase...`);
    
    const { error } = await supabase.from('fl_lottery_snapshots').insert([{ game_data: liveGames }]);
    
    if (error) { console.error('Database Error:', error); process.exit(1); }
    
    console.log('Success! Data saved to Cloud Brain.');
    await browser.close();
    process.exit(0);
}

runScraper();
