
const axios = require('axios');
const fs = require('fs');

const BASE_URL = 'http://localhost:5000/api';
const ITERATIONS = 100;

const endpoints = [
    { name: 'Health', url: 'http://localhost:5000/health', method: 'GET' },
    { name: 'Internships List', url: `${BASE_URL}/internships`, method: 'GET' },
    { name: 'Public Settings', url: `${BASE_URL}/settings/public`, method: 'GET' }
];

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runBenchmark() {
    console.log(`🚀 Starting Benchmark (${ITERATIONS} iterations per endpoint)...\n`);

    const results = {};

    for (const endpoint of endpoints) {
        console.log(`Running ${endpoint.name}...`);
        const latencies = [];
        let errors = 0;

        for (let i = 0; i < ITERATIONS; i++) {
            const start = performance.now();
            try {
                await axios({
                    method: endpoint.method,
                    url: endpoint.url
                });
                const duration = performance.now() - start;
                latencies.push(duration);
            } catch (error) {
                errors++;
                console.error(`Error on ${endpoint.name}:`, error.message);
            }
            // Small Sleep to prevent rate limits from skewing results too much
            await sleep(50);
        }

        latencies.sort((a, b) => a - b);
        const sum = latencies.reduce((a, b) => a + b, 0);
        const avg = sum / latencies.length;
        const p95 = latencies[Math.floor(latencies.length * 0.95)];
        const p99 = latencies[Math.floor(latencies.length * 0.99)];
        const min = latencies[0];
        const max = latencies[latencies.length - 1];

        results[endpoint.name] = {
            Requests: ITERATIONS,
            Errors: errors,
            'Avg (ms)': avg.toFixed(2),
            'P95 (ms)': p95.toFixed(2),
            'Min (ms)': min.toFixed(2),
            'Max (ms)': max.toFixed(2)
        };
    }

    console.table(results);

    // Write report
    fs.writeFileSync('benchmark_report.json', JSON.stringify(results, null, 2));
    console.log('\n✅ Benchmark complete. Report saved to benchmark_report.json');
}

runBenchmark().catch(console.error);
