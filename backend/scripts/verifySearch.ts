import mongoose from 'mongoose';
import Internship from '../models/Internship';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const verifySearch = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Perform a search text directly
        // Using a generic term 'developer' or 'intern' which likely exists
        const searchTerm = 'developer';
        console.log(`\nSearching for "${searchTerm}"...`);

        try {
            const results = await Internship.find(
                { $text: { $search: searchTerm }, status: 'active' },
                { score: { $meta: 'textScore' } }
            ).sort({ score: { $meta: 'textScore' } });

            console.log(`Found ${results.length} matches.`);
            results.forEach(r => {
                console.log(`- ${r.title}`);
            });

            if (results.length === 0) {
                console.log("No results found. This might mean no data matches the term OR the text index is missing.");

                // Check if we have any data at all
                const count = await Internship.countDocuments();
                console.log(`Total active internships in DB: ${count}`);

                if (count > 0) {
                    console.log("We have data. If the index was missing, the query above would likely throw an error. So search is likely working but returning 0 matches for this specific term.");
                }
            } else {
                console.log('✅ Search query executed successfully.');
            }

            // Compare with "All" to show difference
            console.log(`\n--- Comparison ---`);
            const allInternships = await Internship.find({ status: 'active' }).limit(5);
            console.log(`Recent Internships (No Filter):`);
            allInternships.forEach(r => {
                console.log(`- ${r.title}`);
            });

        } catch (err: any) {
            console.log("Search query failed!");
            console.error(err.message);
            if (err.message.includes("text index")) {
                console.error("❌ The text index is MISSING or invalid.");
            }
        }

    } catch (error) {
        console.error('Connection Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\nDisconnected.');
    }
};

verifySearch();
