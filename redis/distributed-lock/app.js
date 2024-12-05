const { runWithLock } = require('./lock');

// Example function to simulate a critical section
async function criticalTask() {
    console.log('Executing critical task...');
    // Simulate a task that takes time (e.g., database operation)
    await new Promise(resolve => setTimeout(resolve, 2000)); // Sleep for 2 seconds
    console.log('Critical task completed!');
}

// Run the task with a distributed lock
runWithLock(criticalTask)
    .then(() => {
        console.log('Process finished.');
    })
    .catch(err => {
        console.error('Error:', err);
    });
