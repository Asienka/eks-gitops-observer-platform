import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // 1. Ramp-up
        { duration: '1m', target: 50 },  // 2. Load
        { duration: '30s', target: 0 },  // 3. Ramp-down
    ],
    thresholds: {
        http_req_failed: ['rate<0.01'],   
        http_req_duration: ['p(95)<200'], 
    },
};


export default function () {

    const BASE_URL = 'http://localhost:8080'; 

    const resMain = http.get(`${BASE_URL}/`);
    check(resMain, {
        'status jest 200': (r) => r.status === 200,
    });
    sleep(1); 

    const resMetrics = http.get(`${BASE_URL}/metrics`);
    check(resMetrics, {
        'metrics status jest 200': (r) => r.status === 200,
    });
    sleep(2);
}