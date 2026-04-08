/**
 * Matching Service
 * Handles AI-driven resume scoring and job description matching
 */

const STOP_WORDS = new Set([
  'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'no', 'nor', 'only', 'own', 'same', 'too', 'very',
  'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent',
  'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including', 'candidate', 'ideal', 'successful', 'position', 'opportunity'
]);

// Common technical terms to prioritize
const TECH_TERMS = new Set([
  'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'cicd', 'git', 'github', 'agile', 'scrum', 'backend', 'frontend', 'fullstack', 'devops', 'machine', 'learning', 'ai', 'data', 'science', 'mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'redux', 'graphql', 'rest', 'api', 'microservices'
]);

export interface MatchResult {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
  experienceGap: string;
  scoreBreakdown: {
    skillMatch: number;      // max 50
    expMatch: number;        // max 30
    eduMatch: number;        // max 10
    keywordMatch: number;    // max 10
    total: number;
  };
}

/**
 * Extracts key technical terms and important words from a text string
 */
export function extractKeywords(text: string, limit = 15): string[] {
  if (!text) return [];
  
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/);
  
  const keywordCounts: Record<string, number> = {};
  
  words.forEach(word => {
    if (word.length >= 2 && !STOP_WORDS.has(word)) {
      // Give 2x weight to known tech terms
      const weight = TECH_TERMS.has(word) ? 2 : 1;
      keywordCounts[word] = (keywordCounts[word] || 0) + weight;
    }
  });
  
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);
}

/**
 * Calculates a match score between a candidate profile and a job description
 */
export async function calculateMatchScore(
  applicantText: string,
  jobDescription: string,
  jobTitle: string
): Promise<MatchResult> {
  const fullApplicantText = applicantText.toLowerCase();
  const fullJD = `${jobTitle} ${jobDescription}`.toLowerCase();
  
  // 1. Keyword/Skill Extraction & Matching (50 points)
  const jdKeywords = extractKeywords(fullJD, 25);
  const matched = jdKeywords.filter(kw => {
    const isTech = TECH_TERMS.has(kw);
    const escapedKw = kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    
    if (isTech) {
      // For tech terms, allow substring match (e.g. "React" in "ReactJS")
      const techRegex = new RegExp(escapedKw, 'i');
      return techRegex.test(fullApplicantText);
    }
    
    // For non-tech terms, use word boundaries to avoid false positives (e.g. "team" in "steam")
    const boundaryRegex = new RegExp(`\\b${escapedKw}\\b`, 'i');
    return boundaryRegex.test(fullApplicantText);
  });
  
  const skillMatchPoints = jdKeywords.length > 0 
    ? Math.round((matched.length / jdKeywords.length) * 50) 
    : 50;
    
  // 2. Experience Assessment (30 points)
  let expPoints = 0;
  let expGap = 'Candidate matches the required professional trajectory.';
  
  const seniorTerms = ['senior', 'sr', 'lead', 'principal', 'architect', 'manager', 'head'];
  const jdRequiresSenior = seniorTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(fullJD));
  const applicantIsSenior = seniorTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(fullApplicantText));
  
  if (jdRequiresSenior) {
    if (applicantIsSenior) {
      expPoints += 20;
    } else {
      expGap = 'Job requires senior-level experience which is not prominently featured in the profile.';
      expPoints += 5;
    }
  } else {
    // For non-senior roles, generic experience terms count
    const genericExpTerms = ['experience', 'years', 'career', 'professional', 'worked', 'industry'];
    const hasExp = genericExpTerms.some(term => fullApplicantText.includes(term));
    expPoints += hasExp ? 20 : 10;
  }
  
  // Bonus points for years of experience match (heuristic)
  const yearsMatch = fullJD.match(/(\d+)\+?\s*years/);
  if (yearsMatch) {
    const requiredYears = parseInt(yearsMatch[1]);
    
    // Find MAX years mentioned in the applicant text
    const applicantYearsMatches = fullApplicantText.match(/(\d+)\+?\s*years/g);
    let maxAppYears = 0;
    if (applicantYearsMatches) {
        maxAppYears = Math.max(...applicantYearsMatches.map(m => parseInt(m.match(/\d+/)[0])));
    }

    if (maxAppYears >= requiredYears) {
      expPoints += 10;
    } else if (maxAppYears >= requiredYears - 2) {
      expPoints += 5;
    } else if (applicantIsSenior) {
      expPoints += 7; // Senior title implies significant years
    }
  } else {
    // If JD doesn't specify years, look for hints in applicant profile
    if (applicantIsSenior || fullApplicantText.includes('experience') || fullApplicantText.includes('years')) {
      expPoints += 10;
    } else {
      expPoints += 5;
    }
  }
  
  // 3. Education Assessment (10 points)
  let eduPoints = 0;
  const degreeTerms = ['degree', 'bachelor', 'master', 'phd', 'university', 'college', 'graduate', 'ug', 'pg', 'btech', 'be', 'mtech', 'me', 'mba', 'mca', 'bca'];
  const hasDegree = degreeTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(fullApplicantText));
  
  if (hasDegree) {
    eduPoints = 10;
  } else {
    const jdRequiresDegree = degreeTerms.some(term => new RegExp(`\\b${term}\\b`, 'i').test(fullJD));
    eduPoints = jdRequiresDegree ? 2 : 7; // Partial points even if no degree found, unless explicit JD requirement
  }
  
  // 4. Keyword Strength / Density (10 points)
  // Check how many of our prioritized tech terms appear
  const techMatches = Array.from(TECH_TERMS).filter(term => {
    const termRegex = new RegExp(`\\b${term}\\b`, 'i');
    return termRegex.test(fullApplicantText);
  });
  const keywordPoints = Math.min(10, Math.round((techMatches.length / 3) * 10)); // Max points at 3+ tech terms
  
  const totalScore = Math.min(100, skillMatchPoints + expPoints + eduPoints + keywordPoints);
  
  const missingSkills = jdKeywords
    .filter(kw => !matched.includes(kw))
    .map(s => s.charAt(0).toUpperCase() + s.slice(1));
    
  const matchedSkills = matched.map(s => s.charAt(0).toUpperCase() + s.slice(1));
  
  return {
    score: totalScore,
    matchedSkills: matchedSkills.length > 0 ? matchedSkills : ['Domain Knowledge'],
    missingSkills: missingSkills.length > 0 ? missingSkills : ['None (Strong Match)'],
    experienceGap: expGap,
    scoreBreakdown: {
      skillMatch: skillMatchPoints,
      expMatch: expPoints,
      eduMatch: eduPoints,
      keywordMatch: keywordPoints,
      total: totalScore
    }
  };
}
