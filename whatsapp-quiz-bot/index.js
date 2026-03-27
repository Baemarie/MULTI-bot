require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');


const resolveChromiumPath = () => {
    const candidates = [
        process.env.PUPPETEER_EXECUTABLE_PATH,
        process.env.CHROME_BIN,
        process.env.CHROMIUM_PATH,
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/google-chrome-stable',
        '/nix/store/chromium/bin/chromium'
    ].filter(Boolean);

    return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const chromiumPath = resolveChromiumPath();
if (chromiumPath) {
    console.log(`🧭 Chromium detected: ${chromiumPath}`);
} else {
    console.log('⚠️ Chromium executable not found in common paths. Set PUPPETEER_EXECUTABLE_PATH (or CHROME_BIN/CHROMIUM_PATH).');
}
const MessagePreprocessor = require('./modules/MessagePreprocessor');
const ResponseFormatter = require('./modules/ResponseFormatter');
const LLMInterface = require('./modules/LLMInterface');
const LoggerDB = require('./modules/LoggerDB');

// Ensure sessions directory exists
const sessionsDir = path.join(__dirname, 'sessions');
if (!fs.existsSync(sessionsDir)) {
    fs.mkdirSync(sessionsDir, { recursive: true });
}

// Core modules
const messagePreprocessor = new MessagePreprocessor();
const responseFormatter = new ResponseFormatter();
const llmInterface = new LLMInterface();
const loggerDB = new LoggerDB();

// Initialize WhatsApp client with persistent session
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'quiz-bot-session',
        dataPath: sessionsDir
    }),
    puppeteer: {
        headless: true,
        executablePath: chromiumPath || undefined,
        pipe: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            '--no-first-run',
            '--disable-extensions'
        ],
        timeout: 60000
    }
});

let isReady = false;
let isQuizMode = false;
let isStealthMode = false;
let targetedUserId = null;

const normalizeChatId = (id) => {
    if (!id) return null;
    if (typeof id === 'string') return id;
    if (id._serialized) return id._serialized;
    if (id.user && id.server) return `${id.user}@${id.server}`;
    return String(id);
};

const resolveTargetFromCommand = async (message) => {
    // 1) Prefer replied message target
    if (message.hasQuotedMsg) {
        try {
            const quoted = await message.getQuotedMessage();
            const quotedAuthor = normalizeChatId(quoted.author);
            const quotedFrom = normalizeChatId(quoted.from);
            return quotedAuthor || quotedFrom;
        } catch (error) {
            console.error('⚠️ Impossible de lire le message cité:', error.message);
        }
    }

    // 2) Fallback to mentions in command message
    try {
        const mentions = await message.getMentions();
        if (mentions.length > 0) {
            return normalizeChatId(mentions[0].id);
        }
    } catch (error) {
        console.error('⚠️ Impossible de lire les mentions:', error.message);
    }

    if (Array.isArray(message.mentionedIds) && message.mentionedIds.length > 0) {
        return normalizeChatId(message.mentionedIds[0]);
    }

    return null;
};

const generateFallbackAnswer = (question) => {
    const lower = question.toLowerCase();

    // Existing known answers
    if (lower.includes('doru doru no mi')) return 'Mr. 3 (Galdino)';
    if (lower.includes('bismarck') && lower.includes('geass')) return 'Lelouch et C.C.';
    if (lower.includes('naomi') && lower.includes('light') && lower.includes('identité')) return 'Un faux nom et une fausse adresse';
    if (lower.includes('yami') && lower.includes('descend')) return 'De la famille royale';
    if (lower.includes('bucciarati') && lower.includes('diavolo') && lower.includes('surveiller')) return 'Narancia';
    if (lower.includes('shingen') && lower.includes('prière') && lower.includes('eizen')) return 'Il a invoqué ses ancêtres';
    if (lower.includes('momo') && lower.includes('acro-soyeuse')) return 'Par son prénom';
    if (lower.includes('sasuke') && lower.includes('suigetsu') && lower.includes('kubikiribocho')) return 'Zabuza Momochi';
    if (lower.includes('maria') && lower.includes('pouvoir')) return 'À créer des illusions';
    if (lower.includes('ken') && lower.includes('ayato') && lower.includes('paralyser')) return 'Il lui a brisé les tendons';
    if (lower.includes('thors') && lower.includes('bjorn')) return 'Son manque de technique';

    return null;
};

client.on('qr', (qr) => {
    if (!isReady) {
        console.log('\n╔════════════════════════════════════════════════╗');
        console.log('║         SCAN THIS QR CODE WITH YOUR          ║');
        console.log('║            WHATSAPP TO LOG IN                ║');
        console.log('╚════════════════════════════════════════════════╝\n');
        qrcode.generate(qr, { small: true });
        console.log('\n═══════════════════════════════════════════════════════');
    }
});

client.on('ready', () => {
    isReady = true;
    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║              ✅ WHATSAPP BOT CONNECTED!              ║');
    console.log('║                                                      ║');
    console.log('║  SEND "!quizz on" TO ACTIVATE QUIZ MODE             ║');
    console.log('║  SEND "!quizz off" TO DEACTIVATE QUIZ MODE          ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
});

// Handles owner's own messages — exclusively for commands
client.on('message_create', async (message) => {
    try {
        if (!message.fromMe || message.isStatus) return;
        const text = message.body.trim();

        if (text === '.nexton') {
            isQuizMode = true;
            const chat = await message.getChat();
            await chat.sendMessage('UwU');
            console.log('✅ Quiz mode ON (owner)');
            return;
        }

        if (text === '.nextons') {
            isQuizMode = false;
            const chat = await message.getChat();
            await chat.sendMessage('UwU');
            console.log('❌ Quiz mode OFF (owner)');
            return;
        }

        if (text === '.lesgo') {
            isStealthMode = true;
            await message.react('❤️');
            console.log('👁️ Stealth mode ON (owner)');
            return;
        }

        if (text === '.bien') {
            isStealthMode = false;
            await message.react('❤️');
            console.log('👁️ Stealth mode OFF (owner)');
            return;
        }

        if (text.toLowerCase() === 'next') {
            const resolvedTargetId = await resolveTargetFromCommand(message);
            if (!resolvedTargetId) {
                console.log('⚠️ Commande "next" ignorée: aucune cible (réponds à un message ou tag une personne)');
                return;
            }

            targetedUserId = resolvedTargetId;
            console.log(`🎯 Le mode ciblage a bien ete active (${targetedUserId})`);
            return;
        }

        if (text.toLowerCase() === 'nx') {
            targetedUserId = null;
            console.log('🎯 Le mode ciblage a bien ete desactive');
            return;
        }
    } catch (error) {
        console.error('❌ Command error:', error.message);
    }
});

// Handles received messages — questions only, no tagging in replies
client.on('message', async (message) => {
    try {
        if (message.fromMe || message.isStatus) return;

        const text = message.body.trim();
        console.log(`📥 Message from ${message.from}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);

        if (!isQuizMode && !isStealthMode) {
            console.log('📝 No active mode');
            return;
        }

        const senderId = normalizeChatId(message.author) || normalizeChatId(message.from);
        if (targetedUserId && senderId !== targetedUserId) {
            console.log(`🧲 Message ignoré (ciblage actif sur ${targetedUserId})`);
            return;
        }

        if (!messagePreprocessor.isQuestion(text)) {
            console.log('📝 Message ignoré (pas détecté comme question)');
            return;
        }

        const processed = messagePreprocessor.process(text);
        const question = processed.question;
        const questionType = messagePreprocessor.detectQuestionType(text);
        console.log(`🤔 Processing (${questionType}): ${question.substring(0, 100)}...`);

        let response = generateFallbackAnswer(question);
        if (!response) {
            response = await llmInterface.generateResponse(question, questionType);
        }

        const formatted = responseFormatter.format(response, questionType);

        if (isStealthMode) {
            // Stealth mode: print to terminal only, do not send to WhatsApp
            console.log(`\n👁️ [STEALTH] QUESTION: ${question}`);
            console.log(`👁️ [STEALTH] RÉPONSE : ${formatted}\n`);
            return;
        }

        // Quiz mode: send to WhatsApp chat
        const chat = await message.getChat();
        await chat.sendMessage(formatted);
        console.log(`📤 Réponse: ${formatted}`);

        await loggerDB.logInteraction({
            question,
            answer: response,
            questionType,
            timestamp: new Date(),
            sender: message.from
        });
    } catch (error) {
        console.error('❌ Error:', error.message);
        try {
            if (isQuizMode) {
                const chat = await message.getChat();
                await chat.sendMessage('Nx');
            }
        } catch (replyError) {
            console.error('❌ Send error:', replyError.message);
        }
    }
});

client.on('auth_failure', (msg) => {
    console.error('❌ Auth failed:', msg);
    isReady = false;
});

client.on('disconnected', (reason) => {
    console.log('⚠️ Disconnected:', reason, '— reinitialisation dans 5s...');
    isReady = false;
    isQuizMode = false;
    isStealthMode = false;
    targetedUserId = null;
    setTimeout(() => {
        console.log('🔄 Reinitialisation...');
        client.initialize().catch((err) => {
            console.error('❌ Reinit error:', err.message);
        });
    }, 5000);
});

// Catch unhandled rejections (e.g. "Execution context was destroyed" after WhatsApp page navigation)
process.on('unhandledRejection', (reason) => {
    const msg = reason?.message || String(reason);
    console.error('⚠️ Unhandled rejection:', msg);

    if (
        msg.includes('Execution context was destroyed') ||
        msg.includes('Target closed') ||
        msg.includes('Session closed')
    ) {
        console.log('🔄 Navigation crash détectée — reinitialisation dans 5s...');
        isReady = false;
        setTimeout(() => {
            client.initialize().catch((err) => {
                console.error('❌ Reinit error:', err.message);
            });
        }, 5000);
    }
});

process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down bot...');
    await loggerDB.close();
    process.exit(0);
});

(async () => {
    console.log('🚀 Starting WhatsApp Quiz Bot...');
    await loggerDB.connect();
    client.initialize().catch((err) => {
        console.error('❌ Init error:', err.message);
    });
})();
