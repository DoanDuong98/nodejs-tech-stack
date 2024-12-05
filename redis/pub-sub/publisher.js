// publisher.js
const redis = require('redis');

// Tạo kết nối Redis
const publisher = redis.createClient();

// Kiểm tra kết nối
publisher.on('connect', function () {
    console.log('Connected to Redis as publisher');
});

// Gửi thông điệp đến channel 'news'
function publishMessage() {
    const message = 'Hello, this is a message from Publisher!';
    publisher.publish('news', message, (err, reply) => {
        if (err) {
            console.log('Error publishing message:', err);
        } else {
            console.log('Message published:', message);
        }
    });
}

// Gửi thông điệp mỗi 5 giây
setInterval(publishMessage, 5000);
