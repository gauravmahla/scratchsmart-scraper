/**
 * ScratchSmart SWFL - Deep Historical PDF Ingestion Engine v2.0
 * Architected for Node 18 LTS Compatibility & Fault Tolerance
 */
const fs = require('fs');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

// 1. Secret Validation Guardrail
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("FATAL ERROR: Supabase connection keys are missing from the environment.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const files = [
    { name: 'p2.pdf', game: 'PICK_2' },
    { name: 'p3.pdf', game: 'PICK_3' },
    { name: 'p4.pdf', game: 'PICK_4' },
    { name: 'p5.pdf', game: 'PICK_5' },
    { name: 'ff.pdf', game: 'FANTASY_5' },
    { name: 'cp.pdf', game: 'CASH_POP' },
    { name: 'jtp.pdf', game: 'JACKPOT_TRIPLE_PLAY' },
    { name: 'c4l.pdf', game: 'CASH4LIFE' },
    { name: 'l6.pdf', game: 'FLORIDA_LOTTO' },
    { name: 'mmil.pdf', game: 'MEGA_MILLIONS' }
];

async function processPDFs() {
    console.log("Initiating Deep Historical PDF Extraction Pipeline...");

    for (const file of files) {
        if (!fs.existsSync(file.name)) {
            console.log(`Skipping ${file.name} - File not found in current directory: ${process.cwd()}`);
            continue;
        }

        console.log(`\n--- Parsing ${file.name} for ${file.game} ---`);
        const dataBuffer = fs.readFileSync(file.name);

        try {
            const data = await pdf(dataBuffer);
            const rawText = data.text.replace(/\r\n/g, '\n');
            const lines = rawText.split('\n');
            let parsedRows = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                // Match Date Format
                const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                if (dateMatch) {
                    try {
                        let drawDate = new Date(dateMatch[0]);

                        // Handle Y2K century rollover
                        if (dateMatch[0].length <= 8) {
                            const parts = dateMatch[0].split('/');
                            let year = parseInt(parts[2], 10);
                            year = year > 30 ? 1900 + year : 2000 + year;
                            drawDate = new Date(`${parts[0]}/${parts[1]}/${year}`);
                        }

                        // FAULTSAFE: If date is corrupted, skip row
                        if (isNaN(drawDate.getTime())) continue; 

                        let period = 'EVENING';
                        const prevLine = lines[i-1] || "";
                        const nextLine = lines[i+1] || "";
                        const contextStr = (prevLine + " " + line + " " + nextLine).toUpperCase();

                        if (contextStr.includes(' M ') || contextStr.includes('MIDDAY') || contextStr.includes('MORNING') || contextStr.includes('MATINEE')) period = 'MIDDAY';
                        if (contextStr.includes('LATE NIGHT')) period = 'LATE_NIGHT';
                        if (contextStr.includes('AFTERNOON')) period = 'AFTERNOON';

                        const numberString = line.replace(dateMatch[0], '').replace(/[a-zA-Z]/g, '').trim();
                        const extractedNumbers = numberString.match(/\d+/g) ? numberString.match(/\d+/g).map(Number) : [0];

                        parsedRows.push({
                            game_name: file.game,
                            draw_date: drawDate.toISOString().split('T')[0],
                            draw_period: period,
                            winning_numbers: extractedNumbers.slice(0, 6),
                            special_ball: extractedNumbers.length > 6 ? extractedNumbers[6] : null,
                            multiplier: contextStr.includes('FB') ? 'FIREBALL' : (contextStr.includes('X') ? contextStr.match(/X\d/)?.[0] : null)
                        });
                    } catch (parseErr) {
                        // FAULTSAFE: Silently catch messy individual lines without crashing the script
                        continue;
                    }
                }
            }

            console.log(`Extracted ${parsedRows.length} historical records. Pushing to Cloud Brain...`);

            let successCount = 0;
            for (let i = 0; i < parsedRows.length; i += 500) {
                const batch = parsedRows.slice(i, i + 500);
                const { error } = await supabase.from('draw_game_history').insert(batch);
                if (error) {
                    console.error(`Supabase DB Error on ${file.game}:`, error.message);
                } else {
                    successCount += batch.length;
                }
            }
            console.log(`Successfully saved ${successCount} rows for ${file.game}.`);

        } catch (err) {
            console.error(`Fatal extraction failure on ${file.name}:`, err.message);
        }
    }
    console.log("\nALL HISTORICAL DATA PIPELINES COMPLETED.");
}

processPDFs();
