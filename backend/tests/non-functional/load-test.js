
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // Ramp to 20 users
        { duration: '1m', target: 50 },  // Stay at 50 users
        { duration: '30s', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    },
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
    // 1. Health check
    const resHealth = http.get('http://localhost:5000/health');
    check(resHealth, { 'status was 200': (r) => r.status == 200 });

    // 2. Mobile users listing internships (Public)
    const resInternships = http.get(`${BASE_URL}/internships`);
    check(resInternships, {
        'status was 200': (r) => r.status == 200,
        'duration < 500ms': (r) => r.timings.duration < 500
    });

    // 3. View a public endpoint (Admin public settings)
    const resSettings = http.get(`${BASE_URL}/settings/public`);
    check(resSettings, { 'status was 200': (r) => r.status == 200 });

    sleep(1);
}
