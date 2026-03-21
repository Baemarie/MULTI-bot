const { MongoClient } = require('mongodb');

class LoggerDB {
    constructor() {
        this.client = null;
        this.db = null;
        this.uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp_quiz_bot';
        this.collectionName = 'interactions';
    }

    /**
     * Connects to the MongoDB database
     */
    async connect() {
        try {
            // Add SSL options to handle MongoDB Atlas connections
            this.client = new MongoClient(this.uri, {
                tls: true,
                tlsInsecure: false,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            await this.client.connect();
            this.db = this.client.db();
            
            console.log('✅ Connected to MongoDB successfully');
            return true;
        } catch (error) {
            console.error('❌ Error connecting to MongoDB:', error.message);
            console.log('⚠️  MongoDB logging disabled - bot will continue without database');
            this.db = null; // Set to null so other methods know DB is not available
            return false;
        }
    }

    /**
     * Logs an interaction to the database
     */
    async logInteraction(interactionData) {
        try {
            if (!this.db) {
                console.log('📝 MongoDB not available - interaction not logged');
                return;
            }

            const collection = this.db.collection(this.collectionName);
            
            // Insert the interaction data
            const result = await collection.insertOne({
                question: interactionData.question,
                answer: interactionData.answer,
                questionType: interactionData.questionType,
                timestamp: interactionData.timestamp,
                sender: interactionData.sender,
                createdAt: new Date()
            });

            console.log(`✅ Interaction logged with ID: ${result.insertedId}`);
        } catch (error) {
            console.error('❌ Error logging interaction:', error.message);
        }
    }

    /**
     * Retrieves interaction history
     */
    async getHistory(limit = 10) {
        try {
            if (!this.db) {
                console.log('📝 MongoDB not available - no history to retrieve');
                return [];
            }

            const collection = this.db.collection(this.collectionName);
            const interactions = await collection
                .find({})
                .sort({ createdAt: -1 })
                .limit(limit)
                .toArray();

            return interactions;
        } catch (error) {
            console.error('❌ Error retrieving history:', error.message);
            return [];
        }
    }

    /**
     * Closes the database connection
     */
    async close() {
        if (this.client) {
            await this.client.close();
            console.log('Database connection closed');
        }
    }
}

module.exports = LoggerDB;