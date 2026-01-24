import 'dotenv/config';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

interface LoginResponse {
    success: boolean;
    data: {
        user: {
            _id: string;
            name: string;
            email: string;
            role: string;
        };
        token: string;
    };
}

interface ConversationsResponse {
    success: boolean;
    data: Array<{
        application: {
            _id: string;
            internshipId: {
                title: string;
            };
        };
        unreadCount: number;
    }>;
}

interface MessageResponse {
    success: boolean;
    data: {
        _id: string;
        content: string;
        status: string;
        senderId: {
            name: string;
        };
    };
}

async function testMessaging() {
    console.log('🚀 Testing AcadIntern Messaging (REST API)...\n');

    try {
        // Step 1: Login as Student
        console.log('📝 Step 1: Logging in as Student...');
        const studentLogin = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
            email: 'student@test.com',
            password: 'password123'
        });

        if (!studentLogin.data.success) {
            throw new Error('Student login failed');
        }

        const studentToken = studentLogin.data.data.token;
        const studentHeaders = { 
            'Authorization': `Bearer ${studentToken}`,
            'Content-Type': 'application/json'
        };

        console.log(`   ✅ Student logged in: ${studentLogin.data.data.user.name}`);

        // Step 2: Login as Company
        console.log('\n📝 Step 2: Logging in as Company...');
        const companyLogin = await axios.post<LoginResponse>(`${API_BASE}/auth/login`, {
            email: 'company@test.com',
            password: 'password123'
        });

        if (!companyLogin.data.success) {
            throw new Error('Company login failed');
        }

        const companyToken = companyLogin.data.data.token;
        const companyHeaders = { 
            'Authorization': `Bearer ${companyToken}`,
            'Content-Type': 'application/json'
        };

        console.log(`   ✅ Company logged in: ${companyLogin.data.data.user.name}`);

        // Step 3: Get Student's Conversations
        console.log('\n📝 Step 3: Getting student\'s conversations...');
        const conversations = await axios.get<ConversationsResponse>(`${API_BASE}/messages/conversations`, {
            headers: studentHeaders
        });

        if (!conversations.data.success || conversations.data.data.length === 0) {
            console.log('   ⚠️  No conversations found. Please run the populate script first.');
            return;
        }

        const applicationId = conversations.data.data[0].application._id;
        const internshipTitle = conversations.data.data[0].application.internshipId.title;
        
        console.log(`   ✅ Found ${conversations.data.data.length} conversation(s)`);
        console.log(`   📋 Testing with: ${internshipTitle}`);
        console.log(`   📋 Application ID: ${applicationId}`);

        // Step 4: Student sends a message
        console.log('\n📝 Step 4: Student sending message...');
        const message1 = await axios.post<MessageResponse>(`${API_BASE}/messages/application/${applicationId}`, {
            content: 'Hi! I have a question about the internship position.'
        }, { headers: studentHeaders });

        if (!message1.data.success) {
            throw new Error('Failed to send student message');
        }

        console.log(`   ✅ Message sent: "${message1.data.data.content}"`);
        console.log(`   📊 Status: ${message1.data.data.status}`);

        // Step 5: Company replies
        console.log('\n📝 Step 5: Company sending reply...');
        const message2 = await axios.post<MessageResponse>(`${API_BASE}/messages/application/${applicationId}`, {
            content: 'Hello! Sure, feel free to ask any questions.'
        }, { headers: companyHeaders });

        if (!message2.data.success) {
            throw new Error('Failed to send company message');
        }

        console.log(`   ✅ Message sent: "${message2.data.data.content}"`);
        console.log(`   📊 Status: ${message2.data.data.status}`);

        // Step 6: Get all messages
        console.log('\n📝 Step 6: Fetching all messages...');
        const messages = await axios.get(`${API_BASE}/messages/application/${applicationId}`, {
            headers: studentHeaders
        });

        if (!messages.data.success) {
            throw new Error('Failed to fetch messages');
        }

        console.log(`   ✅ Found ${messages.data.data.length} message(s):`);
        messages.data.data.forEach((msg: any, index: number) => {
            const time = new Date(msg.createdAt).toLocaleTimeString();
            console.log(`   ${index + 1}. [${time}] ${msg.senderId.name}: "${msg.content}" [${msg.status}]`);
        });

        // Step 7: Mark messages as seen
        console.log('\n📝 Step 7: Student marking messages as seen...');
        await axios.patch(`${API_BASE}/messages/application/${applicationId}/seen`, {}, {
            headers: studentHeaders
        });

        console.log('   ✅ Messages marked as seen');

        // Step 8: Check unread counts
        console.log('\n📝 Step 8: Checking unread message counts...');
        const studentUnread = await axios.get(`${API_BASE}/messages/unread-count`, {
            headers: studentHeaders
        });
        const companyUnread = await axios.get(`${API_BASE}/messages/unread-count`, {
            headers: companyHeaders
        });

        console.log(`   📊 Student unread: ${studentUnread.data.data.unreadCount}`);
        console.log(`   📊 Company unread: ${companyUnread.data.data.unreadCount}`);

        console.log('\n✅ REST API messaging test completed successfully!');
        console.log('\n💡 Next steps:');
        console.log('   - Test real-time messaging by opening two browser windows');
        console.log('   - Login as student@test.com and company@test.com');
        console.log('   - Navigate to the messages section and test live chat');

    } catch (error: any) {
        console.error('\n❌ Test failed:', error.response?.data?.message || error.message);
        if (error.response?.status === 401) {
            console.log('💡 Hint: Make sure you have valid test users. Run the seed script first.');
        }
        process.exit(1);
    }
}

// Run the test
testMessaging();