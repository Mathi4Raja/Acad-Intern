/**
 * Test Script for Password Reset Functionality
 * 
 * This script tests the complete password reset flow:
 * 1. Request password reset
 * 2. Extract token from console
 * 3. Verify token
 * 4. Reset password
 * 
 * Usage:
 *   ts-node scripts/testPasswordReset.ts <email>
 */

import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:5000';
const email = process.argv[2];

if (!email) {
    console.error('Usage: ts-node scripts/testPasswordReset.ts <email>');
    process.exit(1);
}

async function testPasswordReset() {
    console.log('\n🧪 Testing Password Reset Functionality\n');
    console.log('='.repeat(50));

    try {
        // Step 1: Request password reset
        console.log('\n📧 Step 1: Requesting password reset...');
        const resetResponse = await axios.post(`${API_URL}/api/auth/forgot-password`, {
            email: email
        });

        console.log('✅ Response:', resetResponse.data);

        console.log('\n⚠️  MANUAL STEP REQUIRED:');
        console.log('1. Check the backend console for the email simulation');
        console.log('2. Copy the token from the reset URL');
        console.log('3. Example URL: http://localhost:3000/reset-password?token=TOKEN_HERE');
        console.log('4. Run this command to test token verification:');
        console.log(`   curl ${API_URL}/api/auth/reset-password/YOUR_TOKEN_HERE`);
        console.log('5. Run this command to reset password:');
        console.log(`   curl -X POST ${API_URL}/api/auth/reset-password/YOUR_TOKEN_HERE \\`);
        console.log(`        -H "Content-Type: application/json" \\`);
        console.log(`        -d '{"password":"newPassword123"}'`);

        console.log('\n✨ Or test with a sample token (if you have one):');
        console.log('   ts-node scripts/testPasswordReset.ts <email> <token>');

        // If token provided as third argument
        const token = process.argv[3];

        if (token) {
            console.log('\n='.repeat(50));
            console.log('\n🔍 Step 2: Verifying token...');

            try {
                const verifyResponse = await axios.get(`${API_URL}/api/auth/reset-password/${token}`);
                console.log('✅ Token is valid:', verifyResponse.data);

                // Step 3: Reset password
                console.log('\n🔑 Step 3: Resetting password...');
                const newPassword = 'TestPassword123!';

                const resetPasswordResponse = await axios.post(
                    `${API_URL}/api/auth/reset-password/${token}`,
                    { password: newPassword }
                );

                console.log('✅ Password reset successful:', resetPasswordResponse.data);
                console.log('\n✨ Test completed successfully!');
                console.log(`New password: ${newPassword}`);
                console.log('Try logging in with the new password.');
            } catch (error: any) {
                if (error.response) {
                    console.error('❌ Error:', error.response.data);
                } else {
                    console.error('❌ Error:', error.message);
                }
            }
        }

        console.log('\n' + '='.repeat(50));

    } catch (error: any) {
        if (error.response) {
            console.error('❌ Error:', error.response.data);
        } else {
            console.error('❌ Error:', error.message);
        }
        process.exit(1);
    }
}

testPasswordReset();
