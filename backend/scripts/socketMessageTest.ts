import 'dotenv/config';
import { io as Client, Socket } from 'socket.io-client';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

interface User {
    id: string;
    name: string;
    token: string;
    socket?: Socket;
}

async function loginUser(email: string, password: string): Promise<User> {
    const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
    });

    if (!response.data.success) {
        throw new Error(`Login failed for ${email}`);
    }

    return {
        id: response.data.data.user._id,
        name: response.data.data.user.name,
        token: response.data.data.token
    };
}

async function connectSocket(user: User): Promise<Socket> {
    return new Promise((resolve, reject) => {
        const socket = Client(SOCKET_URL, {
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

        setTimeout(() => {
            if (!socket.connected) {
                reject(new Error(`Connection timeout for ${user.name}`));
            }
        }, 5000);
    });
}

async function getApplicationId(userToken: string): Promise<string> {
    const response = await axios.get(`${API_BASE}/messages/conversations`, {
        headers: { 'Authorization': `Bearer ${userToken}` }
    });

    if (!response.data.success || response.data.data.length === 0) {
        throw new Error('No conversations found');
    }

    return response.data.data[0].application._id;
}

async function testSocketMessaging() {
    console.log('🚀 Testing Socket.io Real-time Messaging...\n');

    try {
        // Login users
        console.log('👥 Logging in users...');
        const student = await loginUser('student@test.com', 'password123');
        const company = await loginUser('company@test.com', 'password123');
        console.log(`   ✅ Student: ${student.name}`);
        console.log(`   ✅ Company: ${company.name}`);

        // Get application ID
        const applicationId = await getApplicationId(student.token);
        console.log(`   📋 Application ID: ${applicationId}`);

        // Connect sockets
        console.log('\n🔌 Connecting to Socket.io...');
        const studentSocket = await connectSocket(student);
        const companySocket = await connectSocket(company);

        // Set up message listeners
        let studentReceivedMessage = false;
        let companyReceivedMessage = false;
        let studentTypingReceived = false;
        let companyTypingReceived = false;

        studentSocket.on('new-message', (data) => {
            console.log(`   📩 Student received: "${data.message.content}"`);
            studentReceivedMessage = true;
        });

        companySocket.on('new-message', (data) => {
            console.log(`   📩 Company received: "${data.message.content}"`);
            companyReceivedMessage = true;
        });

        studentSocket.on('user-typing', (data) => {
            if (data.isTyping) {
                console.log('   ⌨️  Student sees company is typing...');
                studentTypingReceived = true;
            }
        });

        companySocket.on('user-typing', (data) => {
            if (data.isTyping) {
                console.log('   ⌨️  Company sees student is typing...');
                companyTypingReceived = true;
            }
        });

        // Add error listeners
        studentSocket.on('error', (error) => {
            console.log(`   ❌ Student socket error:`, error);
        });

        companySocket.on('error', (error) => {
            console.log(`   ❌ Company socket error:`, error);
        });

        // Set up status listeners
        let messageDelivered = false;
        let messageSeen = false;

        studentSocket.on('messages-delivered', (data) => {
            console.log('   ✅ Message marked as delivered');
            messageDelivered = true;
        });

        studentSocket.on('messages-seen', (data) => {
            console.log('   👁️  Message marked as seen');
            messageSeen = true;
        });

        // Join application rooms
        console.log('\n🏠 Joining application rooms...');
        console.log(`   📨 Student joining application ${applicationId}...`);
        studentSocket.emit('join-application', applicationId);
        
        console.log(`   📨 Company joining application ${applicationId}...`);
        companySocket.emit('join-application', applicationId);

        // Wait for room join
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Test 1: Student sends message to company
        console.log('\n📤 Test 1: Student sending message...');
        studentSocket.emit('send-message', {
            applicationId,
            content: 'Hello from student via socket!'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!companyReceivedMessage) {
            console.log('   ⚠️  Company did not receive student message');
        }

        // Test 2: Company sends message to student
        console.log('\n📤 Test 2: Company sending message...');
        companySocket.emit('send-message', {
            applicationId,
            content: 'Hello from company via socket!'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!studentReceivedMessage) {
            console.log('   ⚠️  Student did not receive company message');
        }

        // Test 3: Typing indicators
        console.log('\n⌨️  Test 3: Testing typing indicators...');
        
        // Student starts typing
        studentSocket.emit('typing', {
            applicationId,
            isTyping: true
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Company starts typing
        companySocket.emit('typing', {
            applicationId,
            isTyping: true
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Stop typing
        studentSocket.emit('typing', {
            applicationId,
            isTyping: false
        });

        companySocket.emit('typing', {
            applicationId,
            isTyping: false
        });

        await new Promise(resolve => setTimeout(resolve, 500));

        // Test 4: Mark as seen
        console.log('\n👁️  Test 4: Testing mark as seen...');
        companySocket.emit('mark-seen', { applicationId });

        await new Promise(resolve => setTimeout(resolve, 1000));

        // Disconnect
        studentSocket.disconnect();
        companySocket.disconnect();

        // Results
        console.log('\n📊 Test Results:');
        console.log(`   Student received message: ${studentReceivedMessage ? '✅' : '❌'}`);
        console.log(`   Company received message: ${companyReceivedMessage ? '✅' : '❌'}`);
        console.log(`   Student typing indicator: ${studentTypingReceived ? '✅' : '❌'}`);
        console.log(`   Company typing indicator: ${companyTypingReceived ? '✅' : '❌'}`);
        console.log(`   Message delivered status: ${messageDelivered ? '✅' : '❌'}`);
        console.log(`   Message seen status: ${messageSeen ? '✅' : '❌'}`);

        const allPassed = studentReceivedMessage && companyReceivedMessage && 
                         studentTypingReceived && companyTypingReceived;

        if (allPassed) {
            console.log('\n🎉 All socket tests passed!');
        } else {
            console.log('\n⚠️  Some socket tests failed. Check the results above.');
        }

        console.log('\n💡 Manual Testing:');
        console.log('   1. Open http://localhost:3000 in two browser windows');
        console.log('   2. Login as student@test.com in one window');
        console.log('   3. Login as company@test.com in another window');
        console.log('   4. Navigate to messages and test real-time chat');

    } catch (error: any) {
        console.error('\n❌ Socket test failed:', error.message);
        process.exit(1);
    }
}

// Run the test
testSocketMessaging();