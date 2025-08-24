// src/utils/autoAssignPriority.js

const autoAssignPriority = (description, keywords) => {
    if (!description || typeof description !== "string") return "Low";
    const desc = description.toLowerCase();

    // Helper to check for any keyword match
    const keywordMatch = (kwList) =>
        kwList.some(kw => {
            if (kw.trim().includes(" ")) {
                return desc.includes(kw.toLowerCase());
            } else {
                return new RegExp(`\\b${kw}\\b`, "i").test(desc) || desc.includes(kw.toLowerCase());
            }
        });

    if (keywordMatch(keywords.high)) return "High";
    if (keywordMatch(keywords.medium)) return "Medium";
    return "Low";
};

export default autoAssignPriority;