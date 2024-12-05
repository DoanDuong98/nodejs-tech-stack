'use strict'

const { getRedis } = require("../express-base/src/dbs/init.redis");

const { instance: client } = getRedis();

/*
* PRACTICE
* */
const Redis = require('ioredis');

// Khởi tạo kết nối đến Redis
const redis = new Redis();

// Lấy thông tin sản phẩm
async function getProduct(productId) {
    return await redis.hgetall(`product:${productId}`);
}

// Thêm sản phẩm vào giỏ hàng
async function addToCart(userId, productId) {
    await redis.sadd(`cart:${userId}`, productId);
    await redis.hincrby(`user:${userId}`, 'cart_total', 1);
}

// Lấy giỏ hàng của người dùng
async function getCart(userId) {
    return await redis.smembers(`cart:${userId}`);
}

// lưu session của người dùng
async function saveSessionData(user, sessionId) {
    const sessionKey = `session:${sessionId}`;
    const sessionData = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isLoggedIn: true,
    };
    await redis.set(sessionKey, JSON.stringify(sessionData), 'EX', 3600); // Hết hạn sau 1 giờ
}

// rate limit
async function rateLimit(userId) {
    const rateLimitKey = `rate_limit:${userId}:booking`;

    // Đếm số lần đặt vé trong vòng 1 phút
    const attempts = await redis.get(rateLimitKey);
    if (attempts >= 5) {
        console.log('Bạn đã vượt quá giới hạn số lần đặt vé');
    } else {
        await redis.incr(rateLimitKey);
        await redis.expire(rateLimitKey, 60); // Đặt thời gian hết hạn của khóa là 60 giây
        console.log('Vé đã được đặt thành công');
    }
}
// Pub/Sub
async function notify() {
    // Publisher
    redis.publish('ticket:updates', JSON.stringify({ eventId: 'event_123', message: 'Vé mới vừa được thêm' }));

    // Subscriber
    redis.subscribe('ticket:updates');
    redis.on('message', (channel, message) => {
        console.log(`New update: ${message}`);
    });
}


// Ví dụ sử dụng:
(async () => {
    // Lấy thông tin sản phẩm có ID là "product_1"
    const product = await getProduct('product_1');
    console.log(product);

    // Thêm sản phẩm vào giỏ hàng của người dùng có ID là "user_123"
    await addToCart('user_123', 'product_1');

    // Lấy giỏ hàng của người dùng
    const cart = await getCart('user_123');
    console.log(cart);
})();

