const axios = require('axios');

class SecurityTester {
    constructor(baseURL = 'http://localhost:3001') {
        this.baseURL = baseURL;
        this.results = [];
    }

    async testXSS() {
        console.log('Testing XSS Vulnerabilities...');

        const xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            'javascript:alert("XSS")',
            '"><script>alert("XSS")</script>',
            '"><img src=x onerror=alert("XSS")>'
        ];

        for (const payload of xssPayloads) {
            try {
                const response = await axios.post(`${this.baseURL}/api/auth/register`, {
                    email: `${payload}@test.com`,
                    password: 'Test123!@#',
                    full_name: payload
                });

                this.results.push({
                    test: 'XSS',
                    payload,
                    status: response.status,
                    vulnerable: response.data.includes(payload),
                    message: response.data.includes(payload) ? 'VULNERABLE' : 'SAFE'
                });
            } catch (error) {
                this.results.push({
                    test: 'XSS',
                    payload,
                    status: error.response?.status || 'ERROR',
                    vulnerable: false,
                    message: 'BLOCKED'
                });
            }
        }
    }

    async testSQLInjection() {
        console.log('Testing SQL Injection...');

        const sqlPayloads = [
            "' OR 1=1--",
            "' UNION SELECT * FROM users--",
            "'; DROP TABLE users;--",
            "' OR '1'='1",
            "admin'--"
        ];

        for (const payload of sqlPayloads) {
            try {
                const response = await axios.post(`${this.baseURL}/api/auth/login`, {
                    email: payload,
                    password: payload
                });

                this.results.push({
                    test: 'SQL Injection',
                    payload,
                    status: response.status,
                    vulnerable: response.status === 200 && response.data.token,
                    message: response.status === 200 && response.data.token ? 'VULNERABLE' : 'SAFE'
                });
            } catch (error) {
                this.results.push({
                    test: 'SQL Injection',
                    payload,
                    status: error.response?.status || 'ERROR',
                    vulnerable: false,
                    message: 'BLOCKED'
                });
            }
        }
    }

    async testAuthentication() {
        console.log('Testing Authentication...');

        // Test invalid JWT
        try {
            const response = await axios.get(`${this.baseURL}/api/user/profile`, {
                headers: { Authorization: 'Bearer invalid.token.here' }
            });

            this.results.push({
                test: 'Authentication',
                payload: 'Invalid JWT',
                status: response.status,
                vulnerable: response.status === 200,
                message: response.status === 200 ? 'VULNERABLE' : 'SAFE'
            });
        } catch (error) {
            this.results.push({
                test: 'Authentication',
                payload: 'Invalid JWT',
                status: error.response?.status || 'ERROR',
                vulnerable: false,
                message: 'BLOCKED'
            });
        }

        // Test no authorization header
        try {
            const response = await axios.get(`${this.baseURL}/api/user/profile`);

            this.results.push({
                test: 'Authentication',
                payload: 'No Authorization Header',
                status: response.status,
                vulnerable: response.status === 200,
                message: response.status === 200 ? 'VULNERABLE' : 'SAFE'
            });
        } catch (error) {
            this.results.push({
                test: 'Authentication',
                payload: 'No Authorization Header',
                status: error.response?.status || 'ERROR',
                vulnerable: false,
                message: 'BLOCKED'
            });
        }
    }

    async testRateLimiting() {
        console.log('Testing Rate Limiting...');

        const requests = [];
        for (let i = 0; i < 10; i++) {
            requests.push(
                axios.post(`${this.baseURL}/api/auth/login`, {
                    email: 'test@test.com',
                    password: 'wrongpassword'
                }).catch(error => error.response)
            );
        }

        const responses = await Promise.all(requests);
        const blockedRequests = responses.filter(r => r?.status === 429).length;

        this.results.push({
            test: 'Rate Limiting',
            payload: '10 rapid requests',
            status: `${blockedRequests}/${responses.length} blocked`,
            vulnerable: blockedRequests === 0,
            message: blockedRequests === 0 ? 'VULNERABLE' : 'SAFE'
        });
    }

    async testInputValidation() {
        console.log('Testing Input Validation...');

        const invalidInputs = [
            { email: 'invalid-email', password: '123', full_name: 'A' },
            { email: 'test@test.com', password: 'weak', full_name: '<script>alert("XSS")</script>' },
            { email: '', password: '', full_name: '' },
            { email: 'a'.repeat(300), password: 'a'.repeat(200), full_name: 'a'.repeat(150) }
        ];

        for (const input of invalidInputs) {
            try {
                const response = await axios.post(`${this.baseURL}/api/auth/register`, input);

                this.results.push({
                    test: 'Input Validation',
                    payload: JSON.stringify(input),
                    status: response.status,
                    vulnerable: response.status === 201,
                    message: response.status === 201 ? 'VULNERABLE' : 'SAFE'
                });
            } catch (error) {
                this.results.push({
                    test: 'Input Validation',
                    payload: JSON.stringify(input),
                    status: error.response?.status || 'ERROR',
                    vulnerable: false,
                    message: 'BLOCKED'
                });
            }
        }
    }

    async runAllTests() {
        console.log('Starting Security Testing...');

        await this.testXSS();
        await this.testSQLInjection();
        await this.testAuthentication();
        await this.testRateLimiting();
        await this.testInputValidation();

        this.printResults();
    }

    printResults() {
        console.log('SECURITY TEST RESULTS');
        console.log('='.repeat(50));

        const vulnerable = this.results.filter(r => r.vulnerable);
        const safe = this.results.filter(r => !r.vulnerable);

        this.results.forEach(result => {
            const status = result.vulnerable ? 'VULNERABLE' : 'SAFE';
            console.log(`${status} | ${result.test} | ${result.payload.substring(0, 30)}...`);
        });

        console.log('SUMMARY:');
        console.log(`Total Tests: ${this.results.length}`);
        console.log(`Vulnerable: ${vulnerable.length}`);
        console.log(`Safe: ${safe.length}`);

        if (vulnerable.length > 0) {
            console.log('VULNERABILITIES FOUND!');
            vulnerable.forEach(v => {
                console.log(`- ${v.test}: ${v.payload}`);
            });
        } else {
            console.log('All security tests passed!');
        }
    }
}

// Run tests
if (require.main === module) {
    const tester = new SecurityTester();
    tester.runAllTests();
}

module.exports = SecurityTester;