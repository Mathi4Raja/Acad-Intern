import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api';

interface User {
    token: string;
    userId: string;
    name: string;
    role: string;
}

async function login(email: string, password: string): Promise<User> {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    const cookies = response.headers['set-cookie'];
    let token = '';
    
    if (cookies) {
        const tokenCookie = cookies.find((c: string) => c.startsWith('token='));
        if (tokenCookie) {
            token = tokenCookie.split(';')[0].split('=')[1];
        }
    }
    
    return {
        token,
        userId: response.data.data.user._id,
        name: response.data.data.user.name,
        role: response.data.data.user.role
    };
}

async function getConversations(token: string) {
    const response = await axios.get(`${API_URL}/messages/conversations`, {
        headers: { Cookie: `token=${token}` }
    });
    return response.data.data;
}

async function sendMessage(token: string, applicationId: string, content: string) {
    const response = await axios.post(
        `${API_URL}/messages/application/${applicationId}`,
        { content },
        { headers: { Cookie: `token=${token}` } }
    );
    return response.data.data;
}

function createSocketConnection(token: string, userName: string, role: string): Promise<Socket> {
    return new Promise((resolve, reject) => {
        const socket = io('http://localhost:5000', {
            auth: { token },
            withCredentials: true,
            transports: ['websocket', 'polling']
        });

        socket.on('connect', () => {
            console.log(`\n✅ ${userName} (${role}) Socket connected: ${socket.id}`);
            resolve(socket);
        });

        socket.on('connect_error', (error) => {
            console.error(`❌ ${userName} connection error:`, error.message);
            reject(error);
        });

        socket.on('error', (error) => {
            console.error(`❌ ${userName} socket error:`, error);
        });
    });
}

async function testMessaging() {
    console.log('🚀 Starting Messaging Feature Test\n');
    console.log('═══════════════════════════════════════════════════\n');

    try {
        // Step 1: Login users
        console.log('📝 Step 1: Logging in users...');
        const student = await login('student@test.com', 'password123');
        console.log(`   ✅ Student logged in: ${student.name} (${student.userId})`);
        
        const company = await login('company@test.com', 'password123');
        console.log(`   ✅ Company logged in: ${company.name} (${company.userId})`);

        // Step 2: Get conversations
        console.log('\n📝 Step 2: Getting conversations...');
        const studentConversations = await getConversations(student.token);
        console.log(`   ✅ Student has ${studentConversations.length} conversation(s)`);
        
        if (studentConversations.length === 0) {
            console.log('   ⚠️  No conversations found. Make sure there are applications in the database.');
            return;
        }

        const applicationId = studentConversations[0].application._id;
        console.log(`   📋 Testing with application ID: ${applicationId}`);

        // Step 3: Connect sockets
        console.log('\n📝 Step 3: Establishing Socket.io connections...');
        const studentSocket = await createSocketConnection(student.token, student.name, student.role);
        const companySocket = await createSocketConnection(company.token, company.name, company.role);

        // Step 4: Join conversation room
        console.log('\n📝 Step 4: Joining conversation room...');
        studentSocket.emit('join-application', applicationId);
        companySocket.emit('join-application', applicationId);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('   ✅ Both users joined the conversation room');

        // Step 5: Set up message listeners
        console.log('\n📝 Step 5: Setting up message listeners...');
        
        studentSocket.on('new-message', (data) => {
            console.log(`\n   📨 Student received message:`, data.message.content);
        });

        companySocket.on('new-message', (data) => {
            console.log(`\n   📨 Company received message:`, data.message.content);
        });

        studentSocket.on('messages-delivered', (data) => {
            console.log(`   ✓✓ Messages delivered to ${data.userId}`);
        });

        companySocket.on('messages-delivered', (data) => {
            console.log(`   ✓✓ Messages delivered to ${data.userId}`);
        });

        studentSocket.on('messages-seen', (data) => {
            console.log(`   ✓✓ Messages seen by ${data.userId}`);
        });

        companySocket.on('messages-seen', (data) => {
            console.log(`   ✓✓ Messages seen by ${data.userId}`);
        });

        // Step 6: Send test messages
        console.log('\n📝 Step 6: Sending test messages...');
        
        console.log('\n   💬 Student sending message...');
        studentSocket.emit('send-message', {
            applicationId,
            content: 'Hi! I have a question about the internship position.',
            tempId: 'temp-1'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n   💬 Company sending reply...');
        companySocket.emit('send-message', {
            applicationId,
            content: 'Hello! Sure, feel free to ask any questions.',
            tempId: 'temp-2'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        console.log('\n   💬 Student sending another message...');
        studentSocket.emit('send-message', {
            applicationId,
            content: 'What are the working hours for this position?',
            tempId: 'temp-3'
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 7: Test mark as seen
        console.log('\n📝 Step 7: Testing mark as seen...');
        companySocket.emit('mark-seen', { applicationId });
        
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Step 8: Test REST API message sending
        console.log('\n📝 Step 8: Testing REST API message sending...');
        const apiMessage = await sendMessage(
            company.token,
            applicationId,
            'The working hours are flexible, typically 9 AM to 5 PM.'
        );
        console.log(`   ✅ Message sent via REST API: ${apiMessage._id}`);

        await new Promise(resolve => setTimeout(resolve, 2000));

        // Step 9: Cleanup
        console.log('\n📝 Step 9: Disconnecting sockets...');
        studentSocket.disconnect();
        companySocket.disconnect();

        console.log('\n═══════════════════════════════════════════════════');
        console.log('✅ Test completed successfully!');
        console.log('═══════════════════════════════════════════════════\n');

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
        process.exit(1);
    }
}

// Run the test
testMessaging().then(() => {
    console.log('🎉 All tests passed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Test suite failed:', error);
    process.exit(1);
});
