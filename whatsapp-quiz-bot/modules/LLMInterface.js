class LLMInterface {
    constructor() {
        this.apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || null;
        this.model = process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite-preview';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models';
    }

    async generateResponse(question, questionType) {
        try {
            if (!this.apiKey) {
                console.error('Clé API Gemini manquante - définir GOOGLE_API_KEY');
                return 'Nx';
            }

            const prompt = this.constructPrompt(question, questionType);
            const answer = await this.callGemini(prompt);

            if (!answer) return 'Nx';

            const trimmed = answer.trim();

            if (this.isUncertainResponse(trimmed)) {
                return 'Nx';
            }

            return trimmed;
        } catch (error) {
            console.error('Erreur appel Gemini:', error.message);
            return 'Nx';
        }
    }

    async callGemini(prompt) {
        const url = `${this.baseUrl}/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: 'user',
                        parts: [{ text: prompt }]
                    }
                ],
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 2500
                }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Gemini HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        return text ? text.trim() : 'Nx';
    }

    constructPrompt(question, questionType) {
        const systemInstruction = `[Instructions globales : répondre ultra-concis, vérifier wiki, pas de sources, pas de citations, juste réponses ultra-courtes]

Tu es un assistant de recherche. Règles absolues :
1. Réponses ultra-courtes uniquement — juste la réponse, rien d'autre
2. Pas de sources, pas de liens, pas de guillemets
3. Pas de point à la fin de la réponse
4. Pour les questions sur des animes/mangas : vérifie toujours l'information sur le wiki dédié (fandom.com ou wiki officiel de l'anime). Si l'information n'y figure pas ou si tu n'es pas certain, réponds exactement : Nx
5. Si tu ne connais pas la réponse ou si tu n'es pas sûr : réponds exactement : Nx
6. Exemples de format : "Pikachu, Racaillou" ou "Sasuke" ou "Vrai" — jamais de phrases longues
7. Si on te demande ce que quelqu'un a dit : donne juste le contenu, sans guillemets
8. Si le message reçu n'est pas une réponse exploitable (hors sujet, bruit, ambigu, incomplet), réponds exactement : l'information n'y figure pas

Question : ${question}`;

        return systemInstruction;
    }

    isUncertainResponse(response) {
        const uncertainPhrases = [
            /^nx$/i,
            /l['']information ne figure pas/i,
            /l['']information n['']y figure pas/i,
            /don['']t know/i,
            /not sure/i,
            /unsure/i,
            /can['']t determine/i,
            /unable to/i,
            /no information/i,
            /je ne sais pas/i,
            /je ne suis pas sûr/i,
            /information non disponible/i,
            /pas mentionné/i,
            /non mentionné/i,
            /not mentioned/i,
            /not found/i,
            /introuvable/i
        ];

        return uncertainPhrases.some((phrase) => phrase.test(response));
    }
}

module.exports = LLMInterface;
