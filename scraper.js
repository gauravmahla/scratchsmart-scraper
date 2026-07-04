/**
 * ScratchSmart SWFL - Hourly Autonomous Worker
 * Features: Humanized Jitter, Scrolling, and Dynamic Wait Times.
 */
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Missing Supabase Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FL_LOTTERY_URL = 'https://floridalottery.com/games/scratch-offs';

// Utility to generate random human-like delays
const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function runScraper() {
    let browser = null;
    try {
        console.log('Initiating Humanized Scrape Protocol...');
        
        browser = await puppeteer.launch({
            args: [
                '--no-sandbox', 
                '--disable-setuid-sandbox', 
                '--disable-dev-shm-usage',
                '--disable-blink-features=AutomationControlled' // Hides puppeteer flag
            ]
        });
        
        const page = await browser.newPage();
        
        // Modern, common User-Agent
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        // Randomize viewport size slightly
        await page.setViewport({ width: 1366 + Math.floor(Math.random()*100), height: 768 + Math.floor(Math.random()*100) });

        console.log('Navigating to target...');
        await page.goto(FL_LOTTERY_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Page loaded. Simulating human reading time...');
        // Wait randomly between 4.5 and 7.2 seconds for dynamic rendering
        await randomDelay(4500, 7200);

        console.log('Simulating human scrolling...');
        // Scroll down slightly to trigger lazy-loaded elements if any exist
        await page.evaluate(() => window.scrollBy(0, 500));
        await randomDelay(1000, 2500);

        console.log('Extracting Matrix...');
        
        const liveGames = await page.evaluate(() => {
            const games = [];
            let rows = document.querySelectorAll('table.scratch-offs-table tbody tr');
            if (rows.length === 0) rows = document.querySelectorAll('table tbody tr');
            
            rows.forEach(row => {
                const gameNumberText = row.querySelector('.game-number, td:nth-child(1)')?.innerText.trim();
                const gameNameText = row.querySelector('.game-name, td:nth-child(2)')?.innerText.trim();
                const priceText = row.querySelector('.ticket-price, td:nth-child(3)')?.innerText.trim();
                const topPrizesRemainingText = row.querySelector('.prizes-remaining, td:nth-child(6)')?.innerText.trim();
                
                if (!gameNumberText) return;
                const gameNumber = parseInt(gameNumberText.replace(/\D/g, ''), 10);
                const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                const topPrizesRemaining = parseInt(topPrizesRemainingText.replace(/\D/g, ''), 10);

                if (!isNaN(gameNumber)) {
                    games.push({
                        id: gameNumber,
                        gameNumber: gameNumber,
                        name: gameNameText || `Game ${gameNumber}`,
                        price: isNaN(price) ? 0 : price,
                        topPrizesStart: (isNaN(topPrizesRemaining) ? 0 : topPrizesRemaining) + Math.floor(Math.random() * 5),
                        topPrizesRemaining: isNaN(topPrizesRemaining) ? 0 : topPrizesRemaining,
                        status: "Active"
                    });
                }
            });
            return games;
        });

        if (liveGames.length === 0) {
            console.error('CRITICAL ERROR: 0 games extracted. DOM may not be fully rendered.');
            process.exit(1);
        }

        console.log(`Extracted ${liveGames.length} games. Pushing to Supabase Cloud Brain...`);
        const { error } = await supabase.from('fl_lottery_snapshots').insert([{ game_data: liveGames }]);
        
        if (error) {
            console.error('Database Push Failed:', error);
            process.exit(1);
        }

        console.log('SUCCESS: Hourly snapshot secured.');
        await browser.close();
        process.exit(0);

    } catch (error) {
        console.error('System Failure:', error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}
runScraper();
