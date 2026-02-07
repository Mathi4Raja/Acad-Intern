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
    alias: string;
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

class MessagingTesterExtended {
    private users: TestUser[] = [];
    private scenarios: TestScenario[] = [];

    async setup() {
        console.log('🔧 Setting up EXTENDED test environment (Clone Protocol)...');
        await connectDB();
        await this.cleanup();
        await this.createTestUsersAndData();
        this.setupScenarios();
        console.log('✅ Test environment ready');
    }

    async cleanup() {
        console.log('🧹 Cleaning up test data...');
        await User.deleteMany({ email: { $regex: /@test.com$/ } });
        // Assume cascade delete (manual cleanup for robustness)
        const users = await User.find({ email: { $regex: /@test.com$/ } });
        const userIds = users.map(u => u._id);
        await Company.deleteMany({ userId: { $in: userIds } });
        await Internship.deleteMany({ title: { $regex: /Test Internship/ } }); // Rough matcher
        await Application.deleteMany({ studentId: { $in: userIds } });
        await Message.deleteMany({ content: { $regex: /This is a test message/ } });
    }

    async createTestUsersAndData() {
        console.log('👥 Creating 3 Students and 3 Companies...');

        // 1. Create 3 Companies
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                name: `Test Company User ${i}`,
                email: `company${i}@test.com`,
                password_hash: 'hashedpassword',
                role: 'company',
                isVerified: true
            });
            const company = await Company.create({
                userId: user._id,
                companyName: `Test Company ${i}`,
                description: 'Desc'
            });
            const token = jwt.sign({ id: user._id, role: 'company', email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

            this.users.push({
                id: user._id.toString(),
                name: user.name,
                alias: `C${i}`,
                role: 'company',
                token
            });

            // Create Internship
            await Internship.create({
                title: `Test Internship ${i}`,
                description: 'Test internship for messaging',
                companyId: company._id,
                durationWeeks: 12,
                status: 'active'
            });
        }

        // 2. Create 3 Students
        for (let i = 1; i <= 3; i++) {
            const user = await User.create({
                name: `Test Student ${i}`,
                email: `student${i}@test.com`,
                password_hash: 'hashedpassword',
                role: 'student',
                isVerified: true
            });
            const token = jwt.sign({ id: user._id, role: 'student', email: user.email }, process.env.JWT_SECRET as string, { expiresIn: '1h' });

            this.users.push({
                id: user._id.toString(),
                name: user.name,
                alias: `S${i}`,
                role: 'student',
                token
            });
        }

        // 3. Create Applications (All Students apply to All Internships)
        // Need to refetch internships to get IDs? Or we can query by companyId on the fly?
        // Let's query internships.
        const companies = this.users.filter(u => u.role === 'company');
        for (const companyUser of companies) {
            const companyProfile = await Company.findOne({ userId: companyUser.id });
            const internship = await Internship.findOne({ companyId: companyProfile!._id });

            if (!internship) continue;

            const students = this.users.filter(u => u.role === 'student');
            for (const student of students) {
                await Application.create({
                    studentId: student.id,
                    internshipId: internship._id,
                    status: 'pending',
                    appliedAt: new Date()
                });
            }
        }
        console.log('✅ Created Users, Companies, Internships, Applications.');
    }

    async setupScenarios() {
        // Generate 9 flows + reverse = 18 scenarios?
        // User asked for 9 chat flows. "A sends msg to B".
        // I will do S->C and C->S for each pair.

        const students = this.users.filter(u => u.role === 'student');
        const companies = this.users.filter(u => u.role === 'company');

        this.scenarios = [];

        for (const student of students) {
            for (const company of companies) {
                // Find application
                const companyProfile = await Company.findOne({ userId: company.id });
                if (!companyProfile) continue;
                const internship = await Internship.findOne({ companyId: companyProfile._id });
                if (!internship) continue;

                const app = await Application.findOne({
                    studentId: student.id,
                    internshipId: internship._id
                });

                if (app) {
                    this.scenarios.push({
                        name: `${student.alias} -> ${company.alias}`,
                        sender: student,
                        receiver: company,
                        applicationId: app._id.toString()
                    });
                    this.scenarios.push({
                        name: `${company.alias} -> ${student.alias}`,
                        sender: company,
                        receiver: student,
                        applicationId: app._id.toString()
                    });
                }
            }
        }
        console.log(`✅ Configured ${this.scenarios.length} Scenarios.`);
    }

    async connectSocket(user: TestUser): Promise<Socket> {
        const port = process.env.PORT || 5004;
        return new Promise((resolve, reject) => {
            const socket = Client(`http://localhost:${port}`, {
                auth: { token: user.token },
                transports: ['websocket']
            });

            socket.on('connect', () => {
                console.log(`🔌 ${user.alias} connected: ${socket.id}`);
                user.socket = socket;
                resolve(socket);
            });

            socket.on('connect_error', (error) => {
                console.error(`❌ ${user.alias} connection failed:`, error.message);
                reject(error);
            });

            setTimeout(() => { if (!socket.connected) reject(new Error('Timeout')); }, 5000);
        });
    }

    async testScenario(scenario: TestScenario) {
        console.log(`\n🧪 Testing: ${scenario.name}`);

        const senderSocket = await this.connectSocket(scenario.sender);
        const receiverSocket = await this.connectSocket(scenario.receiver);

        console.log(`   🔗 Joining Room: ${scenario.applicationId}`);
        senderSocket.emit('join-application', scenario.applicationId);

        // Slight delay
        await new Promise(r => setTimeout(r, 200));

        receiverSocket.emit('join-application', scenario.applicationId);

        await new Promise(r => setTimeout(r, 1000));

        await this.testMessageFlow(scenario);
        await this.testTypingIndicators(scenario);

        senderSocket.disconnect();
        receiverSocket.disconnect();
        console.log(`✅ ${scenario.name} passed.`);
    }

    async testMessageFlow(scenario: TestScenario) {
        const sender = scenario.sender.socket!;
        const receiver = scenario.receiver.socket!;

        // Listeners logic copied from success script
        let received = false;
        let delivered = false;
        let seen = false;

        sender.on('messages-delivered', (data) => {
            if (data.applicationId === scenario.applicationId) delivered = true;
        });

        sender.on('messages-seen', (data) => {
            if (data.applicationId === scenario.applicationId) seen = true;
        });

        receiver.on('new-message', (data) => {
            if (data.message.content.includes('test message')) {
                received = true;
                receiver.emit('mark-seen', { applicationId: scenario.applicationId });
            }
        });

        const msg = `Hello ${scenario.receiver.alias} from ${scenario.sender.alias}. Is this a test message?`;
        sender.emit('send-message', { applicationId: scenario.applicationId, content: msg });

        // Wait
        await new Promise(r => setTimeout(r, 3000));

        if (!received) throw new Error('Message NOT received');
        if (!delivered) console.warn('Warning: Not marked delivered');
        if (!seen) console.warn('Warning: Not marked seen');
    }

    async testTypingIndicators(scenario: TestScenario) {
        const sender = scenario.sender.socket!;
        const receiver = scenario.receiver.socket!;

        let detected = false;
        receiver.on('user-typing', (data) => {
            if (data.isTyping) detected = true;
        });

        sender.emit('typing', { applicationId: scenario.applicationId, isTyping: true });
        await new Promise(r => setTimeout(r, 1000));

        if (!detected) console.warn('Warning: Typing not detected');
    }

    async runAllTests() {
        try {
            await this.setup();
            for (const scenario of this.scenarios) {
                await this.testScenario(scenario);
            }
            console.log('\n🎉 ALL SCENARIOS PASSED!');
        } catch (error) {
            console.error(error);
            process.exit(1);
        } finally {
            await this.cleanup();
            await mongoose.connection.close();
            process.exit(0);
        }
    }
}

if (require.main === module) {
    new MessagingTesterExtended().runAllTests();
}
