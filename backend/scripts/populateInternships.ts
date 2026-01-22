const API_URL = 'http://localhost:5000/api';

interface AuthResponse {
    success: boolean;
    message?: string;
    data?: {
        token: string;
    };
}

interface InternshipResponse {
    success: boolean;
    data?: {
        _id: string;
        title: string;
    };
}

interface ApplicationResponse {
    success: boolean;
}

const login = async (email: string, password: string): Promise<string> => {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    const data = await res.json() as AuthResponse;
    if (!data.success || !data.data) throw new Error(data.message || 'Login failed');
    return data.data.token;
};

const createInternship = async (token: string, internship: {
    title: string;
    description: string;
    skillsRequired: string[];
    durationWeeks: number;
    stipend: number;
    mode: string;
    openings: number;
}): Promise<InternshipResponse> => {
    const res = await fetch(`${API_URL}/internships`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(internship)
    });
    return await res.json() as InternshipResponse;
};

const applyForInternship = async (token: string, internshipId: string): Promise<ApplicationResponse> => {
    const res = await fetch(`${API_URL}/applications/internships/${internshipId}/apply`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ notes: 'I am highly interested!' })
    });
    return await res.json() as ApplicationResponse;
};

const main = async (): Promise<void> => {
    try {
        console.log('Logging in as Company...');
        const companyToken = await login('company@test.com', 'password123');
        console.log('Company Logged In.');

        console.log('Creating Internships...');
        const internship1 = await createInternship(companyToken, {
            title: 'Full Stack Developer Intern',
            description: 'Join our team to build scalable web apps.',
            skillsRequired: ['React', 'Node.js', 'MongoDB'],
            durationWeeks: 12,
            stipend: 15000,
            mode: 'remote',
            openings: 3
        });
        console.log('Created:', internship1.data?.title);

        const internship2 = await createInternship(companyToken, {
            title: 'Frontend Developer Intern',
            description: 'Focus on UI/UX and React.',
            skillsRequired: ['React', 'CSS', 'Figma'],
            durationWeeks: 8,
            stipend: 12000,
            mode: 'hybrid',
            openings: 2
        });
        console.log('Created:', internship2.data?.title);

        const internship3 = await createInternship(companyToken, {
            title: 'Backend Engineer Intern',
            description: 'API development and optimization.',
            skillsRequired: ['Node.js', 'PostgreSQL'],
            durationWeeks: 10,
            stipend: 18000,
            mode: 'onsite',
            openings: 2
        });
        console.log('Created:', internship3.data?.title);

        console.log('Logging in as Student...');
        const studentToken = await login('student@test.com', 'password123');
        console.log('Student Logged In.');

        console.log('Applying to Internship 1...');
        if (internship1.data?._id) {
            const app = await applyForInternship(studentToken, internship1.data._id);
            console.log('Applied status:', app.success);
        }

    } catch (err) {
        console.error('Error:', err);
    }
};

main();
