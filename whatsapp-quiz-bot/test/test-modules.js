// Test script to verify the modules work correctly
const MessagePreprocessor = require('../modules/MessagePreprocessor');
const ResponseFormatter = require('../modules/ResponseFormatter');

const assert = require('assert');

// Conditionally load LLMInterface to avoid API key issues
let LLMInterface;
try {
    LLMInterface = require('../modules/LLMInterface');
} catch (error) {
    console.log('LLMInterface could not be loaded (likely due to missing Gemini API key)');
    LLMInterface = null;
}

async function runTests() {
    console.log('Testing WhatsApp Quiz Bot Modules...\n');
    
    const preprocessor = new MessagePreprocessor();
    // Only initialize LLMInterface if it's available
    const llmInterface = LLMInterface ? new LLMInterface() : null;
    const formatter = new ResponseFormatter();
    
    // Test 1: Message Preprocessor
    console.log('Test 1: Message Preprocessor');
    console.log('---------------------------');
    
    const testMessages = [
        'Quelle est la capitale de la France?',
        'What is 2+2?',
        'Est-ce que la terre est ronde?',
        'Bonjour bot, quelle heure est-il?'
    ];
    
    const expectedTypes = ['general_knowledge', 'math', 'true_false', 'general_knowledge'];

    testMessages.forEach((msg, index) => {
        const detectedType = preprocessor.detectQuestionType(msg);
        console.log(`Input: "${msg}"`);
        console.log(`Is question: ${preprocessor.isQuestion(msg)}`);
        console.log(`Question type: ${detectedType}`);
        console.log(`Processed:`, preprocessor.process(msg));
        assert.strictEqual(detectedType, expectedTypes[index], `Unexpected question type for: ${msg}`);
        console.log('');
    });
    
    // Test 2: Response Formatter
    console.log('\nTest 2: Response Formatter');
    console.log('--------------------------');
    
    const testResponses = [
        'Paris is the capital of France.',
        '2+2 equals 4.',
        'Nx'
    ];
    
    const questionTypes = ['general_knowledge', 'math', 'general_knowledge'];
    
    testResponses.forEach((resp, index) => {
        console.log(`Input: "${resp}", Type: ${questionTypes[index]}`);
        console.log(`Formatted: "${formatter.format(resp, questionTypes[index])}"`);
        console.log('');
    });
    
    console.log('Module tests completed successfully!');
    console.log('\nNote: LLMInterface live API tests are skipped as they require GEMINI_API_KEY and network access.');
}

runTests().catch(console.error);