import 'dotenv/config';
import mongoose from 'mongoose';
import { io as Client, Socket } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import Company from '../models/Company';
import Internship from '../models/Internship';
import Application from '../models/Application';
import Message from '../models/Message';
import connectDB from '../config/db';

interface TestUser {
    id: string;
    name: string;
    role: 'student' | 'company';
    token: string;
    socket?: Socket;
}

interface TestScenario {
    name: string;
    sender: TestUser;
    receiver: TestUser;
    applicationId: string;
}

class MessagingTester {
    private users: TestUser[] = [];
    private scenarios: TestScenario[] = [];
    private applicationId: string = '';

    async setup() {
        console.log('🔧 Setting up test environment...');

        // Connect to database
        await connectDB();

        // Clean up existing test data
        await this.cleanup();

        // Create test users
        await this.createTestUsers();

        // Create test application
        await this.createTestApplication();

        // Setup test scenarios
        this.setupScenarios();

        console.log('✅ Test environment ready');
    }

    async cleanup() {
        console.log('🧹 Cleaning up test data...');

        // Remove test users and related data
        const testEmails = ['test.student@example.com', 'test.company@example.com'];
        const testUsers = await User.find({ email: { $in: testEmails } });

        for (const user of testUsers) {
            if (user.role === 'company') {
                const company = await Company.findOne({ userId: user._id });
                if (company) {
                    await Internship.deleteMany({ companyId: company._id });
                    await Company.deleteOne({ _id: company._id });
                }
            }
            if (user.role === 'student') {
                await Application.deleteMany({ studentId: user._id });
            }
        }

        await User.deleteMany({ email: { $in: testEmails } });
        await Message.deleteMany({});
    }

    async createTestUsers() {
        console.log('👥 Creating test users...');

        // Create student user
        const studentUser = await User.create({
            name: 'Test Student',
            email: 'test.student@example.com',
            password_hash: 'hashedpassword',
            role: 'student',
            isVerified: true
        });

        // Create company user
        const companyUser = await User.create({
            name: 'Test Company User',
            email: 'test.company@example.com',
            password_hash: 'hashedpassword',
            role: 'company',
            isVerified: true
        });

        // Create company profile
        const company = await Company.create({
            userId: companyUser._id,
            companyName: 'Test Company',
            industry: 'Technology',
            description: 'Test company for messaging',
            website: 'https://testcompany.com',
            location: 'Test City',
            size: '50-100'
        });

        // Generate JWT tokens
        const studentToken = jwt.sign(
            { id: studentUser._id, role: 'student', email: studentUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        const companyToken = jwt.sign(
            { id: companyUser._id, role: 'company', email: companyUser.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '1h' }
        );

        this.users = [
            {
                id: studentUser._id.toString(),
                name: 'Test Student',
                role: 'student',
                token: studentToken
            },
            {
                id: companyUser._id.toString(),
                name: 'Test Company User',
                role: 'company',
                token: companyToken
            }
        ];

        console.log(`✅ Created student: ${studentUser._id}`);
        console.log(`✅ Created company: ${companyUser._id} (Company ID: ${company._id})`);
    }

    async createTestApplication() {
        console.log('📝 Creating test application...');

        const companyUser = this.users.find(u => u.role === 'company')!;
        const studentUser = this.users.find(u => u.role === 'student')!;

        // Get company profile
        const company = await Company.findOne({ userId: companyUser.id });

        // Create internship
        const internship = await Internship.create({
            title: 'Test Internship',
            description: 'Test internship for messaging',
            companyId: company!._id,
            skillsRequired: ['JavaScript'],
            durationWeeks: 12,
            stipend: 10000,
            location: 'Remote',
            mode: 'remote',
            deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            isActive: true
        });

        // Create application
        const application = await Application.create({
            studentId: studentUser.id,
            internshipId: internship._id,
            status: 'pending',
            appliedAt: new Date()
        });

        this.applicationId = application._id.toString();
        console.log(`✅ Created application: ${this.applicationId}`);
    }

    setupScenarios() {
        const student = this.users.find(u => u.role === 'student')!;
        const company = this.users.find(u => u.role === 'company')!;

        this.scenarios = [
            {
                name: 'Student to Company',
                sender: student,
                receiver: company,
                applicationId: this.applicationId
            },
            {
                name: 'Company to Student',
                sender: company,
                receiver: student,
                applicationId: this.applicationId
            }
        ];
    }

    async connectSocket(user: TestUser): Promise<Socket> {
        const port = process.env.PORT || 5001;
        return new Promise((resolve, reject) => {
            const socket = Client(`http://localhost:${port}`, {
                auth: { token: user.token },
                transports: ['websocket']
            });

            socket.on('connect', () => {
                console.log(`🔌 ${user.name} connected: ${socket.id}`);
                user.socket = socket;
                resolve(socket);
            });

            socket.on('connect_error', (error) => {
                console.error(`❌ ${user.name} connection failed:`, error.message);
                reject(error);
            });

            // Set timeout for connection
            setTimeout(() => {
                if (!socket.connected) {
                    reject(new Error(`Connection timeout for ${user.name}`));
                }
            }, 5000);
        });
    }

    async testScenario(scenario: TestScenario) {
        console.log(`\n🧪 Testing: ${scenario.name}`);
        console.log(`   Sender: ${scenario.sender.name} (${scenario.sender.role})`);
        console.log(`   Receiver: ${scenario.receiver.name} (${scenario.receiver.role})`);

        // Connect both users
        const senderSocket = await this.connectSocket(scenario.sender);
        const receiverSocket = await this.connectSocket(scenario.receiver);

        // Join application room
        console.log(`   🔗 ${scenario.sender.name} joining room... (Connected: ${senderSocket.connected})`);
        senderSocket.emit('join-application', scenario.applicationId);

        await new Promise(resolve => setTimeout(resolve, 500));

        console.log(`   🔗 ${scenario.receiver.name} joining room... (Connected: ${receiverSocket.connected})`);
        if (!receiverSocket.connected) {
            console.error('   ❌ Receiver socket disconnected before join!');
        }
        receiverSocket.emit('join-application', scenario.applicationId);

        // Wait for room join and setup listeners
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Test message sending and status tracking
        await this.testMessageFlow(scenario);

        // Test typing indicators
        await this.testTypingIndicators(scenario);

        // Disconnect sockets
        senderSocket.disconnect();
        receiverSocket.disconnect();

        console.log(`✅ ${scenario.name} test completed`);
    }

    async testMessageFlow(scenario: TestScenario) {
        console.log('   📨 Testing message flow...');

        const senderSocket = scenario.sender.socket!;
        const receiverSocket = scenario.receiver.socket!;

        // Track message status changes
        const statusUpdates: string[] = [];

        senderSocket.on('messages-delivered', (data) => {
            if (data.applicationId === scenario.applicationId) {
                statusUpdates.push('delivered');
                console.log('   ✅ Message marked as delivered');
            }
        });

        senderSocket.on('messages-seen', (data) => {
            if (data.applicationId === scenario.applicationId) {
                statusUpdates.push('seen');
                console.log('   👁️  Message marked as seen');
            }
        });

        // Receiver listens for new messages
        let receivedMessage = false;
        receiverSocket.on('new-message', (data) => {
            console.log(`   📩 Received message data:`, data);
            if (data.message.applicationId === scenario.applicationId) {
                receivedMessage = true;
                console.log(`   📩 ${scenario.receiver.name} received message: "${data.message.content}"`);
            }
        });

        // Add error listeners
        senderSocket.on('error', (error) => {
            console.log(`   ❌ Sender error:`, error);
        });

        receiverSocket.on('error', (error) => {
            console.log(`   ❌ Receiver error:`, error);
        });

        // Send message
        const testMessage = `Hello from ${scenario.sender.name}! This is a test message.`;
        console.log(`   📤 ${scenario.sender.name} sending: "${testMessage}"`);

        senderSocket.emit('send-message', {
            applicationId: scenario.applicationId,
            content: testMessage
        });

        // Wait for message delivery
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Verify message was received
        if (!receivedMessage) {
            throw new Error('Message was not received by receiver');
        }

        // Mark as seen
        console.log(`   👁️  ${scenario.receiver.name} marking message as seen...`);
        receiverSocket.emit('mark-seen', { applicationId: scenario.applicationId });

        // Wait for seen status
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Verify status progression
        if (!statusUpdates.includes('delivered')) {
            console.warn('   ⚠️  Message was not marked as delivered');
        }
        if (!statusUpdates.includes('seen')) {
            console.warn('   ⚠️  Message was not marked as seen');
        }

        // Check database for message status
        const dbMessage = await Message.findOne({
            applicationId: scenario.applicationId,
            content: testMessage
        });

        if (dbMessage) {
            console.log(`   💾 Database status: ${dbMessage.status}`);
            if (dbMessage.status !== 'seen') {
                console.warn(`   ⚠️  Expected 'seen' but got '${dbMessage.status}'`);
            }
        } else {
            throw new Error('Message not found in database');
        }
    }

    async testTypingIndicators(scenario: TestScenario) {
        console.log('   ⌨️  Testing typing indicators...');

        const senderSocket = scenario.sender.socket!;
        const receiverSocket = scenario.receiver.socket!;

        // Track typing events
        let typingReceived = false;
        let typingStoppedReceived = false;

        receiverSocket.on('user-typing', (data) => {
            if (data.isTyping) {
                typingReceived = true;
                console.log(`   ⌨️  ${scenario.receiver.name} sees ${scenario.sender.name} is typing`);
            } else {
                typingStoppedReceived = true;
                console.log(`   ⏹️  ${scenario.receiver.name} sees ${scenario.sender.name} stopped typing`);
            }
        });

        // Start typing
        senderSocket.emit('typing', {
            applicationId: scenario.applicationId,
            isTyping: true
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Stop typing
        senderSocket.emit('typing', {
            applicationId: scenario.applicationId,
            isTyping: false
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        if (!typingReceived) {
            console.warn('   ⚠️  Typing indicator was not received');
        }
        if (!typingStoppedReceived) {
            console.warn('   ⚠️  Typing stopped indicator was not received');
        }
    }

    async runAllTests() {
        console.log('🚀 Starting comprehensive messaging tests...\n');

        try {
            await this.setup();

            for (const scenario of this.scenarios) {
                await this.testScenario(scenario);
            }

            console.log('\n🎉 All tests completed successfully!');

        } catch (error) {
            console.error('\n❌ Test failed:', error);
            throw error;
        } finally {
            await this.cleanup();
            await mongoose.connection.close();
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const tester = new MessagingTester();
    tester.runAllTests().catch(console.error);
}

export default MessagingTester;