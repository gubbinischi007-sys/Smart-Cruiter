import express from 'express';
import { get, all } from '../database.js';

const router = express.Router();

router.get('/:candidateId/:jobId', async (req, res) => {
    const { candidateId, jobId } = req.params;

    try {
        const applicant = await get('SELECT * FROM applicants WHERE id = ?', [candidateId]);
        const job = await get('SELECT * FROM jobs WHERE id = ?', [jobId]);

        if (!applicant || !job) {
            return res.status(404).json({ error: 'Applicant or Job not found' });
        }

        // Extremely simple pseudo-AI logic generating the match breakdown dynamically based on simple properties

        let status = 'Verified';
        let identityConflictReason = null;

        const resumeUrlLower = (applicant.resume_url || '').toLowerCase();
        const nameParts = [
            (applicant.first_name || '').toLowerCase(),
            (applicant.last_name || '').toLowerCase(),
            (applicant.email || '').split('@')[0].toLowerCase()
        ];

        const isLocalOwner = nameParts.some(part => part.length >= 3 && resumeUrlLower.includes(part));

        if (resumeUrlLower && !isLocalOwner) {
            status = 'Conflict';
            identityConflictReason = 'Name on file does not strongly correlate with resume metadata or email.';
        }

        // Extract dynamic keywords based on actual words in the Job Description, not a static list
        const extractJDKeywords = (text: string) => {
            if (!text) return [];
            const cleanText = text.toLowerCase().replace(/[^a-z\s]/g, ' ');
            const words = cleanText.split(/\s+/);

            // Common english stopwords to ignore, including generic job description boilerplate
            const stopWords = new Set([
                'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'too', 'very',
                'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent',
                'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including',
                'design', 'designing', 'development', 'software', 'applications', 'systems', 'business', 'data', 'technical', 'technology', 'environment', 'project', 'projects', 'solutions', 'process', 'processes', 'management', 'client', 'clients', 'user', 'users', 'product', 'products', 'service', 'services', 'support', 'performance', 'quality', 'best', 'practices', 'drive', 'driving', 'within', 'across', 'highly', 'related', 'field', 'degree', 'computer', 'science', 'engineering', 'bachelor', 'master', 'equivalent',
                'must', 'plus', 'preferred', 'solid', 'proven', 'track', 'record', 'familiarity', 'proficient', 'proficiency', 'hands-on', 'position', 'opportunity', 'culture', 'benefits', 'salary', 'compensation', 'remote', 'flexible', 'office', 'join', 'hire', 'hiring', 'candidate', 'successful', 'ideal', 'passionate', 'driven', 'motivated', 'self-starter', 'fast-paced', 'dynamic', 'innovative', 'cutting-edge', 'industry', 'collaborating', 'cross', 'functional', 'teams'
            ]);

            const keywordCounts: Record<string, number> = {};
            words.forEach(w => {
                if (w.length > 3 && !stopWords.has(w)) {
                    keywordCounts[w] = (keywordCounts[w] || 0) + 1;
                }
            });

            // Get top most frequent meaningful words as the "required skills"
            return Object.entries(keywordCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(entry => entry[0]);
        };

        const jdText = `${job.title || ''} ${job.requirements || job.description || ''}`;
        const storedResumeText = (applicant.resume_text || '').toLowerCase();
        const simulatedFallback = applicant.resume_url ? 'university bachelor degree experience intern pu school career team worked' : '';
        const bodyText = storedResumeText.length > 20 ? storedResumeText : simulatedFallback;
        const applicantText = `${applicant.job_title || ''} ${applicant.first_name || ''} ${applicant.resume_url || ''} ${applicant.cover_letter || ''} ${bodyText}`.toLowerCase();

        const jobKeywords = extractJDKeywords(jdText);

        let missingSkills = jobKeywords.filter(kw => !applicantText.includes(kw));
        let matchedSkills = jobKeywords.filter(kw => applicantText.includes(kw));

        let experienceGap = 'Candidate meets minimum requirements.';
        const jdTextLower = jdText.toLowerCase();
        const mentionsExperience = jdTextLower.includes('experience') || jdTextLower.includes('years') || jdTextLower.includes('senior') || jdTextLower.includes('track record');

        const combinedId = candidateId + jobId;
        let scoreBump = combinedId.charCodeAt(0) % 10;

        // Dynamic adjusting based on found keywords and experience context
        if (jobKeywords.length > 0) {
            const matchRatio = (jobKeywords.length - missingSkills.length) / jobKeywords.length;
            if (matchRatio < 0.5) {
                experienceGap = mentionsExperience
                    ? 'Job requires more direct experience with the core technologies mentioned in the JD.'
                    : 'Candidate is missing several core competencies outlined in the role requirements.';
            } else if (matchRatio > 0.8) {
                experienceGap = mentionsExperience
                    ? 'Extremely strong proven alignment with the required experience and technologies.'
                    : 'Extremely strong alignment with the job description and requirements.';
            } else {
                experienceGap = mentionsExperience
                    ? 'Candidate meets general experience requirements but lacks some specific technical depths.'
                    : 'Candidate generally fits the role requirements.';
            }
        } else {
            experienceGap = mentionsExperience
                ? 'Standard candidate profile match for required experience.'
                : 'No specific prior experience explicitly required by the job description.';
        }

        // Overwrite if no experience is fundamentally required and they are missing lot of skills
        if (!mentionsExperience && experienceGap.includes('direct experience')) {
            experienceGap = 'No specific prior experience explicitly required by the job description, but core skills are missing.';
        }

        if (!applicant.resume_url && !applicant.cover_letter) {
            status = 'Conflict';
            identityConflictReason = 'No resume or cover letter provided for analysis.';
            missingSkills = ['Cannot verify skills without document or cover letter'];
            matchedSkills = [];
            experienceGap = 'Cannot verify experience gap without details';
        }

        if (missingSkills.length === 0) {
            missingSkills.push('None critical detected (strong match)');
        }
        if (matchedSkills.length === 0) {
            matchedSkills.push('No direct hard skill match detected');
        }

        // Capitalize missing skills strings for nice UI
        missingSkills = missingSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1));
        matchedSkills = matchedSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1));

        // Note: we remove backend scoreBreakdown so the frontend's table score remains the single source of truth for the match score.
        res.json({
            status,
            missingSkills,
            matchedSkills,
            experienceGap,
            identityConflictReason
        });

    } catch (error) {
        console.error('Error in match-details:', error);
        res.status(500).json({ error: 'Server error analyzing match data' });
    }
});

export const matchDetailsRoutes = router;
