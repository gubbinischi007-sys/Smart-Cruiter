import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

let db: Database;

async function getDb() {
  if (!db) {
    db = await open({
      filename: path.join(process.cwd(), 'database.sqlite'),
      driver: sqlite3.Database
    });
  }
  return db;
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  const database = await getDb();
  await database.run(sql, params);
}

export async function get<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  const database = await getDb();
  return database.get<T>(sql, params);
}

export async function all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const database = await getDb();
  return database.all(sql, params) as unknown as Promise<T[]>;
}

export async function initDatabase(): Promise<void> {
  console.log('Initializing SQLite database tables...');
  const database = await getDb();
  const queries = [
    `CREATE TABLE IF NOT EXISTS jobs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      department TEXT,
      location TEXT,
      type TEXT,
      description TEXT,
      requirements TEXT,
      status TEXT DEFAULT 'open',
      company_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS applicants (
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
      offer_status TEXT,
      offer_notes TEXT,
      offer_sent_at DATETIME,
      offer_rules TEXT,
      rejection_reason TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      applicant_id TEXT NOT NULL,
      job_id TEXT NOT NULL,
      scheduled_at DATETIME NOT NULL,
      type TEXT DEFAULT 'online',
      meeting_link TEXT,
      notes TEXT,
      status TEXT DEFAULT 'scheduled',
      reminder_sent INTEGER DEFAULT 0,
      rating INTEGER,
      feedback TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS employees (
      id TEXT PRIMARY KEY,
      applicant_id TEXT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      job_title TEXT,
      department TEXT,
      hired_date DATETIME,
      status TEXT DEFAULT 'active',
      company_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_email TEXT NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'info',
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS application_history (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      job_title TEXT,
      status TEXT NOT NULL,
      reason TEXT,
      company_id TEXT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_applicants_job_id ON applicants(job_id)`,
    `CREATE INDEX IF NOT EXISTS idx_applicants_stage ON applicants(stage)`,
    `CREATE INDEX IF NOT EXISTS idx_interviews_applicant_id ON interviews(applicant_id)`,
    `CREATE INDEX IF NOT EXISTS idx_history_email ON application_history(email)`
  ];
  for (const query of queries) {
    try {
      await database.run(query);
    } catch (error) {
      console.error('Error executing query:', query, error);
    }
  }

  // Add reminder_sent column to existing database if it doesn't exist
  try {
    await database.run(`ALTER TABLE interviews ADD COLUMN reminder_sent INTEGER DEFAULT 0`);
    console.log('Added reminder_sent column to interviews table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding reminder_sent column:', error);
    }
  }

  // Add rating column
  try {
    await database.run(`ALTER TABLE interviews ADD COLUMN rating INTEGER`);
    console.log('Added rating column to interviews table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding rating column:', error);
    }
  }

  // Add feedback column
  try {
    await database.run(`ALTER TABLE interviews ADD COLUMN feedback TEXT`);
    console.log('Added feedback column to interviews table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding feedback column:', error);
    }
  }

  // Add rejection_reason column
  try {
    await database.run(`ALTER TABLE applicants ADD COLUMN rejection_reason TEXT`);
    console.log('Added rejection_reason column to applicants table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding rejection_reason column:', error);
    }
  }

  // Add resume_text column to store parsed PDF content for scoring
  try {
    await database.run(`ALTER TABLE applicants ADD COLUMN resume_text TEXT`);
    console.log('Added resume_text column to applicants table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding resume_text column:', error);
    }
  }

  // Add company_id columns
  try {
    await database.run(`ALTER TABLE jobs ADD COLUMN company_id TEXT`);
    console.log('Added company_id column to jobs table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding company_id column to jobs:', error);
    }
  }
  try {
    await database.run(`ALTER TABLE employees ADD COLUMN company_id TEXT`);
    console.log('Added company_id column to employees table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding company_id column to employees:', error);
    }
  }
  try {
    await database.run(`ALTER TABLE application_history ADD COLUMN company_id TEXT`);
    console.log('Added company_id column to application_history table');
  } catch (error: any) {
    if (!error.message.includes('duplicate column name')) {
      console.error('Error adding company_id column to application_history:', error);
    }
  }
}
