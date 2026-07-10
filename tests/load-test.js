import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '30s', target: 20 }, // 1. Ramp-up
        { duration: '1m', target: 50 },  // 2. Load
        { duration: '30s', target: 0 },  // 3. Ramp-down
    ],
    thresholds: {
        http_req_failed: ['rate<0.05'],   
        http_req_duration: ['p(95)<300'], 
    },
    noConnectionReuse: true,
    discardResponseBodies: true, 
};


const BASE_URL = __ENV.MY_URL || 'http://localhost';

export default function () {
    const resMain = http.get(`${BASE_URL}`);
    
    check(resMain, {
        'status is 200': (r) => r.status === 200,
    });
    
    sleep(Math.random() * 1 + 1); 
}