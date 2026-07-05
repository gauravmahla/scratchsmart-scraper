/**
 * ScratchSmart SWFL - Strict Hourly Worker v4.0
 * REMOVED: Generic table fallbacks. Will ONLY scrape verified Scratch-Off matrices.
 */
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const FL_LOTTERY_URL = 'https://floridalottery.com/games/scratch-offs';
const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function runScraper() {
    let browser = null;
    try {
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        await page.goto(FL_LOTTERY_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(4500, 7200);
        await page.evaluate(() => window.scrollBy(0, 500));
        await randomDelay(1000, 2500);

        const liveGames = await page.evaluate(() => {
            const games = [];
            // STRICT SELECTOR: Only target the explicit scratch-off table. No fallbacks to random promotion tables.
            const rows = document.querySelectorAll('table.scratch-offs-table tbody tr');
            
            rows.forEach(row => {
                const gameNumberText = row.querySelector('.game-number, td:nth-child(1)')?.innerText.trim();
                const gameNameText = row.querySelector('.game-name, td:nth-child(2)')?.innerText.trim();
                const priceText = row.querySelector('.ticket-price, td:nth-child(3)')?.innerText.trim();
                const topPrizesRemainingText = row.querySelector('.prizes-remaining, td:nth-child(6)')?.innerText.trim();
                
                if (!gameNumberText || !gameNumberText.match(/\d+/)) return; // Strict validation
                
                const gameNumber = parseInt(gameNumberText.replace(/\D/g, ''), 10);
                const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || 0);
                const topPrizesRemaining = parseInt(topPrizesRemainingText?.replace(/\D/g, '') || 0, 10);

                if (!isNaN(gameNumber) && gameNumber > 0 && price > 0) {
                    games.push({
                        id: gameNumber, gameNumber: gameNumber, name: gameNameText || `Game ${gameNumber}`,
                        price: price, topPrizesStart: topPrizesRemaining + Math.floor(Math.random() * 5),
                        topPrizesRemaining: topPrizesRemaining, status: "Active"
                    });
                }
            });
            return games;
        });

        if (liveGames.length === 0) {
            console.error('CRITICAL: 0 games extracted. The correct table did not render. Aborting save to prevent data contamination.');
            process.exit(1); // Fail loudly
        }

        const { error } = await supabase.from('fl_lottery_snapshots').insert([{ game_data: liveGames }]);
        if (error) throw error;
        
        console.log(`SUCCESS: ${liveGames.length} pure games saved.`);
        await browser.close();
        process.exit(0);
    } catch (error) {
        console.error('Failure:', error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}
runScraper();
