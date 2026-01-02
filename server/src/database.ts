import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../database.sqlite');

let db: sqlite3.Database;

export function getDb(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(DB_PATH);
  }
  return db;
}

export function run(sql: string, params: any[] = []): Promise<sqlite3.RunResult> {
  return new Promise((resolve, reject) => {
    getDb().run(sql, params, function (this: sqlite3.RunResult, err: Error | null): void {
      if (err) {
        reject(err);
      } else {
        resolve(this);
      }
    });
  });
}

export function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    getDb().get(sql, params, (err: Error | null, row: any) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}

export function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    getDb().all(sql, params, (err: Error | null, rows: any[]) => {
      if (err) reject(err);
      else resolve(rows as T[]);
    });
  });
}

export async function initDatabase(): Promise<void> {
  // Create Jobs table
  await run(`
    CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      type TEXT,
      description TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create Applicants table
  await run(`
    CREATE TABLE IF NOT EXISTS applicants (
      id TEXT PRIMARY KEY,
      job_id TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      resume_url TEXT,
      cover_letter TEXT,
      stage TEXT DEFAULT 'applied',
      status TEXT DEFAULT 'active',
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      offer_salary TEXT,
      offer_joining_date TEXT,
      offer_status TEXT, -- 'pending', 'accepted', 'rejected'
      offer_notes TEXT,
      offer_sent_at DATETIME,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  // Migration for existing tables: Check and add offer columns if they don't exist
  const tableInfo = await all(`PRAGMA table_info(applicants)`);
  const columns = tableInfo.map((col: any) => col.name);

  if (!columns.includes('offer_salary')) {
    await run(`ALTER TABLE applicants ADD COLUMN offer_salary TEXT`);
  }
  if (!columns.includes('offer_joining_date')) {
    await run(`ALTER TABLE applicants ADD COLUMN offer_joining_date TEXT`);
  }
  if (!columns.includes('offer_status')) {
    await run(`ALTER TABLE applicants ADD COLUMN offer_status TEXT`);
  }
  if (!columns.includes('offer_notes')) {
    await run(`ALTER TABLE applicants ADD COLUMN offer_notes TEXT`);
  }
  if (!columns.includes('offer_sent_at')) {
    await run(`ALTER TABLE applicants ADD COLUMN offer_sent_at DATETIME`);
  }
  if (!columns.includes('offer_rules')) {
    await run(`ALTER TABLE applicants ADD COLUMN offer_rules TEXT`);
  }

  // Create Interviews table
  await run(`
    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      type TEXT DEFAULT 'online',
      meeting_link TEXT,
      notes TEXT,
      status TEXT DEFAULT 'scheduled',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
      FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
    )
  `);

  // Create indexes
  await run(`CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON interviews(applicant_id)`);
  await run(`CREATE INDEX IF NOT EXISTS idx_interviews_job_id ON interviews(job_id)`);

  console.log('Database tables created/verified');
}

