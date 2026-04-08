import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function masterSync() {
    console.log('🚀 Starting Master Synchronization...');

    // 1. Sync Schema
    console.log('Updating Schema...');
    const schemaSql = `
        ALTER TABLE applicants ADD COLUMN IF NOT EXISTS resume_text TEXT;
        ALTER TABLE applicants ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
        ALTER TABLE applicants ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
        CREATE INDEX IF NOT EXISTS idx_applicants_score ON applicants(score);
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS about_us TEXT;
        ALTER TABLE companies ADD COLUMN IF NOT EXISTS brand_color TEXT;
    `;
    const { error: schemaErr } = await sb.rpc('exec_sql', { query: schemaSql });
    if (schemaErr) {
        console.error('❌ Schema Sync Failed:', schemaErr);
        return;
    }
    console.log('✅ Schema Synchronized.');

    // 2. Trigger Data resync via the logic I just added to the server
    // Since I'm in a script, I can just call the logic directly or hit the local endpoint
    console.log('Triggering full candidate re-scoring...');
    try {
        const port = process.env.PORT || 3001;
        const response = await fetch(`http://localhost:${port}/api/applicants/sync-all`);
        if (response.ok) {
            const result = await response.json();
            console.log('✅ Data Sync Complete:', result);
        } else {
            throw new Error('Endpoint failed');
        }
    } catch (e) {
        console.warn('⚠️ Could not hit /sync-all endpoint. Running Direct Database Rescore...');
        
        const { data: applicants, error } = await sb.from('applicants').select('*, jobs(*)');
        if (error) {
            console.error('❌ Failed to fetch applicants:', error);
            return;
        }

        const stopWords = new Set(['the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'no', 'nor', 'only', 'own', 'same', 'too', 'very']);

        for (const applicant of applicants) {
            const job = applicant.jobs;
            if (!job) continue;

            const jdText = `${job.title} ${job.requirements || ''}`.toLowerCase();
            const keywords = jdText.split(/\s+/).filter(w => w.length > 3 && !stopWords.has(w)).slice(0, 10);
            
            const resumeText = (applicant.resume_text || '').toLowerCase();
            const matches = keywords.filter(k => resumeText.includes(k));
            
            let score = 0;
            if (keywords.length > 0) {
                score = Math.round(100 * (matches.length / keywords.length));
                if (['degree', 'university', 'bachelor'].some(t => resumeText.includes(t))) score += 15;
                if (['experience', 'worked'].some(t => resumeText.includes(t))) score += 15;
                score = Math.min(score, 100);
            }

            let newStage = 'applied';
            if (score >= 90) newStage = 'shortlisted';
            else if (score >= 81) newStage = 'recommended';
            else if (score >= 51) newStage = 'applied';
            else if (score <= 50) newStage = 'rejected';

            await sb.from('applicants').update({ 
                stage: newStage, 
                score: score,
                status: newStage === 'rejected' ? 'rejected' : 'active' 
            }).eq('id', applicant.id);
        }
        console.log(`✅ Direct Rescore Complete for ${applicants.length} candidates.`);
    }

    console.log('✨ PROJECT & DATABASE TOTALLY SYNCED! ✨');
}

masterSync();
