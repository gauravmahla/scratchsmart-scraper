/**
 * ScratchSmart SWFL - Pure Geospatial Engine v4.0
 * NO MOCK DATA. NO FALLBACKS.
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const OVERPASS_MIRROR_URL = 'https://overpass.kumi.systems/api/interpreter';
const OVERPASS_QUERY = `
  [out:json][timeout:30];
  (
    node["shop"="supermarket"](26.50,-82.50,27.20,-81.70);
    node["shop"="convenience"](26.50,-82.50,27.20,-81.70);
    node["amenity"="fuel"](26.50,-82.50,27.20,-81.70);
  );
  out body;
`;

async function ingestRetailers() {
    console.log("Executing Pure Satellite Sweep (No Mock Fallbacks)...");
    
    try {
        const response = await fetch(OVERPASS_MIRROR_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: "data=" + encodeURIComponent(OVERPASS_QUERY)
        });

        if (!response.ok) throw new Error("API Rate Limit or Block");
        
        const data = await response.json();
        const nodes = data.elements || [];
        console.log(`Sweep complete. Found ${nodes.length} nodes.`);

        let parsedStores = [];
        
        nodes.forEach(node => {
            const name = node.tags?.name || node.tags?.brand;
            if (!name) return; 

            let storeType = name.toUpperCase().includes('PUBLIX') ? 'Supermarket' : 
                           (node.tags?.amenity === 'fuel' ? 'Gas Station' : 'Chain Convenience');

            let city = node.lat > 27.05 ? 'Venice' : node.lat > 27.00 ? 'North Port' : 
                       node.lat > 26.90 ? 'Port Charlotte' : 'Punta Gorda';

            parsedStores.push({
                name: name, store_type: storeType, city: city,
                latitude: node.lat, longitude: node.lon
            });
        });

        if (parsedStores.length === 0) throw new Error("0 stores mapped.");

        await supabase.from('swfl_retailers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        
        for (let i = 0; i < parsedStores.length; i += 500) {
            await supabase.from('swfl_retailers').insert(parsedStores.slice(i, i + 500));
        }
        
        console.log(`SUCCESS: ${parsedStores.length} REAL stores saved.`);
        process.exit(0);
    } catch (error) {
        console.error("FATAL: Satellite sweep failed. Mock data strictly prohibited. Aborting.", error.message);
        process.exit(1); // Fail loudly
    }
}
ingestRetailers();
