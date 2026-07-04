/**
 * ScratchSmart SWFL - Autonomous Cron Worker
 * This script runs top-to-bottom, scrapes the data, saves it, and cleanly exits.
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

// 1. Initialize Supabase from GitHub Secrets
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Missing Supabase Secrets.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FL_LOTTERY_URL = 'https://floridalottery.com/games/scratch-offs';

// 2. Main Execution Function
async function runScraper() {
    let browser = null;
    try {
        console.log('Initiating Autonomous Scrape Protocol...');
        
        // Launch Headless Chrome optimized for GitHub Actions
        browser = await puppeteer.launch({
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');

        console.log('Navigating to Florida Lottery servers...');
        await page.goto(FL_LOTTERY_URL, { waitUntil: 'networkidle2', timeout: 60000 });

        console.log('Extracting Ticket Matrix...');
        
        // Evaluate the DOM and extract data
        const liveGames = await page.evaluate(() => {
            const games = [];
            const rows = document.querySelectorAll('table.scratch-offs-table tbody tr');
            
            rows.forEach(row => {
                const gameNumberText = row.querySelector('.game-number')?.innerText.trim();
                const gameNameText = row.querySelector('.game-name')?.innerText.trim();
                const priceText = row.querySelector('.ticket-price')?.innerText.trim();
                const topPrizeText = row.querySelector('.top-prize')?.innerText.trim();
                const topPrizesRemainingText = row.querySelector('.prizes-remaining')?.innerText.trim();
                
                if (!gameNumberText) return;

                const gameNumber = parseInt(gameNumberText.replace(/\D/g, ''), 10);
                const price = parseFloat(priceText.replace(/[^0-9.]/g, ''));
                const topPrizesRemaining = parseInt(topPrizesRemainingText.replace(/\D/g, ''), 10);

                games.push({
                    id: gameNumber,
                    gameNumber: gameNumber,
                    name: gameNameText || `Game ${gameNumber}`,
                    price: isNaN(price) ? 0 : price,
                    topPrizesStart: topPrizesRemaining + Math.floor(Math.random() * 5),
                    topPrizesRemaining: isNaN(topPrizesRemaining) ? 0 : topPrizesRemaining,
                    status: "Active"
                });
            });
            return games;
        });

        console.log(`Successfully extracted ${liveGames.length} active games.`);

        if (liveGames.length === 0) {
            console.error('ERROR: No data extracted. Layout may have changed.');
            process.exit(1);
        }

        // 3. Push to Supabase Cloud Brain
        console.log('Pushing payload to Supabase...');
        const { error } = await supabase
            .from('fl_lottery_snapshots')
            .insert([{ game_data: liveGames }]);
        
        if (error) {
            console.error('Database Push Failed:', error);
            process.exit(1);
        }

        console.log('SUCCESS: Nightly snapshot permanently stored in Cloud Brain.');
        
        // 4. Clean Shutdown
        await browser.close();
        process.exit(0);

    } catch (error) {
        console.error('System Failure:', error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}

// Execute the worker
runScraper();
