const { getRedis } = require("../../express-base/src/dbs/init.redis");

const { instance: redis } = getRedis();
// Lock settings
const LOCK_KEY = 'distributed_lock'; // The lock key in Redis
const LOCK_EXPIRE = 5000; // Lock expiry in milliseconds
const RETRY_DELAY = 1000; // Delay before retrying to acquire the lock
const MAX_RETRIES = 5; // Max retries before giving up

// Try to acquire the lock
async function acquireLock() {
    const lockValue = Date.now().toString(); // Use the current timestamp as lock value

    try {
        // Attempt to acquire the lock (SETNX)
        const result = await redis.set(LOCK_KEY, lockValue, 'NX', 'PX', LOCK_EXPIRE);

        // Tham số NX chỉ định rằng Redis sẽ chỉ thiết lập giá trị cho khóa nếu khóa đó chưa tồn tại
        // Tham số PX chỉ định rằng Redis sẽ gán một thời gian hết hạn (TTL) cho khóa theo đơn vị mili giây.

        if (result === 'OK') {
            console.log('Lock acquired!');
            return lockValue;
        } else {
            console.log('Lock already acquired by another process');
            return null;
        }
    } catch (err) {
        console.error('Error acquiring lock:', err);
        return null;
    }
}

// Release the lock
async function releaseLock(lockValue) {
    try {
        // Check if the lock is still held by this process (we use the lock value for validation)
        const currentValue = await redis.get(LOCK_KEY);

        if (currentValue === lockValue) {
            // Only delete the lock if it matches the value we set
            await redis.del(LOCK_KEY);
            console.log('Lock released!');
        } else {
            console.log('Lock was not held by this process or has already been released');
        }
    } catch (err) {
        console.error('Error releasing lock:', err);
    }
}

// Retry logic for acquiring the lock
async function runWithLock(fn) {
    let retries = 0;
    let lockValue = null;

    while (retries < MAX_RETRIES) {
        lockValue = await acquireLock();

        if (lockValue) {
            // Lock acquired, execute the critical section
            try {
                await fn();
            } finally {
                // Release the lock after the critical section is done
                await releaseLock(lockValue);
                return;
            }
        } else {
            retries++;
            console.log(`Retrying to acquire lock... Attempt ${retries}/${MAX_RETRIES}`);
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
    }

    console.log('Max retries reached. Could not acquire lock.');
}

// NOTE: Must release lock after finishing (success or error)

module.exports = { runWithLock };
