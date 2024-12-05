// subscriber.js
const redis = require('redis');

// Tạo kết nối Redis
const subscriber = redis.createClient();

// Kiểm tra kết nối
subscriber.on('connect', function () {
    console.log('Connected to Redis as subscriber');
});

// Subscribe vào channel 'news'
subscriber.subscribe('news');
// subscriber.subscribe('news', 'sports', 'music'); // Nhiều channel
// subscriber.unsubscribe('news'); // xoá sub
// subscriber.psubscribe('user:*'); // pattern

// Lắng nghe thông điệp từ channel 'news'
subscriber.on('message', function (channel, message) {
    console.log(`Received message on channel ${channel}: ${message}`);
});
