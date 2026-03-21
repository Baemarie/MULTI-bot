class MessagePreprocessor {
    constructor() {
        this.quizHeaderPattern = /^🔲\s*\*[^*]+[⁰¹²³⁴⁵⁶⁷⁸⁹]+\*?/u;

        // Numbered question patterns — plain or bold (preceded by *)
        // Matches: 1- / 1. / 1) / Q1- / Q1. / Question 1 — and their *bold* variants
        this.numberedPatterns = [
            /^\*?\d+[\-\.\)]/,
            /^\*?Question\s+\d+/i,
            /^\*?№\d+/i,
            /^\*?Q\d+[\-\.\)]/i
        ];
    }

    isQuestion(text) {
        if (!text || text.trim().length < 3) return false;

        if (this.quizHeaderPattern.test(text.trim())) return true;

        return this.numberedPatterns.some((pattern) => pattern.test(text.trim()));
    }

    extractAnimeFromHeader(text) {
        const match = text.match(/^🔲\s*\*([^*⁰¹²³⁴⁵⁶⁷⁸⁹]+)[⁰¹²³⁴⁵⁶⁷⁸⁹]*/u);
        if (match) return match[1].trim();
        return null;
    }

    detectQuestionType(text) {
        if (this.quizHeaderPattern.test(text.trim())) return 'anime_manga';
        return 'general_knowledge';
    }

    process(text) {
        let cleanedText = text.trim();

        if (this.quizHeaderPattern.test(cleanedText)) {
            const animeName = this.extractAnimeFromHeader(cleanedText);
            const lines = cleanedText.split('\n').map((l) => l.trim()).filter(Boolean);
            const questionLines = lines.slice(1).map((l) => l.replace(/^\*|\*$/g, '').trim());
            const questionText = questionLines.join(' ').trim();
            const finalQuestion = animeName ? `[${animeName}] ${questionText}` : questionText;

            return {
                original: text,
                cleaned: cleanedText,
                question: finalQuestion || cleanedText,
                containsQuestion: true,
                animeName
            };
        }

        // Numbered question — strip bold markers and return as-is
        const stripped = cleanedText.replace(/^\*|\*$/g, '').trim();

        return {
            original: text,
            cleaned: cleanedText,
            question: stripped,
            containsQuestion: true,
            animeName: null
        };
    }
}

module.exports = MessagePreprocessor;
