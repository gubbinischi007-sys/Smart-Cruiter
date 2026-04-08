const STOP_WORDS = new Set([
  'the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'at', 'by', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such', 'into', 'out', 'up', 'down', 'over', 'under', 'again', 'further', 'once', 'here', 'there', 'some', 'any', 'both', 'each', 'few', 'most', 'other', 'no', 'nor', 'only', 'own', 'same', 'too', 'very',
  'job', 'role', 'team', 'work', 'company', 'experience', 'skills', 'looking', 'years', 'working', 'using', 'ability', 'knowledge', 'strong', 'good', 'excellent',
  'responsible', 'developing', 'maintaining', 'building', 'creating', 'testing', 'writing', 'managing', 'leading', 'supporting', 'understanding', 'ensure', 'ensuring', 'provide', 'providing', 'required', 'requirements', 'including', 'candidate', 'ideal', 'successful', 'position', 'opportunity'
]);

const TECH_TERMS = new Set([
  'javascript', 'typescript', 'python', 'java', 'react', 'node', 'angular', 'vue', 'express', 'django', 'flask', 'spring', 'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'cicd', 'git', 'github', 'agile', 'scrum', 'backend', 'frontend', 'fullstack', 'devops', 'machine', 'learning', 'ai', 'data', 'science', 'mobile', 'ios', 'android', 'swift', 'kotlin', 'flutter', 'redux', 'graphql', 'rest', 'api', 'microservices'
]);

function extractKeywords(text, limit = 15) {
  if (!text) return [];
  const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
  const words = cleanText.split(/\s+/);
  const keywordCounts = {};
  words.forEach(word => {
    if (word.length >= 2 && !STOP_WORDS.has(word)) {
      const weight = TECH_TERMS.has(word) ? 2 : 1;
      keywordCounts[word] = (keywordCounts[word] || 0) + weight;
    }
  });
  return Object.entries(keywordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(entry => entry[0]);
}

async function test() {
  const jobDescription = "We are looking for a Senior React Developer with experience in Node.js and AWS.";
  const jobTitle = "Senior React Developer";
  const applicantText = "I am a Senior Software Engineer with 5 years of experience in React and Node.";

  console.log("--- JD Keywords ---");
  const jdKeywords = extractKeywords(`${jobTitle} ${jobDescription}`, 15);
  console.log(jdKeywords);

  console.log("\n--- Matching ---");
  const fullApplicantText = applicantText.toLowerCase();
  const matched = jdKeywords.filter(kw => {
    const regex = new RegExp(`\\b${kw.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    const isMatch = regex.test(fullApplicantText);
    console.log(`Keyword: ${kw}, Match: ${isMatch}`);
    return isMatch;
  });

  console.log("\n--- Scores ---");
  const skillMatchPoints = jdKeywords.length > 0 
    ? Math.round((matched.length / jdKeywords.length) * 50) 
    : 50;
  console.log(`Skill Match Points: ${skillMatchPoints}`);
}

test();
