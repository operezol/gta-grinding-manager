const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const baseActivities = require('../data/baseActivities');

const DB_PATH = path.join(__dirname, '..', '..', 'gta_tracker.db');

class Database {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
            } else {
                console.log('Connected to SQLite database');
                this.initTables();
            }
        });
    }

    initTables() {
        this.db.serialize(() => {
            // Activities table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS activities (
                    id TEXT PRIMARY KEY,
                    variant TEXT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    release_year INTEGER,
                    avg_payout INTEGER,
                    avg_time_minutes INTEGER,
                    efficiency INTEGER,
                    cooldown_minutes INTEGER,
                    resupply_minutes INTEGER,
                    payout_type TEXT,
                    modifiers TEXT,
                    players_min INTEGER,
                    players_max INTEGER,
                    requires TEXT,
                    cooldowns TEXT,
                    tags TEXT,
                    source_url TEXT,
                    update_name TEXT,
                    solo BOOLEAN,
                    passive BOOLEAN,
                    boostable BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `);

            // Sessions table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id TEXT NOT NULL,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    money_earned INTEGER,
                    duration_minutes REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            // Stats table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS stats (
                    activity_id TEXT PRIMARY KEY,
                    total_money INTEGER DEFAULT 0,
                    total_time REAL DEFAULT 0,
                    session_count INTEGER DEFAULT 0,
                    avg_dpm REAL DEFAULT 0,
                    last_session DATETIME,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            // Cooldowns table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS cooldowns (
                    activity_id TEXT PRIMARY KEY,
                    end_time DATETIME NOT NULL,
                    notified BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            // Resupply table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS resupply (
                    activity_id TEXT PRIMARY KEY,
                    end_time DATETIME NOT NULL,
                    notified BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            // Production state table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS production_state (
                    activity_id TEXT PRIMARY KEY,
                    current_stock INTEGER DEFAULT 0,
                    last_resupply_time DATETIME,
                    full_notified BOOLEAN DEFAULT FALSE,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            // Sell sessions table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS sell_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id TEXT NOT NULL,
                    start_time DATETIME NOT NULL,
                    end_time DATETIME,
                    money_earned INTEGER,
                    active_minutes REAL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            // Safe collections table
            this.db.run(`
                CREATE TABLE IF NOT EXISTS safe_collections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    activity_id TEXT NOT NULL,
                    collected_at DATETIME NOT NULL,
                    money_collected INTEGER NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (activity_id) REFERENCES activities (id)
                )
            `);

            this.ensureActivitiesSchemaAndSeed();

            console.log('Database tables initialized');
        });
    }

    ensureActivitiesSchemaAndSeed() {
        this.db.all('PRAGMA table_info(activities)', (err, columns) => {
            if (err) {
                console.error('Error reading activities schema:', err.message);
                return;
            }

            const hasVariant = columns.some((c) => c.name === 'variant');
            const hasModifiers = columns.some((c) => c.name === 'modifiers');
            const hasBoostable = columns.some((c) => c.name === 'boostable');
            const hasPlayersMin = columns.some((c) => c.name === 'players_min');
            const hasPlayersMax = columns.some((c) => c.name === 'players_max');
            const hasRequires = columns.some((c) => c.name === 'requires');
            const hasCooldowns = columns.some((c) => c.name === 'cooldowns');
            const hasTags = columns.some((c) => c.name === 'tags');
            const hasSourceUrl = columns.some((c) => c.name === 'source_url');
            const hasUpdateName = columns.some((c) => c.name === 'update_name');
            const hasMaxStock = columns.some((c) => c.name === 'max_stock');
            const hasStockValue = columns.some((c) => c.name === 'stock_value');

            const alters = [];
            if (!hasVariant) alters.push('ALTER TABLE activities ADD COLUMN variant TEXT');
            if (!hasModifiers) alters.push('ALTER TABLE activities ADD COLUMN modifiers TEXT');
            if (!hasBoostable) alters.push('ALTER TABLE activities ADD COLUMN boostable BOOLEAN DEFAULT FALSE');
            if (!hasPlayersMin) alters.push('ALTER TABLE activities ADD COLUMN players_min INTEGER');
            if (!hasPlayersMax) alters.push('ALTER TABLE activities ADD COLUMN players_max INTEGER');
            if (!hasRequires) alters.push('ALTER TABLE activities ADD COLUMN requires TEXT');
            if (!hasCooldowns) alters.push('ALTER TABLE activities ADD COLUMN cooldowns TEXT');
            if (!hasTags) alters.push('ALTER TABLE activities ADD COLUMN tags TEXT');
            if (!hasSourceUrl) alters.push('ALTER TABLE activities ADD COLUMN source_url TEXT');
            if (!hasUpdateName) alters.push('ALTER TABLE activities ADD COLUMN update_name TEXT');
            if (!hasMaxStock) alters.push('ALTER TABLE activities ADD COLUMN max_stock REAL');
            if (!hasStockValue) alters.push('ALTER TABLE activities ADD COLUMN stock_value INTEGER');

            const runNext = () => {
                const sql = alters.shift();
                if (!sql) {
                    this.seedBaseActivitiesIfEmpty();
                    return;
                }
                this.db.run(sql, (alterErr) => {
                    if (alterErr) {
                        console.error('Error altering activities schema:', alterErr.message);
                        return;
                    }
                    runNext();
                });
            };

            runNext();
        });
    }

    seedBaseActivitiesIfEmpty() {
        this.db.get('SELECT COUNT(*) as count FROM activities', (err, row) => {
            if (err) {
                console.error('Error checking activities count:', err.message);
                return;
            }

            if ((row?.count ?? 0) > 0) return;

            const stmt = this.db.prepare(`
                INSERT INTO activities (
                    id, variant, name, category, release_year, avg_payout, avg_time_minutes,
                    efficiency, cooldown_minutes, resupply_minutes, payout_type,
                    modifiers, players_min, players_max, requires, cooldowns, tags, source_url, update_name,
                    solo, passive, boostable, max_stock, stock_value
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            for (const a of baseActivities) {
                const playersMin = typeof a.playersMin === 'number' ? a.playersMin : (a.solo ? 1 : 2);
                const playersMax = typeof a.playersMax === 'number' ? a.playersMax : (a.solo || a.passive ? 1 : 4);

                stmt.run([
                    a.id,
                    a.variant,
                    a.name,
                    a.category,
                    a.release,
                    a.avgPayout,
                    a.avgTimeMin,
                    a.efficiency,
                    a.minCooldown,
                    a.resupplyMin || 0,
                    a.payoutType,
                    JSON.stringify(a.modifiers ?? []),
                    playersMin,
                    playersMax,
                    a.requires ? JSON.stringify(a.requires) : null,
                    a.cooldowns ? JSON.stringify(a.cooldowns) : null,
                    a.tags ? JSON.stringify(a.tags) : null,
                    a.sourceUrl || null,
                    a.update || null,
                    a.solo ? 1 : 0,
                    a.passive ? 1 : 0,
                    a.boostable ? 1 : 0,
                    a.maxStock || null,
                    a.stockValue || null,
                ]);
            }

            stmt.finalize(() => {
                console.log(`Seeded ${baseActivities.length} base activities into database`);
            });
        });
    }

    // Generic query method
    query(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    // Generic run method for INSERT/UPDATE/DELETE
    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    close() {
        this.db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('Database connection closed');
            }
        });
    }
}

module.exports = new Database();