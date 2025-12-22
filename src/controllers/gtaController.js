const database = require('../database/database');
const https = require('https');

const safeJsonParse = (value, fallback) => {
    if (!value) return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

const NON_PAYING_WIKI_TITLES = new Set([
    'Agatha Baker',
    'Agent 14',
    'Avon Hertz',
    'Blaine County Savings Bank',
    'Cam Jones',
    'Carl Johnson',
    'Derrick McReary',
    'El Rubio',
    'Juan Strickler',
    'English Dave',
    'Floyd Hebert',
    'Franklin Clinton',
    'Georgina Cheng',
    'Gerald McReary',
    'Hilary King',
    'Lester Crest',
    "Lester's Assassinations",
    'Lupe',
    'Malc',
    'Michael De Santa',
    'Michael Keane',
    'Miguel Madrazo',
    'Natalia Zverovna',
    'Niko Bellic',
    'Paige Harris',
    'Patrick McReary',
    'Pavel',
    'Phil Cassidy',
    'Steve Haines',
    'Tao Cheng',
    'Thornton Duggan',
    'Tom Connors',
    'Trevor Philips',
    'Vincent (character)',
    'Vincent',
    'Wade Hebert',
    'Wu Zi Mu',
    'Yung Ancestor',
    'Zero',
    '24/7 (HD Universe)',
    '24/7',
    'Alta',
    'Boulevard Del Perro',
    'Chamberlain Hills',
    'Clinton Avenue',
    'Clinton Residence',
    'Dashound Bus Center',
    'Discount Store',
    'East Joshua Road',
    'El Burro Heights',
    'El Burro Heights Fire Station',
    'Federal Investigation Bureau',
    'Fleeca',
    'Flywheels Garage',
    'Forum Drive',
    'Globe Oil',
    'Grand Senora Desert',
    'Grapeseed',
    'Grapeseed Main Street',
    'Grove Street (HD Universe)',
    'Grove Street',
    'Harmony',
    'Integrity Way',
    'Jamestown Street',
    'Jetsam Terminal Headquarters',
    'Jetsam Terminal HQ',
    'Lago Zancudo',
    'Las Lagunas Boulevard',
    'Liquor Ace',
    'Little Havana',
    'Little Seoul',
    'Little Seoul Station',
    'Los Santos County Sheriff',
    'Los Santos Police Department (HD Universe)',
    'Los Santos Police Department',
    'Los Santos Tattoos',
    'Macdonald Street',
    'Meringue Lane',
    'Mirror Park',
    'Mirror Park Boulevard',
    'Morningwood',
    'Morningwood Boulevard',
    'North Rockford Drive',
    'Occupation Avenue',
    'Pala Springs',
    'Pala Springs Aerial Tramway',
    'Paleto Bay',
    'Paleto Forest',
    'Palomino Avenue',
    'Rancho',
    "Rex's Diner",
    'Richman Glen',
    'Route 68',
    'San Andreas Avenue',
    'Sandy Shores',
    'Sandy Shores Airfield',
    "Sandy's Gas Station",
    'Seaview Road',
    'Snr. Buns',
    'Strawberry',
    'Tataviam Mountains',
    'Tataviam Truckstop',
    'Tequilala',
    'Terminal',
    'Textile City',
    'The Motor Motel',
    'Vespucci Beach',
    'Vespucci Canals',
    'Vespucci Mall',
    'Vinewood (HD Universe)',
    'Vinewood',
    'West Mirror Drive',
    'West Vinewood',
    'Xero',
    'Yellow Jack Inn',
    'Zancudo River',
    'Adversary Modes',
    'Awards',
    'Bank of Liberty (HD Universe)',
    'Bank of Liberty',
    'Bigfoot',
    'Business Battles',
    'Chips',
    'Cops Capacity',
    'El Banco Corrupto Grande',
    'Events',
    'FIB Headquarters',
    'Freemode Challenges',
    'GTA Online: After Hours',
    'GTA Online: Heists',
    'GTA Online: The Criminal Enterprises',
    'GTA Online: The Cayo Perico Heist',
    'GTA Online: The Diamond Casino Heist',
    'GTA Online: The Doomsday Heist',
    'Grand Theft Auto Online',
    'Grand Theft Auto V',
    'Heists in GTA Online',
    'Heists in GTA V',
    'Hidden Caches',
    'Legendary Motorsport',
    'Los Santos (HD Universe)',
    'Minigun',
    'Money',
    'Motorcycle Clubs',
    'Nightclubs',
    'Offices',
    'Organizations',
    'Passive Mode',
    'Pause Menu',
    'Perico Pistol',
    'Reputation',
    'Rockstar Games',
    'Security Contracts',
    'Special Cargo/Steal Missions',
    'Special Cargo/Steal Missions',
    'State of San Andreas (HD Universe)',
    'State of San Andreas',
    'The Big Score (GTA V)',
    'The Bureau Raid',
    'The Diamond Casino & Resort',
    'The Jewel Store Job',
    'The Job',
    'The Merryweather Heist',
    'The Pacific Standard Job',
    'The Paleto Score',
    'The Prison Break',
    'The Vespucci Job',
    'The Vespucci Job (Remix)',
    'The Vespucci Job Remix',
    'Three Leaf Clover',
    'Time Trials',
    'Vehicle Mines',
    'Wasted',
    'Weaponized Vehicles',
    'Weapon of Choice',
    'Weapons of Choice',
    'Warehouse Staff',
    'Weevil',
    'Bombushka Run',
    'Bombushka',
    'Cargobob (HD Universe)',
    'Cargobob',
    'Deathbike',
    'Drones',
    'Imperator',
    'Issi Classic',
    'RC Bandito',
    'Sasquatch',
    'Terrorbyte',
    'Itali RSX',
    'Clubhouses',
    'Gunrunning (mission)',
    'Gunrunning',
    'Money Fronts (Lavado de Dinero)',
    'Money Fronts',
    'SecuroServ',
    'Warehouses',
]);

const isNonPayingWikiTitle = (title) => {
    const t = String(title || '').trim();
    if (!t) return true;
    if (NON_PAYING_WIKI_TITLES.has(t)) return true;
    if (t.includes('(HD Universe)')) return true;
    return false;
};

// POST /api/gta/import/wiki/page/sections
// Body: { "wikiPage": "Heists_in_GTA_Online" }
const listWikiPageSections = async (req, res) => {
    try {
        const { wikiPage } = req.body || {};
        if (!wikiPage || typeof wikiPage !== 'string') {
            return res.status(400).json({ error: 'wikiPage (string) is required' });
        }

        const sections = await getWikiPageSections({ page: wikiPage });
        res.json({
            wikiPage,
            count: sections.length,
            sections: sections.map((s) => ({
                index: s.index,
                line: s.line,
                level: s.level,
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const chunkArray = (arr, size) => {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
};

const getWikiPageCategories = async ({ titles, requestDelayMs = 0 }) => {
    // MediaWiki titles limit is typically 50 for non-bot users
    const titleChunks = chunkArray(titles, 50);
    const titleToCategories = new Map();

    for (const chunk of titleChunks) {
        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            prop: 'categories',
            cllimit: 'max',
            titles: chunk.join('|'),
        });

        const url = `https://gta.fandom.com/api.php?${params.toString()}`;
        const json = await fetchJson(url);
        const pages = json?.query?.pages ?? {};

        for (const pageId of Object.keys(pages)) {
            const p = pages[pageId];
            const title = p?.title;
            if (!title) continue;
            const cats = (p?.categories ?? [])
                .map((c) => c?.title)
                .filter(Boolean);
            titleToCategories.set(title, cats);
        }

        if (requestDelayMs > 0) await sleep(requestDelayMs);
    }

    return titleToCategories;
};

const filterTitlesLikelyMissions = async ({ titles, requestDelayMs = 0, keyword = 'missions' }) => {
    const kw = String(keyword || '').trim();
    if (!kw) return titles;
    const re = new RegExp(kw, 'i');

    const titleToCats = await getWikiPageCategories({ titles, requestDelayMs });
    return titles.filter((t) => {
        const cats = titleToCats.get(t) || [];
        return cats.some((c) => re.test(c));
    });
};

async function getWikiPageSections({ page }) {
    const params = new URLSearchParams({
        action: 'parse',
        format: 'json',
        prop: 'sections',
        page: String(page || ''),
    });
    const url = `https://gta.fandom.com/api.php?${params.toString()}`;
    const json = await fetchJson(url);
    const sections = json?.parse?.sections ?? [];
    return sections;
}

async function getWikiPageLinksInSection({ page, section }) {
    const params = new URLSearchParams({
        action: 'parse',
        format: 'json',
        prop: 'links',
        page: String(page || ''),
        section: String(section),
    });
    const url = `https://gta.fandom.com/api.php?${params.toString()}`;
    const json = await fetchJson(url);
    const links = json?.parse?.links ?? [];
    return links;
}

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

const toActivityId = (prefix, title) => {
    const base = String(title || '')
        .trim()
        .toLowerCase()
        .replace(/['’]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    return `${prefix}-${base}`;
};

const wikiTitleToUrl = (title) => {
    const encoded = encodeURIComponent(String(title || '').replace(/ /g, '_'));
    return `https://gta.fandom.com/wiki/${encoded}`;
};

async function fetchJson(url) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'user-agent': 'gta-grinding-manager/1.0 (local import)',
            },
        }, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
                    return reject(new Error(`HTTP ${res.statusCode} fetching ${url} - ${data.slice(0, 200)}`));
                }
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(new Error(`Invalid JSON fetching ${url}: ${e.message}`));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.end();
    });
}

const searchWikiCategoriesByPrefix = async ({ prefix, limit = 50 }) => {
    const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        list: 'allcategories',
        aclimit: String(Math.min(500, Math.max(1, limit))),
    });
    if (prefix) params.set('acprefix', prefix);

    const url = `https://gta.fandom.com/api.php?${params.toString()}`;
    const json = await fetchJson(url);
    const cats = json?.query?.allcategories ?? [];
    return cats
        .map((c) => c['*'])
        .filter(Boolean);
};

const normalizeWikiCategoryName = (category) => String(category || '').replace(/_/g, ' ').trim();

const getWikiCategoryMembers = async ({
    category,
    limit = 500,
    maxPages = 50,
    requestDelayMs = 300,
    cmtype = 'page',
}) => {
    // Uses MediaWiki API: https://gta.fandom.com/api.php
    // category should be raw name without "Category:" prefix (we add it)
    const normalizedCategory = normalizeWikiCategoryName(category);
    const titles = [];
    let cmcontinue = null;

    for (let page = 0; page < maxPages; page++) {
        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            list: 'categorymembers',
            cmtitle: `Category:${normalizedCategory}`,
            cmlimit: String(Math.min(500, Math.max(1, limit))),
            cmtype,
        });
        if (cmcontinue) params.set('cmcontinue', cmcontinue);

        const url = `https://gta.fandom.com/api.php?${params.toString()}`;
        const json = await fetchJson(url);

        const members = json?.query?.categorymembers ?? [];
        for (const m of members) {
            if (m?.title) titles.push(m.title);
        }

        cmcontinue = json?.continue?.cmcontinue ?? null;
        if (!cmcontinue) break;

        if (requestDelayMs > 0) await sleep(requestDelayMs);
    }

    return titles;
};

const getWikiCategoryPagesRecursive = async ({
    category,
    maxDepth = 3,
    limit = 500,
    maxPages = 50,
    requestDelayMs = 300,
}) => {
    const root = normalizeWikiCategoryName(category);
    const visited = new Set();
    const pages = new Set();
    const subcategories = new Set();

    const queue = [{ name: root, depth: 0 }];

    while (queue.length) {
        const { name, depth } = queue.shift();
        const key = name.toLowerCase();
        if (visited.has(key)) continue;
        visited.add(key);

        const members = await getWikiCategoryMembers({
            category: name,
            limit,
            maxPages,
            requestDelayMs,
            cmtype: 'page|subcat',
        });

        for (const title of members) {
            const t = String(title);
            if (!t) continue;
            if (t.startsWith('Category:')) {
                const sub = t.slice('Category:'.length).trim();
                if (sub) {
                    subcategories.add(sub);
                    if (depth < maxDepth) queue.push({ name: sub, depth: depth + 1 });
                }
            } else {
                pages.add(t);
            }
        }
    }

    return {
        pages: Array.from(pages),
        subcategories: Array.from(subcategories),
        visitedCategories: visited.size,
    };
};

const upsertActivity = async (activity) => {
    await database.run(`
        INSERT OR REPLACE INTO activities (
            id, variant, name, category, release_year, avg_payout, avg_time_minutes,
            efficiency, cooldown_minutes, resupply_minutes, payout_type,
            modifiers, players_min, players_max, requires, cooldowns, tags, source_url, update_name,
            solo, passive, boostable
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        activity.id,
        activity.variant,
        activity.name,
        activity.category,
        activity.release,
        activity.avgPayout,
        activity.avgTimeMin,
        activity.efficiency,
        activity.minCooldown,
        activity.resupplyMin || 0,
        activity.payoutType,
        JSON.stringify(activity.modifiers || []),
        activity.playersMin ?? null,
        activity.playersMax ?? null,
        activity.requires ? JSON.stringify(activity.requires) : null,
        activity.cooldowns ? JSON.stringify(activity.cooldowns) : null,
        activity.tags ? JSON.stringify(activity.tags) : null,
        activity.sourceUrl ?? null,
        activity.update ?? null,
        activity.solo ? 1 : 0,
        activity.passive ? 1 : 0,
        activity.boostable ? 1 : 0,
    ]);
};

const mapActivityRowToApi = (row) => {
    return {
        id: row.id,
        variant: row.variant || 'base',
        name: row.name,
        category: row.category,
        release: row.release_year,
        boostable: !!row.boostable,
        modifiers: safeJsonParse(row.modifiers, []),
        minCooldown: row.cooldown_minutes ?? 0,
        avgTimeMin: row.avg_time_minutes ?? 0,
        avgPayout: row.avg_payout ?? 0,
        efficiency: row.efficiency ?? 0,
        payoutType: row.payout_type,
        playersMin: row.players_min ?? null,
        playersMax: row.players_max ?? null,
        requires: safeJsonParse(row.requires, null),
        cooldowns: safeJsonParse(row.cooldowns, null),
        tags: safeJsonParse(row.tags, null),
        sourceUrl: row.source_url ?? null,
        update: row.update_name ?? null,
        solo: !!row.solo,
        passive: !!row.passive,
        resupplyMin: row.resupply_minutes ?? 0,
    };
};

// Activities
const getAllActivities = async (req, res) => {
    try {
        const activities = await database.query('SELECT * FROM activities ORDER BY release_year, name');
        res.json(activities.map(mapActivityRowToApi));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const activity = await database.query('SELECT * FROM activities WHERE id = ?', [id]);
        if (activity.length === 0) {
            return res.status(404).json({ error: 'Activity not found' });
        }
        res.json(mapActivityRowToApi(activity[0]));
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createActivity = async (req, res) => {
    try {
        const activity = req.body;
        await database.run(`
            INSERT INTO activities (
                id, variant, name, category, release_year, avg_payout, avg_time_minutes,
                efficiency, cooldown_minutes, resupply_minutes, payout_type,
                modifiers, players_min, players_max, requires, cooldowns, tags, source_url, update_name,
                solo, passive, boostable
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            activity.id, activity.variant, activity.name, activity.category, activity.release,
            activity.avgPayout, activity.avgTimeMin, activity.efficiency,
            activity.minCooldown, activity.resupplyMin || 0,
            activity.payoutType,
            JSON.stringify(activity.modifiers || []),
            activity.playersMin ?? null,
            activity.playersMax ?? null,
            activity.requires ? JSON.stringify(activity.requires) : null,
            activity.cooldowns ? JSON.stringify(activity.cooldowns) : null,
            activity.tags ? JSON.stringify(activity.tags) : null,
            activity.sourceUrl ?? null,
            activity.update ?? null,
            activity.solo, activity.passive, activity.boostable
        ]);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const activity = req.body;
        await database.run(`
            UPDATE activities SET variant = ?, name = ?, category = ?, release_year = ?, avg_payout = ?,
            avg_time_minutes = ?, efficiency = ?, cooldown_minutes = ?, resupply_minutes = ?,
            payout_type = ?, modifiers = ?, players_min = ?, players_max = ?, requires = ?, cooldowns = ?,
            tags = ?, source_url = ?, update_name = ?,
            solo = ?, passive = ?, boostable = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `, [
            activity.variant, activity.name, activity.category, activity.release, activity.avgPayout,
            activity.avgTimeMin, activity.efficiency, activity.minCooldown,
            activity.resupplyMin || 0, activity.payoutType,
            JSON.stringify(activity.modifiers || []),
            activity.playersMin ?? null,
            activity.playersMax ?? null,
            activity.requires ? JSON.stringify(activity.requires) : null,
            activity.cooldowns ? JSON.stringify(activity.cooldowns) : null,
            activity.tags ? JSON.stringify(activity.tags) : null,
            activity.sourceUrl ?? null,
            activity.update ?? null,
            activity.solo, activity.passive, activity.boostable, id
        ]);
        res.json(activity);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;
        await database.run('DELETE FROM activities WHERE id = ?', [id]);
        res.json({ deleted: true, id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Stats
const getAllStats = async (req, res) => {
    try {
        const stats = await database.query('SELECT * FROM stats ORDER BY activity_id');
        const statsMap = {};
        stats.forEach(stat => {
            statsMap[stat.activity_id] = {
                totalMoney: stat.total_money,
                totalTime: stat.total_time,
                count: stat.session_count,
                dpm: stat.avg_dpm,
                lastSession: stat.last_session
            };
        });
        res.json(statsMap);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActivityStats = async (req, res) => {
    try {
        const { id } = req.params;
        const stats = await database.query('SELECT * FROM stats WHERE activity_id = ?', [id]);
        if (stats.length === 0) {
            return res.json({
                totalMoney: 0,
                totalTime: 0,
                count: 0,
                dpm: 0
            });
        }
        const stat = stats[0];
        res.json({
            totalMoney: stat.total_money,
            totalTime: stat.total_time,
            count: stat.session_count,
            dpm: stat.avg_dpm,
            lastSession: stat.last_session
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Sessions
const createSession = async (req, res) => {
    try {
        const session = req.body;
        const result = await database.run(`
            INSERT INTO sessions (activity_id, start_time, end_time, money_earned, duration_minutes)
            VALUES (?, ?, ?, ?, ?)
        `, [session.activityId, session.startTime, session.endTime, session.moneyEarned, session.durationMinutes]);
        
        // Don't update stats on create - only on update when session is completed
        
        res.json({ id: result.id, ...session });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSession = async (req, res) => {
    try {
        const { id } = req.params;
        const session = req.body;
        
        // Get original session to calculate differences
        const original = await database.query('SELECT * FROM sessions WHERE id = ?', [id]);
        if (original.length === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        const originalRow = original[0];
        const endTimeIso = session.endTime || new Date().toISOString();
        const endTimeDate = new Date(endTimeIso);
        const startTimeDate = new Date(originalRow.start_time);
        const computedDurationMinutes = Math.max(0, (endTimeDate.getTime() - startTimeDate.getTime()) / 60000);
        
        await database.run(`
            UPDATE sessions SET end_time = ?, money_earned = ?, duration_minutes = ?
            WHERE id = ?
        `, [endTimeIso, session.moneyEarned, computedDurationMinutes, id]);
        
        // Update stats with differences
        const moneyDiff = (session.moneyEarned || 0) - (originalRow.money_earned || 0);
        const timeDiff = computedDurationMinutes - (originalRow.duration_minutes || 0);
        console.log(`[Stats Update] Activity: ${originalRow.activity_id}, Money: ${moneyDiff}, Time: ${timeDiff}`);
        await updateActivityStats(originalRow.activity_id, moneyDiff, timeDiff);
        
        res.json({
            ...session,
            endTime: endTimeIso,
            durationMinutes: computedDurationMinutes,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getRecentSessions = async (req, res) => {
    try {
        const sessions = await database.query(`
            SELECT s.*, a.name as activity_name 
            FROM sessions s 
            JOIN activities a ON s.activity_id = a.id 
            ORDER BY s.start_time DESC 
            LIMIT 50
        `);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Cooldowns
const startCooldown = async (req, res) => {
    try {
        const cooldown = req.body;
        await database.run(`
            INSERT OR REPLACE INTO cooldowns (activity_id, end_time, notified)
            VALUES (?, ?, FALSE)
        `, [cooldown.activityId, cooldown.endTime]);
        res.json(cooldown);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActiveCooldowns = async (req, res) => {
    try {
        const cooldowns = await database.query(`
            SELECT c.*, a.name as activity_name 
            FROM cooldowns c 
            JOIN activities a ON c.activity_id = a.id 
            WHERE c.end_time > datetime('now')
            ORDER BY c.end_time
        `);
        res.json(cooldowns);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const clearCooldown = async (req, res) => {
    try {
        const { id } = req.params;
        await database.run('DELETE FROM cooldowns WHERE activity_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Resupply
const startResupply = async (req, res) => {
    try {
        const resupply = req.body;
        await database.run(`
            INSERT OR REPLACE INTO resupply (activity_id, end_time, notified)
            VALUES (?, ?, FALSE)
        `, [resupply.activityId, resupply.endTime]);
        res.json(resupply);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActiveResupply = async (req, res) => {
    try {
        const resupply = await database.query(`
            SELECT r.*, a.name as activity_name 
            FROM resupply r 
            JOIN activities a ON r.activity_id = a.id 
            WHERE r.end_time > datetime('now')
            ORDER BY r.end_time
        `);
        res.json(resupply);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const clearResupply = async (req, res) => {
    try {
        const { id } = req.params;
        await database.run('DELETE FROM resupply WHERE activity_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Production state
const getAllProduction = async (req, res) => {
    try {
        const production = await database.query(`
            SELECT p.*, a.name as activity_name, a.avg_payout as stock_value
            FROM production_state p
            JOIN activities a ON p.activity_id = a.id
        `);
        res.json(production);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getProduction = async (req, res) => {
    try {
        const { id } = req.params;
        const production = await database.query(`
            SELECT p.*, a.name as activity_name, a.avg_payout as stock_value
            FROM production_state p
            JOIN activities a ON p.activity_id = a.id
            WHERE p.activity_id = ?
        `, [id]);
        res.json(production[0] || null);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateProduction = async (req, res) => {
    try {
        const { activityId, currentStock } = req.body;
        await database.run(`
            INSERT OR REPLACE INTO production_state (activity_id, current_stock, last_resupply_time, updated_at)
            VALUES (?, ?, datetime('now'), datetime('now'))
        `, [activityId, currentStock]);
        res.json({ activityId, currentStock });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const clearProduction = async (req, res) => {
    try {
        const { id } = req.params;
        await database.run('DELETE FROM production_state WHERE activity_id = ?', [id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Sell sessions
const createSellSession = async (req, res) => {
    try {
        const session = req.body;
        const result = await database.run(`
            INSERT INTO sell_sessions (activity_id, start_time)
            VALUES (?, datetime('now'))
        `, [session.activityId]);
        res.json({ id: result.id, ...session, startTime: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const updateSellSession = async (req, res) => {
    try {
        const { id } = req.params;
        const { moneyEarned, activeMinutes } = req.body;
        await database.run(`
            UPDATE sell_sessions
            SET end_time = datetime('now'), money_earned = ?, active_minutes = ?
            WHERE id = ?
        `, [moneyEarned, activeMinutes, id]);
        res.json({ id, moneyEarned, activeMinutes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getActiveSellSessions = async (req, res) => {
    try {
        const sessions = await database.query(`
            SELECT s.*, a.name as activity_name
            FROM sell_sessions s
            JOIN activities a ON s.activity_id = a.id
            WHERE s.end_time IS NULL
        `);
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Stats reset
const resetActivityStats = async (req, res) => {
    try {
        const { id } = req.params;
        await database.run('DELETE FROM stats WHERE activity_id = ?', [id]);
        await database.run('DELETE FROM sessions WHERE activity_id = ?', [id]);
        await database.run('DELETE FROM sell_sessions WHERE activity_id = ?', [id]);
        await database.run('DELETE FROM cooldowns WHERE activity_id = ?', [id]);
        await database.run('DELETE FROM resupply WHERE activity_id = ?', [id]);
        await database.run('DELETE FROM production_state WHERE activity_id = ?', [id]);
        await database.run('DELETE FROM safe_collections WHERE activity_id = ?', [id]);
        res.json({ success: true, message: 'Stats reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const resetAllActivityStats = async (req, res) => {
    try {
        await database.run('DELETE FROM stats');
        await database.run('DELETE FROM sessions');
        await database.run('DELETE FROM sell_sessions');
        await database.run('DELETE FROM cooldowns');
        await database.run('DELETE FROM resupply');
        await database.run('DELETE FROM production_state');
        await database.run('DELETE FROM safe_collections');
        res.json({ success: true, message: 'All stats reset successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Bulk operations
const bulkCreateActivities = async (req, res) => {
    try {
        const activities = req.body.activities || req.body;
        if (!Array.isArray(activities)) {
            return res.status(400).json({ error: 'activities must be an array' });
        }
        for (const activity of activities) {
            await database.run(`
                INSERT OR REPLACE INTO activities (
                    id, variant, name, category, release_year, avg_payout, avg_time_minutes,
                    efficiency, cooldown_minutes, resupply_minutes, payout_type,
                    modifiers, players_min, players_max, requires, cooldowns, tags, source_url, update_name,
                    solo, passive, boostable
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                activity.id, activity.variant, activity.name, activity.category, activity.release,
                activity.avgPayout, activity.avgTimeMin, activity.efficiency,
                activity.minCooldown, activity.resupplyMin || 0,
                activity.payoutType,
                JSON.stringify(activity.modifiers || []),
                activity.playersMin ?? null,
                activity.playersMax ?? null,
                activity.requires ? JSON.stringify(activity.requires) : null,
                activity.cooldowns ? JSON.stringify(activity.cooldowns) : null,
                activity.tags ? JSON.stringify(activity.tags) : null,
                activity.sourceUrl ?? null,
                activity.update ?? null,
                activity.solo, activity.passive, activity.boostable
            ]);
        }
        res.json(activities);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Imports
// POST /api/gta/import/wiki/category
// Body example:
// {
//   "wikiCategory": "Contact_Missions_in_GTA_Online",
//   "activityCategory": "Contact Missions",
//   "idPrefix": "contact",
//   "tags": ["contact-mission"],
//   "limit": 500
// }
const importWikiCategory = async (req, res) => {
    try {
        const {
            wikiCategory,
            activityCategory,
            idPrefix,
            tags,
            limit,
            maxPages,
            requestDelayMs,
            recursive,
            maxDepth,
            variant,
            release,
            update,
            playersMin,
            playersMax,
        } = req.body || {};

        if (!wikiCategory || typeof wikiCategory !== 'string') {
            return res.status(400).json({ error: 'wikiCategory (string) is required' });
        }
        if (!activityCategory || typeof activityCategory !== 'string') {
            return res.status(400).json({ error: 'activityCategory (string) is required' });
        }

        const useRecursive = !!recursive;
        const limitValue = typeof limit === 'number' ? limit : 500;
        const maxPagesValue = typeof maxPages === 'number' ? maxPages : 50;
        const delayValue = typeof requestDelayMs === 'number' ? requestDelayMs : 250;

        const categoryResult = useRecursive
            ? await getWikiCategoryPagesRecursive({
                category: wikiCategory,
                limit: limitValue,
                maxPages: maxPagesValue,
                requestDelayMs: delayValue,
                maxDepth: typeof maxDepth === 'number' ? maxDepth : 3,
            })
            : { pages: await getWikiCategoryMembers({ category: wikiCategory, limit: limitValue, maxPages: maxPagesValue, requestDelayMs: delayValue }), subcategories: [], visitedCategories: 1 };

        const titles = categoryResult.pages;

        // Filter out obvious non-mission pages & nav pages (very conservative)
        const filteredTitles = titles.filter((t) => {
            const title = String(t);
            if (!title) return false;
            if (title.startsWith('Category:')) return false;
            if (title.startsWith('File:')) return false;
            if (title.startsWith('Template:')) return false;
            if (title.startsWith('User:')) return false;
            if (title.startsWith('Help:')) return false;
            if (title.startsWith('Talk:')) return false;
            if (title.includes('(GTA Online)') && title.includes('Jobs')) return false;
            if (isNonPayingWikiTitle(title)) return false;
            return true;
        });

        const finalIdPrefix = typeof idPrefix === 'string' && idPrefix.trim() ? idPrefix.trim() : 'wiki';
        const finalVariant = typeof variant === 'string' && variant.trim() ? variant.trim() : 'wiki';
        const finalRelease = typeof release === 'number' ? release : null;

        const imported = [];
        for (const title of filteredTitles) {
            const activity = {
                id: toActivityId(finalIdPrefix, title),
                variant: finalVariant,
                name: title,
                category: activityCategory,
                release: finalRelease,
                avgPayout: 0,
                avgTimeMin: 0,
                efficiency: 0,
                minCooldown: 0,
                resupplyMin: 0,
                payoutType: 'money',
                modifiers: [],
                playersMin: typeof playersMin === 'number' ? playersMin : null,
                playersMax: typeof playersMax === 'number' ? playersMax : null,
                requires: null,
                cooldowns: null,
                tags: Array.isArray(tags) ? tags : null,
                sourceUrl: wikiTitleToUrl(title),
                update: typeof update === 'string' ? update : null,
                solo: false,
                passive: false,
                boostable: false,
            };

            await upsertActivity(activity);
            imported.push(activity);
        }

        res.json({
            wikiCategory,
            activityCategory,
            recursive: useRecursive,
            visitedCategories: categoryResult.visitedCategories,
            subcategoriesFound: categoryResult.subcategories?.length ?? 0,
            totalFound: titles.length,
            totalImported: imported.length,
            sample: imported.slice(0, 10),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const importWikiPageSection = async (req, res) => {
    try {
        const {
            wikiPage,
            sectionTitle,
            sectionIndex,
            activityCategory,
            idPrefix,
            tags,
            variant,
            release,
            update,
            playersMin,
            playersMax,
            maxTitles,
            filterByCategoryKeyword,
            filterKeyword,
            pruneExisting,
            excludeTitleRegexes,
            includeTitleRegexes,
        } = req.body || {};

        if (!wikiPage || typeof wikiPage !== 'string') {
            return res.status(400).json({ error: 'wikiPage (string) is required' });
        }
        if (!activityCategory || typeof activityCategory !== 'string') {
            return res.status(400).json({ error: 'activityCategory (string) is required' });
        }
        if (sectionIndex == null && (!sectionTitle || typeof sectionTitle !== 'string')) {
            return res.status(400).json({ error: 'sectionTitle (string) or sectionIndex (number) is required' });
        }

        const sections = await getWikiPageSections({ page: wikiPage });

        let resolvedIndex = null;
        if (typeof sectionIndex === 'number') {
            resolvedIndex = sectionIndex;
        } else {
            const wanted = String(sectionTitle).trim().toLowerCase();
            const found = sections.find((s) => String(s?.line || '').trim().toLowerCase() === wanted);
            resolvedIndex = found ? Number(found.index) : null;
        }

        if (resolvedIndex == null || Number.isNaN(Number(resolvedIndex))) {
            return res.status(400).json({
                error: 'Could not resolve section. Check sectionTitle/sectionIndex.',
                availableSections: sections.map((s) => ({ index: s.index, line: s.line, level: s.level })),
            });
        }

        const links = await getWikiPageLinksInSection({ page: wikiPage, section: resolvedIndex });

        const titles = [];
        const seen = new Set();
        for (const link of links) {
            if (link?.ns !== 0) continue;
            const title = link?.['*'];
            if (!title) continue;
            const key = String(title).trim().toLowerCase();
            if (!key || seen.has(key)) continue;
            seen.add(key);
            titles.push(String(title));
            if (typeof maxTitles === 'number' && titles.length >= maxTitles) break;
        }

        const excludes = Array.isArray(excludeTitleRegexes)
            ? excludeTitleRegexes
                .map((s) => {
                    try {
                        return new RegExp(String(s), 'i');
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
            : [];

        const excludedTitles = excludes.length
            ? titles.filter((t) => excludes.some((re) => re.test(t)))
            : [];
        const titlesAfterExclude = excludes.length
            ? titles.filter((t) => !excludes.some((re) => re.test(t)))
            : titles;

        const includes = Array.isArray(includeTitleRegexes)
            ? includeTitleRegexes
                .map((s) => {
                    try {
                        return new RegExp(String(s), 'i');
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
            : [];

        const titlesAfterInclude = includes.length
            ? titlesAfterExclude.filter((t) => includes.some((re) => re.test(t)))
            : titlesAfterExclude;

        const shouldFilter = filterByCategoryKeyword !== false;
        const filteredTitles = (shouldFilter
            ? await filterTitlesLikelyMissions({ titles: titlesAfterInclude, requestDelayMs: 0, keyword: filterKeyword || 'missions' })
            : titlesAfterInclude
        ).filter((t) => !isNonPayingWikiTitle(t));

        const finalIdPrefix = typeof idPrefix === 'string' && idPrefix.trim() ? idPrefix.trim() : 'wiki';
        const finalVariant = typeof variant === 'string' && variant.trim() ? variant.trim() : 'wiki';
        const finalRelease = typeof release === 'number' ? release : null;

        if (pruneExisting) {
            await database.run(
                'DELETE FROM activities WHERE variant = ? AND id LIKE ?',
                [finalVariant, `${finalIdPrefix}-%`]
            );
        }

        const imported = [];
        for (const title of filteredTitles) {
            const activity = {
                id: toActivityId(finalIdPrefix, title),
                variant: finalVariant,
                name: title,
                category: activityCategory,
                release: finalRelease,
                avgPayout: 0,
                avgTimeMin: 0,
                efficiency: 0,
                minCooldown: 0,
                resupplyMin: 0,
                payoutType: 'money',
                modifiers: [],
                playersMin: typeof playersMin === 'number' ? playersMin : null,
                playersMax: typeof playersMax === 'number' ? playersMax : null,
                requires: null,
                cooldowns: null,
                tags: Array.isArray(tags) ? tags : null,
                sourceUrl: wikiTitleToUrl(title),
                update: typeof update === 'string' ? update : null,
                solo: false,
                passive: false,
                boostable: false,
            };

            await upsertActivity(activity);
            imported.push(activity);
        }

        res.json({
            wikiPage,
            sectionIndex: resolvedIndex,
            totalLinks: links.length,
            filterByCategoryKeyword: shouldFilter,
            filterKeyword: shouldFilter ? (filterKeyword || 'missions') : null,
            totalFound: titles.length,
            totalExcluded: excludedTitles.length,
            totalIncluded: titlesAfterInclude.length,
            totalFiltered: filteredTitles.length,
            pruned: !!pruneExisting,
            prunedVariant: pruneExisting ? finalVariant : null,
            prunedIdPrefix: pruneExisting ? finalIdPrefix : null,
            totalImported: imported.length,
            sample: imported.slice(0, 10),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const importWikiPageSections = async (req, res) => {
    try {
        const {
            wikiPage,
            sectionIndices,
            activityCategory,
            idPrefix,
            tags,
            variant,
            release,
            update,
            playersMin,
            playersMax,
            maxTitles,
            filterByCategoryKeyword,
            filterKeyword,
            pruneExisting,
            excludeTitleRegexes,
            includeTitleRegexes,
        } = req.body || {};

        if (!wikiPage || typeof wikiPage !== 'string') {
            return res.status(400).json({ error: 'wikiPage (string) is required' });
        }
        if (!activityCategory || typeof activityCategory !== 'string') {
            return res.status(400).json({ error: 'activityCategory (string) is required' });
        }
        if (!Array.isArray(sectionIndices) || sectionIndices.length === 0) {
            return res.status(400).json({ error: 'sectionIndices (number[]) is required' });
        }

        const indices = sectionIndices
            .map((v) => (typeof v === 'number' ? v : Number(String(v))))
            .filter((v) => Number.isFinite(v));

        if (indices.length === 0) {
            return res.status(400).json({ error: 'sectionIndices must contain at least one valid number' });
        }

        const titles = [];
        const seen = new Set();
        let totalLinks = 0;

        for (const idx of indices) {
            const links = await getWikiPageLinksInSection({ page: wikiPage, section: idx });
            totalLinks += links.length;

            for (const link of links) {
                if (link?.ns !== 0) continue;
                const title = link?.['*'];
                if (!title) continue;

                const key = String(title).trim().toLowerCase();
                if (!key || seen.has(key)) continue;
                seen.add(key);
                titles.push(String(title));

                if (typeof maxTitles === 'number' && titles.length >= maxTitles) break;
            }

            if (typeof maxTitles === 'number' && titles.length >= maxTitles) break;
        }

        const excludes = Array.isArray(excludeTitleRegexes)
            ? excludeTitleRegexes
                .map((s) => {
                    try {
                        return new RegExp(String(s), 'i');
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
            : [];

        const excludedTitles = excludes.length
            ? titles.filter((t) => excludes.some((re) => re.test(t)))
            : [];
        const titlesAfterExclude = excludes.length
            ? titles.filter((t) => !excludes.some((re) => re.test(t)))
            : titles;

        const includes = Array.isArray(includeTitleRegexes)
            ? includeTitleRegexes
                .map((s) => {
                    try {
                        return new RegExp(String(s), 'i');
                    } catch {
                        return null;
                    }
                })
                .filter(Boolean)
            : [];

        const titlesAfterInclude = includes.length
            ? titlesAfterExclude.filter((t) => includes.some((re) => re.test(t)))
            : titlesAfterExclude;

        const shouldFilter = filterByCategoryKeyword !== false;
        const filteredTitles = shouldFilter
            ? await filterTitlesLikelyMissions({ titles: titlesAfterInclude, requestDelayMs: 0, keyword: filterKeyword || 'missions' })
            : titlesAfterInclude;

        const finalIdPrefix = typeof idPrefix === 'string' && idPrefix.trim() ? idPrefix.trim() : 'wiki';
        const finalVariant = typeof variant === 'string' && variant.trim() ? variant.trim() : 'wiki';
        const finalRelease = typeof release === 'number' ? release : null;

        if (pruneExisting) {
            await database.run(
                'DELETE FROM activities WHERE variant = ? AND id LIKE ?',
                [finalVariant, `${finalIdPrefix}-%`]
            );
        }

        const imported = [];
        for (const title of filteredTitles) {
            const activity = {
                id: toActivityId(finalIdPrefix, title),
                variant: finalVariant,
                name: title,
                category: activityCategory,
                release: finalRelease,
                avgPayout: 0,
                avgTimeMin: 0,
                efficiency: 0,
                minCooldown: 0,
                resupplyMin: 0,
                payoutType: 'money',
                modifiers: [],
                playersMin: typeof playersMin === 'number' ? playersMin : null,
                playersMax: typeof playersMax === 'number' ? playersMax : null,
                requires: null,
                cooldowns: null,
                tags: Array.isArray(tags) ? tags : null,
                sourceUrl: wikiTitleToUrl(title),
                update: typeof update === 'string' ? update : null,
                solo: false,
                passive: false,
                boostable: false,
            };

            await upsertActivity(activity);
            imported.push(activity);
        }

        res.json({
            wikiPage,
            sectionIndices: indices,
            totalLinks,
            totalFound: titles.length,
            filterByCategoryKeyword: shouldFilter,
            filterKeyword: shouldFilter ? (filterKeyword || 'missions') : null,
            totalExcluded: excludedTitles.length,
            totalIncluded: titlesAfterInclude.length,
            totalFiltered: filteredTitles.length,
            pruned: !!pruneExisting,
            prunedVariant: pruneExisting ? finalVariant : null,
            prunedIdPrefix: pruneExisting ? finalIdPrefix : null,
            totalImported: imported.length,
            sample: imported.slice(0, 10),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/gta/import/wiki/categories/search
// Body: { "prefix": "Contact", "limit": 50 }
const searchWikiCategories = async (req, res) => {
    try {
        const { prefix, limit } = req.body || {};
        const categories = await searchWikiCategoriesByPrefix({
            prefix: typeof prefix === 'string' ? prefix : '',
            limit: typeof limit === 'number' ? limit : 50,
        });
        res.json({ prefix: prefix ?? '', count: categories.length, categories });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/gta/import/wiki/pages/search
// Body: { "query": "heists gta online", "limit": 20 }
const searchWikiPages = async (req, res) => {
    try {
        const { query, limit } = req.body || {};
        const q = String(query || '').trim();
        if (!q) {
            return res.status(400).json({ error: 'query (string) is required' });
        }

        const params = new URLSearchParams({
            action: 'query',
            format: 'json',
            list: 'search',
            srsearch: q,
            srlimit: String(Math.min(50, Math.max(1, typeof limit === 'number' ? limit : 20))),
        });

        const url = `https://gta.fandom.com/api.php?${params.toString()}`;
        const json = await fetchJson(url);
        const results = json?.query?.search ?? [];

        res.json({
            query: q,
            count: results.length,
            pages: results.map((r) => ({
                title: r.title,
                pageId: r.pageid,
                url: wikiTitleToUrl(r.title),
            })),
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const bulkCreateSessions = async (req, res) => {
    try {
        const sessions = req.body;
        for (const session of sessions) {
            const result = await database.run(`
                INSERT INTO sessions (activity_id, start_time, end_time, money_earned, duration_minutes)
                VALUES (?, ?, ?, ?, ?)
            `, [session.activityId, session.startTime, session.endTime, session.moneyEarned, session.durationMinutes]);
            
            await updateActivityStats(session.activityId, session.moneyEarned || 0, session.durationMinutes || 0);
        }
        res.json(sessions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Helper function to update stats
const updateActivityStats = async (activityId, money, time) => {
    const existingStats = await database.query('SELECT * FROM stats WHERE activity_id = ?', [activityId]);
    if (existingStats.length === 0) {
        await database.run(`
            INSERT INTO stats (activity_id, total_money, total_time, session_count, avg_dpm, last_session)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [activityId, money, time, 1, time > 0 ? money / time : 0]);
    } else {
        const stats = existingStats[0];
        const newTotalMoney = stats.total_money + money;
        const newTotalTime = stats.total_time + time;
        const newSessionCount = stats.session_count + 1;
        const newAvgDpm = newTotalTime > 0 ? newTotalMoney / newTotalTime : 0;
        await database.run(`
            UPDATE stats SET
            total_money = ?, total_time = ?, session_count = ?, avg_dpm = ?,
            last_session = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE activity_id = ?
        `, [newTotalMoney, newTotalTime, newSessionCount, newAvgDpm, activityId]);
    }
};

// Safe collections
const collectSafe = async (req, res) => {
    try {
        const { activityId } = req.params;
        const { moneyCollected } = req.body;
        
        const collectedAt = new Date().toISOString();
        await database.run(`
            INSERT INTO safe_collections (activity_id, collected_at, money_collected)
            VALUES (?, ?, ?)
        `, [activityId, collectedAt, moneyCollected]);
        
        // Update stats with 1 second of time (0.0167 minutes)
        await updateActivityStats(activityId, moneyCollected, 0.0167);
        
        res.json({ activityId, collectedAt, moneyCollected });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getLastCollections = async (req, res) => {
    try {
        const collections = await database.query(`
            SELECT sc.activity_id, sc.collected_at, sc.money_collected, a.name as activity_name
            FROM safe_collections sc
            INNER JOIN (
                SELECT activity_id, MAX(collected_at) as max_collected_at
                FROM safe_collections
                GROUP BY activity_id
            ) latest ON sc.activity_id = latest.activity_id AND sc.collected_at = latest.max_collected_at
            LEFT JOIN activities a ON sc.activity_id = a.id
            ORDER BY sc.collected_at DESC
        `);
        res.json(collections);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllActivities,
    getActivity,
    createActivity,
    updateActivity,
    deleteActivity,
    getAllStats,
    getActivityStats,
    createSession,
    updateSession,
    getRecentSessions,
    startCooldown,
    getActiveCooldowns,
    clearCooldown,
    startResupply,
    getActiveResupply,
    clearResupply,
    getAllProduction,
    getProduction,
    updateProduction,
    clearProduction,
    createSellSession,
    updateSellSession,
    getActiveSellSessions,
    collectSafe,
    getLastCollections,
    resetActivityStats,
    resetAllActivityStats,
    listWikiPageSections,
    importWikiCategory,
    importWikiPageSection,
    importWikiPageSections,
    searchWikiCategories,
    searchWikiPages,
    bulkCreateActivities,
    bulkCreateSessions
};
