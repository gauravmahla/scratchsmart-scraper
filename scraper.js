/**
 * ScratchSmart SWFL - Precision Hourly Worker v5.0 (Visual Evidence Patch)
 * Targets exact sub-URL, overrides pagination, and parses 4-column combined layouts.
 */
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
// TARGET URL based on visual evidence
const FL_LOTTERY_URL = 'https://floridalottery.com/games/scratch-offs/top-remaining-prizes';

const randomDelay = (min, max) => new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * (max - min + 1) + min)));

async function runScraper() {
    let browser = null;
    try {
        console.log('Launching headless browser...');
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        
        // CRITICAL FIX: Force 1080p desktop viewport so DataTables doesn't hide columns on mobile view
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        console.log(`Navigating to target: ${FL_LOTTERY_URL}`);
        await page.goto(FL_LOTTERY_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        
        console.log('Simulating human delay and bypassing pagination...');
        await randomDelay(3000, 5000);

        // Ensure table is painted on the screen before proceeding
        await page.waitForSelector('table tbody tr', { timeout: 10000 }).catch(e => console.log('Wait for selector bypassed...'));

        // ATTEMPT TO OVERRIDE PAGINATION (Force "Show All" entries)
        try {
            await page.evaluate(() => {
                const selects = document.querySelectorAll('select');
                for (let s of selects) {
                    if (s.name && s.name.includes('length')) {
                        s.selectedIndex = s.options.length - 1; // Pick the last option (usually "All" or "100")
                        s.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            });
            await randomDelay(3000, 4000); // Wait for the massive table to finish rendering
        } catch (e) {
            console.log("Pagination override skipped or not found. Proceeding with visible DOM.");
        }

        console.log('Extracting and decoding 4-column table matrix...');
        const liveGames = await page.evaluate(() => {
            const gamesMap = new Map();
            const rows = document.querySelectorAll('table tbody tr');
            
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                if (cells.length < 3) return; // Require at least 3 columns to be visible on 1080p
                
                const col1 = cells[0]?.innerText || "";
                const col2 = cells[1]?.innerText || "";
                const col3 = cells[2]?.innerText || "";
                const col4 = cells[3]?.innerText || "";
                
                // BULLETPROOF REGEX EXTRACTIONS
                const idMatch = col1.match(/#(\d+)/);
                if (!idMatch) return; 
                
                const gameNumber = parseInt(idMatch[1], 10);
                const gameName = col1.split('(#')[0].trim();
                
                const remMatch = col3.match(/(\d+)\s*of\s*(\d+)/i);
                if (!remMatch) return;
                
                const remaining = parseInt(remMatch[1], 10);
                const total = parseInt(remMatch[2], 10);
                
                const priceMatch = col4.match(/\d+(\.\d+)?/);
                const price = priceMatch ? parseFloat(priceMatch[0]) : 0;

                // Aggregate by game ID (We only want the primary highest top prize tier for the dashboard view right now)
                if (!gamesMap.has(gameNumber) && !isNaN(gameNumber) && price > 0) {
                    gamesMap.set(gameNumber, {
                        id: gameNumber, 
                        gameNumber: gameNumber, 
                        name: gameName,
                        price: price, 
                        topPrizeValue: col2.trim(),
                        topPrizesStart: total, 
                        topPrizesRemaining: remaining, 
                        status: "Active"
                    });
                }
            });
            return Array.from(gamesMap.values());
        });

        if (liveGames.length === 0) {
            console.error('CRITICAL: 0 games extracted. DOM structural mismatch.');
            process.exit(1);
        }

        console.log(`Validation passed. ${liveGames.length} pure games extracted. Pushing to Cloud Brain...`);
        const { error } = await supabase.from('fl_lottery_snapshots').insert([{ game_data: liveGames }]);
        if (error) throw error;
        
        console.log('SUCCESS: Snapshot saved.');
        await browser.close();
        process.exit(0);
    } catch (error) {
        console.error('Failure:', error.message);
        if (browser) await browser.close();
        process.exit(1);
    }
}
runScraper();
