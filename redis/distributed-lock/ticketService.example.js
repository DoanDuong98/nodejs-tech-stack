// const { getRedis } = require("../../../dbs/init.redis");
//
// const { instance: redis } = getRedis();

const Redis = require('ioredis');
const redis = new Redis(); // Một Redis instance
// Các cài đặt khóa
const LOCK_EXPIRE = 5000; // Thời gian hết hạn của khóa (5 giây)
const RETRY_DELAY = 1000; // Thời gian chờ giữa các lần thử (1 giây)
const MAX_RETRIES = 3; // Số lần thử tối đa

const EVENT_KEY = 'event_book_ticket'; // Ví dụ sự kiện có ID là 123
const MAX_TICKETS = 1; // Tổng số vé có sẵn cho sự kiện này
// let availableTickets = MAX_TICKETS; // Số vé còn lại trong kho
let res = []; // Số vé còn lại trong kho

// Mô phỏng thao tác đặt vé
async function bookTicket(userId) {
    // Tạo khóa cho việc đặt vé (lock key)
    const lockKey = `lock:${EVENT_KEY}`;
    // Thử lấy khóa
    const lockValue = Date.now().toString(); // Sử dụng thời gian hiện tại làm giá trị khóa
    console.log("Time::", userId, lockValue)
    const result = await redis.set(lockKey, lockValue, 'NX', 'PX', LOCK_EXPIRE);
    if (result !== 'OK') {
        console.log(`User ${userId} failed to acquire lock. Retrying...`);
        return false; // Không thể lấy khóa, trả lại false
    }

    console.log(`User ${userId} acquired lock`);

    try {
        // Giả sử đây là phần mã đặt vé, cần phải giảm số lượng vé
        let availableTickets = await redis.get("MAX_TICKETS");
        availableTickets = parseInt(availableTickets, 10);
        if (availableTickets > 0) {
            // update trong redis
            await redis.decr("MAX_TICKETS");
            // send mail, update dbs,...
            res.push(userId);
            console.log(`User ${userId} successfully booked a ticket. Remaining tickets: ${availableTickets}`);
            return true;
        } else {
            console.log(`User ${userId} failed to book a ticket. No tickets available.`);
            return false;
        }
    } finally {
        // Giải phóng khóa sau khi thực hiện xong
        const currentLockValue = await redis.get(lockKey);
        if (currentLockValue === lockValue) {
            await redis.del(lockKey); // Giải phóng khóa
            console.log(`User ${userId} released the lock`);
        } else {
            console.log(`Lock was already released by another process`);
        }
    }
}

// Thử đặt vé cho nhiều người dùng
async function attemptBooking(userId) {
    let retries = 0;
    while (retries < MAX_RETRIES) {
        const result = await bookTicket(userId);
        if (result) {
            break; // Nếu thành công, không thử lại
        }
        retries++;
        console.log(`User ${userId} retrying... Attempt ${retries}/${MAX_RETRIES}`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY)); // Đợi 1 giây trước khi thử lại
    }
}

// Mô phỏng đặt vé cho nhiều người dùng cùng lúc
async function simulateBooking() {
    // const users = ['user1', 'user2', 'user3', 'user4', 'user5'];
    const users = Array.from({length: 100}, (_, index) => index + 1).sort(() => Math.random() - 0.5).map((num, i) => `user_${num}`);
    await redis.set("MAX_TICKETS", MAX_TICKETS);
    // Giả lập việc nhiều người dùng cố gắng đặt vé
    const bookingPromises = users.map(userId => attemptBooking(userId));

    await Promise.all(bookingPromises);
    console.log('All booking attempts finished, list users:: ', res.join(", "));
    const  availableTickets = await redis.get("MAX_TICKETS");
    console.log('Available Tickets:: ', availableTickets);
}

simulateBooking().then(r => console.log("DONE!"));
