// src/utils/autoAssignPriority.js

const autoAssignPriority = (description, keywords) => {
    if (!description || typeof description !== "string") return "Low";
    const desc = description.toLowerCase();

    // Enhanced keyword matching logic
    const keywordMatch = (kwList) =>
        kwList.some(kw => {
            if (kw.trim().includes(" ")) {
                return desc.includes(kw.toLowerCase());
            } else {
                return new RegExp(`\\b${kw}\\b`, "i").test(desc) || desc.includes(kw.toLowerCase());
            }
        });

    // Additional keywords for better priority assignment
    const additionalKeywords = {
        high: ["urgent", "immediate", "asap", "critical", "emergency"],
        medium: ["important", "needs attention", "moderate"],
        low: ["minor", "trivial", "not urgent"]
    };

    // Check for priority assignment
    if (keywordMatch(keywords.high.concat(additionalKeywords.high))) return "High";
    if (keywordMatch(keywords.medium.concat(additionalKeywords.medium))) return "Medium";
    return "Low";
};

export default autoAssignPriority;
