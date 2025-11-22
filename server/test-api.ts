import http from 'http';

const doctorId = "DOC001";
const url = `http://localhost:5000/api/doctors/stats?doctorId=${doctorId}`;

console.log(`Testing API: ${url}`);

http.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log('Response:', data);
    });
}).on('error', (err) => {
    console.error('Error:', err.message);
});
