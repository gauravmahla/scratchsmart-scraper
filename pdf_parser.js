/**
 * ScratchSmart SWFL - Omni-Search PDF Ingestion v3.0
 * Recursively finds ANY .pdf file in the repository to prevent "Silent Skips".
 */
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Find all PDFs in the current directory dynamically
const files = fs.readdirSync(__dirname).filter(file => file.toLowerCase().endsWith('.pdf'));

async function processPDFs() {
    console.log(`Omni-Search found ${files.length} PDF files:`, files);
    
    if (files.length === 0) {
        console.error("FATAL: No PDFs found. You must upload the PDFs to the repository.");
        process.exit(1); // Loud failure
    }

    let totalRowsPushed = 0;

    for (const file of files) {
        console.log(`\n--- Extracting ${file} ---`);
        const dataBuffer = fs.readFileSync(path.join(__dirname, file));
        
        try {
            const data = await pdf(dataBuffer);
            const lines = data.text.replace(/\r\n/g, '\n').split('\n');
            let parsedRows = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                const dateMatch = line.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
                
                if (dateMatch) {
                    try {
                        let drawDate = new Date(dateMatch[0]);
                        if (dateMatch[0].length <= 8) {
                            const parts = dateMatch[0].split('/');
                            let year = parseInt(parts[2], 10);
                            year = year > 30 ? 1900 + year : 2000 + year;
                            drawDate = new Date(`${parts[0]}/${parts[1]}/${year}`);
                        }
                        if (isNaN(drawDate.getTime())) continue; 

                        const contextStr = ((lines[i-1]||"") + " " + line + " " + (lines[i+1]||"")).toUpperCase();
                        let period = contextStr.includes('MIDDAY') || contextStr.includes(' M ') ? 'MIDDAY' : 'EVENING';

                        const numStr = line.replace(dateMatch[0], '').replace(/[A-Za-z]/g, '').trim();
                        const nums = numStr.match(/\d+/g) ? numStr.match(/\d+/g).map(Number) : [0];

                        parsedRows.push({
                            game_name: file.replace('.pdf', '').toUpperCase(),
                            draw_date: drawDate.toISOString().split('T')[0],
                            draw_period: period,
                            winning_numbers: nums.slice(0, 6)
                        });
                    } catch (e) { continue; }
                }
            }

            for (let i = 0; i < parsedRows.length; i += 500) {
                const batch = parsedRows.slice(i, i + 500);
                const { error } = await supabase.from('draw_game_history').insert(batch);
                if (!error) totalRowsPushed += batch.length;
            }
            console.log(`Pushed ${parsedRows.length} rows for ${file}`);
        } catch (err) {
            console.error(`Failed reading ${file}:`, err.message);
        }
    }
    
    console.log(`\nFINAL TOTAL: ${totalRowsPushed} rows injected into Cloud Brain.`);
    if (totalRowsPushed === 0) process.exit(1); // Fail loudly if nothing was pushed
    process.exit(0);
}
processPDFs();
