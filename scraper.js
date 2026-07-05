/**
 * ScratchSmart SWFL - Ultimate Data Scraper
 * Bypasses Viewport Constraints, AJAX Delays, and Obfuscated DOM structures.
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
const TARGET_URL = 'https://floridalottery.com/games/scratch-offs/top-remaining-prizes';

const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function runScraper() {
    let browser = null;
    try {
        console.log('Launching headless browser in Desktop Mode...');
        browser = await puppeteer.launch({
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
                '--window-size=1920,1080'
            ],
            defaultViewport: { width: 1920, height: 1080 }
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log(`Navigating to target: ${TARGET_URL}`);
        
        // Wait for ALL background network requests (AJAX) to completely finish
        await page.goto(TARGET_URL, { waitUntil: 'networkidle0', timeout: 60000 });

        console.log('Waiting for asynchronous AJAX table injection...');
        // Force the script to wait until at least 5 table rows exist on the page
        await page.waitForFunction(() => document.querySelectorAll('tr').length > 5, { timeout: 15000 })
            .catch(() => console.log('Warning: Timeout waiting for TR elements, continuing anyway...'));

        await randomDelay(3000, 5000);
        await page.evaluate(() => window.scrollBy(0, 1000));
        await randomDelay(1000, 2000);

        console.log('Extracting and decoding 4-column table matrix...');
        const liveGames = await page.evaluate(() => {
            const gamesMap = new Map();
            // Select all rows globally to bypass strict CSS classes
            const rows = document.querySelectorAll('tr');

            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                // Must have exactly 4 columns as seen in the visual evidence
                if (cells.length === 4) {
                    const col1 = cells[0].innerText.replace(/\s+/g, ' ').trim(); 
                    const col2 = cells[1].innerText.trim(); 
                    const col3 = cells[2].innerText.trim(); 
                    const col4 = cells[3].innerText.trim(); 

                    const idMatch = col1.match(/#(\d+)/);
                    if (!idMatch) return; // Not a valid game row

                    const gameNumber = parseInt(idMatch[1], 10);
                    const gameName = col1.replace(/\(#\d+\)/, '').trim();
                    const price = parseFloat(col4.replace(/[^0-9.]/g, ''));
                    const topPrize = parseFloat(col2.replace(/[^0-9.]/g, ''));

                    const remainingMatch = col3.match(/(\d+)\s+of\s+(\d+)/i);
                    let remaining = 0;
                    let start = 0;

                    if (remainingMatch) {
                        remaining = parseInt(remainingMatch[1], 10);
                        start = parseInt(remainingMatch[2], 10);
                    } else {
                        remaining = parseInt(col3.replace(/\D/g, '') || 0, 10);
                    }

                    if (!isNaN(gameNumber) && !isNaN(price)) {
                        // Only add if it doesn't exist, or if this is a HIGHER top prize tier for the same game
                        if (!gamesMap.has(gameNumber) || gamesMap.get(gameNumber).topPrize < topPrize) {
                            gamesMap.set(gameNumber, {
                                id: gameNumber,
                                gameNumber: gameNumber,
                                name: gameName,
                                price: price,
                                topPrize: topPrize,
                                topPrizesRemaining: remaining,
                                topPrizesStart: start > 0 ? start : remaining + 3,
                                status: "Active"
                            });
                        }
                    }
                }
            });

            return Array.from(gamesMap.values());
        });

        if (liveGames.length === 0) {
            const pageDump = await page.evaluate(() => document.body.innerText.substring(0, 400));
            console.error('CRITICAL: 0 games extracted. The data failed to render.');
            console.error('PAGE DUMP:', pageDump.replace(/\n/g, ' '));
            process.exit(1);
        }

        console.log(`SUCCESS: ${liveGames.length} valid games decoded. Pushing to Supabase...`);
        const { error } = await supabase.from('fl_lottery_snapshots').insert([{ game_data: liveGames }]);

        if (error) {
            console.error('Database Push Failed:', error.message);
            process.exit(1);
        }

        console.log('Snapshot successfully locked into Cloud Brain.');
        await browser.close();
        process.exit(0);

    } catch (error) {
        console.error('Fatal Scraper Failure:', error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}
runScraper();
