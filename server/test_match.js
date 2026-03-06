const jdTextString = "Software Engineer (Frontend/Fullstack) Strong experience with React, Node.js, and TypeScript. Experience with GraphQL API development is an added plus. Experience with AWS.";
const applicantTextString = "Software Engineer React Node.js Developer AWS GraphQL";
const jdText = jdTextString.toLowerCase().replace(/[^a-z\s]/g, ' ');
const words = jdText.split(/\s+/);
const keywordCounts = {};
const stopWords = new Set(['the', 'and', 'to', 'of', 'in', 'for', 'with', 'on', 'is', 'as', 'an', 'be', 'this', 'that', 'are', 'from', 'or', 'have', 'has', 'will', 'you', 'your', 'we', 'our', 'it', 'can', 'all', 'more', 'their', 'which', 'about', 'what', 'how', 'when', 'where', 'who', 'not', 'but', 'so', 'if', 'then', 'than', 'such','here', 'there', 'same','experience', 'with', 'an', 'is', 'for', 'and', 'with']);
words.forEach(w => {
  if (w.length > 3 && !stopWords.has(w)) {
    keywordCounts[w] = (keywordCounts[w] || 0) + 1;
  }
});

const jdKeywords = Object.entries(keywordCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(e => e[0]);
console.log(jdKeywords);
const missingSkills = jdKeywords.filter(kw => !applicantTextString.toLowerCase().includes(kw));

const matchRatio = (jdKeywords.length - missingSkills.length) / jdKeywords.length;
const score = Math.round(100 * matchRatio);
console.log("Score", score);
