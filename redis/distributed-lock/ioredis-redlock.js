const { getRedis } = require("../../express-base/src/dbs/init.redis");
const Redlock = require('redlock');

const { instance: redis } = getRedis();

// Kết nối Redis
const redlock = new Redlock([redis], {
    driftFactor: 0.01, // Hệ số trễ, điều chỉnh cho các sự khác biệt về thời gian giữa các Redis node
    retryCount: 10,    // Số lần thử lại khi không lấy được khóa
    retryDelay: 200,   // Thời gian chờ giữa các lần thử (ms)
    retryJitter: 200,  // Thời gian ngẫu nhiên thêm vào để tránh đồng bộ hóa các retry
});

// Mô phỏng việc đặt vé
async function bookTicket(userId) {
    // Tạo khóa cho sự kiện (key của Redis)
    const lockKey = 'event_123'; // Ví dụ sự kiện với ID 123
    const ttl = 10000; // Thời gian tồn tại của khóa (10 giây)

    try {
        // Cố gắng khóa
        const lock = await redlock.acquire([lockKey], ttl);

        // Giả sử bạn có tổng số vé cho sự kiện này
        if (availableTickets > 0) {
            availableTickets--; // Giảm số vé đi 1
            console.log(`User ${userId} successfully booked a ticket. Remaining tickets: ${availableTickets}`);
            // Thực hiện công việc của bạn ở đây (ví dụ: ghi vào DB, gửi email, v.v...)
        } else {
            console.log(`User ${userId} failed to book a ticket. No tickets available.`);
        }

        // Giải phóng khóa sau khi hoàn thành
        await lock.release();
        console.log(`Lock released by user ${userId}`);
    } catch (err) {
        console.error(`Error booking ticket for user ${userId}: ${err.message}`);
    }
}

// Giả lập một số người dùng cố gắng đặt vé
async function simulateBooking() {
    const users = ['user1', 'user2', 'user3', 'user4', 'user5'];

    const bookingPromises = users.map(userId => bookTicket(userId));

    await Promise.all(bookingPromises);
    console.log('All booking attempts finished');
}

// Biến mô phỏng số vé còn lại
let availableTickets = 10; // Giả sử có 10 vé cho sự kiện này

simulateBooking();
