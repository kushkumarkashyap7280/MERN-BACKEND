# Worker Threads Module

The `worker_threads` module in Node.js enables the use of threads that execute JavaScript in parallel. It's particularly useful for CPU-intensive operations that would otherwise block the main event loop.

## Key Features

- **True Parallelism**: Execute JavaScript code in parallel using multiple CPU cores
- **Shared Memory**: Transfer and share memory between threads efficiently
- **Resource Isolation**: Each worker has its own V8 instance and event loop
- **Message Passing**: Communication between main thread and workers
- **Error Handling**: Propagate and manage errors across thread boundaries

## Core Concepts

### Worker Thread States

- **Creation**: When a new worker is created and initialized
- **Running**: While the worker is executing its assigned tasks
- **Terminated**: After the worker has completed or been terminated

### Thread Communication Methods

- **Message passing**: Using `postMessage()` and `on('message')` handlers
- **Shared memory**: Using `SharedArrayBuffer` for direct memory access
- **Worker data**: Passing initial data during worker creation
- **Message ports**: For communication between different workers

## Basic Example

```javascript
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);

if (isMainThread) {
    // This code runs in the main thread

    // Create a new worker
    const worker = new Worker(__filename, {
        workerData: {
            value: 42,
            text: "Hello from main thread",
        },
    });

    // Receive messages from the worker
    worker.on("message", (message) => {
        console.log(`Main thread received: ${message}`);
    });

    // Handle worker errors
    worker.on("error", (error) => {
        console.error(`Worker error: ${error}`);
    });

    // Handle worker exit
    worker.on("exit", (code) => {
        if (code !== 0) {
            console.error(`Worker stopped with exit code ${code}`);
        } else {
            console.log("Worker completed successfully");
        }
    });

    // Send a message to the worker
    worker.postMessage("Hello from main thread!");
} else {
    // This code runs in the worker thread

    // Access data passed from the main thread
    console.log(`Worker received initial data: ${JSON.stringify(workerData)}`);

    // Listen for messages from the main thread
    parentPort.on("message", (message) => {
        console.log(`Worker received message: ${message}`);

        // Do some work
        const result = `Worker processed: ${message.toUpperCase()}`;

        // Send the result back to the main thread
        parentPort.postMessage(result);
    });
}
```

## Advanced Usage

### Worker Pool Implementation

```javascript
import { Worker } from "worker_threads";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class WorkerPool {
    constructor(workerPath, numWorkers = os.cpus().length) {
        this.workerPath = workerPath;
        this.numWorkers = numWorkers;
        this.workers = [];
        this.freeWorkers = [];
        this.tasks = [];

        // Initialize workers
        for (let i = 0; i < this.numWorkers; i++) {
            this.addNewWorker();
        }
    }

    addNewWorker() {
        const worker = new Worker(this.workerPath);

        worker.on("message", (result) => {
            // Worker is done with task
            const callback = worker._callback;
            worker._callback = null;

            // Add worker back to free pool
            this.freeWorkers.push(worker);

            // Process next task if any
            if (this.tasks.length > 0) {
                const task = this.tasks.shift();
                this.runTask(task.task, task.callback);
            }

            // Execute callback with the result
            callback(null, result);
        });

        worker.on("error", (err) => {
            if (worker._callback) {
                worker._callback(err, null);
            }

            // Remove the worker from the pool and replace it
            this.removeWorker(worker);
            this.addNewWorker();
        });

        this.workers.push(worker);
        this.freeWorkers.push(worker);
    }

    removeWorker(worker) {
        worker.terminate();

        // Remove from workers array
        const index = this.workers.indexOf(worker);
        if (index !== -1) this.workers.splice(index, 1);

        // Remove from free workers array
        const freeIndex = this.freeWorkers.indexOf(worker);
        if (freeIndex !== -1) this.freeWorkers.splice(freeIndex, 1);
    }

    runTask(task, callback) {
        if (this.freeWorkers.length === 0) {
            // No free workers, queue the task
            this.tasks.push({ task, callback });
            return;
        }

        const worker = this.freeWorkers.pop();
        worker._callback = callback;
        worker.postMessage(task);
    }

    close() {
        for (const worker of this.workers) {
            worker.terminate();
        }
    }
}

// Usage example
async function main() {
    const pool = new WorkerPool(path.join(__dirname, "task-worker.js"), 4);

    // Function to run a task and get a promise
    const runTask = (data) => {
        return new Promise((resolve, reject) => {
            pool.runTask(data, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });
    };

    try {
        // Run multiple tasks in parallel
        const results = await Promise.all([
            runTask({ number: 10, type: "fibonacci" }),
            runTask({ number: 20, type: "factorial" }),
            runTask({ number: 30, type: "prime" }),
            runTask({ number: 40, type: "fibonacci" }),
            runTask({ number: 50, type: "factorial" }),
        ]);

        console.log("All tasks completed:", results);
    } catch (err) {
        console.error("Error running tasks:", err);
    } finally {
        // Close the pool when done
        pool.close();
    }
}

main().catch(console.error);
```

**Worker file (task-worker.js)**:

```javascript
import { parentPort } from "worker_threads";

// Calculate fibonacci
function fibonacci(n) {
    if (n <= 1) return n;
    let [a, b] = [0, 1];
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b];
    }
    return b;
}

// Calculate factorial
function factorial(n) {
    if (n <= 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}

// Check if a number is prime
function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;

    for (let i = 5; i * i <= n; i += 6) {
        if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
}

// Find the nth prime number
function findNthPrime(n) {
    let count = 0;
    let num = 1;

    while (count < n) {
        num++;
        if (isPrime(num)) {
            count++;
        }
    }

    return num;
}

// Process messages from the main thread
parentPort.on("message", (task) => {
    const { number, type } = task;
    let result;

    // Perform CPU-intensive calculation based on the task type
    switch (type) {
        case "fibonacci":
            result = fibonacci(number);
            break;
        case "factorial":
            result = factorial(number);
            break;
        case "prime":
            result = findNthPrime(number);
            break;
        default:
            throw new Error(`Unknown task type: ${type}`);
    }

    // Send the result back to the main thread
    parentPort.postMessage({
        type,
        number,
        result,
        workerId: process.pid,
    });
});
```

### Shared Memory Between Threads

```javascript
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

if (isMainThread) {
    // Create a shared buffer that can be accessed by multiple threads
    const sharedBuffer = new SharedArrayBuffer(4 * 10); // 10 int32 values
    const sharedArray = new Int32Array(sharedBuffer);

    // Initialize the shared array
    for (let i = 0; i < sharedArray.length; i++) {
        Atomics.store(sharedArray, i, 0);
    }

    // Create multiple workers that all have access to the shared memory
    const numWorkers = 4;
    const workers = [];

    for (let i = 0; i < numWorkers; i++) {
        const worker = new Worker(__filename, {
            workerData: {
                workerId: i,
                sharedBuffer,
            },
        });

        worker.on("exit", (code) => {
            console.log(`Worker ${i} exited with code ${code}`);

            // Check if all workers have completed
            if (workers.every((w) => w.threadId && !w.isRunning)) {
                console.log("All workers have completed. Final values:");
                for (let i = 0; i < sharedArray.length; i++) {
                    console.log(`sharedArray[${i}] = ${Atomics.load(sharedArray, i)}`);
                }
            }
        });

        workers.push(worker);
    }

    // Signal all workers to start processing
    for (let i = 0; i < numWorkers; i++) {
        workers[i].postMessage("start");
    }
} else {
    // This code runs in the worker thread
    const { workerId, sharedBuffer } = workerData;
    const sharedArray = new Int32Array(sharedBuffer);

    // Wait for the start signal
    parentPort.once("message", (message) => {
        if (message === "start") {
            console.log(`Worker ${workerId} starting`);

            // Perform some operations on the shared memory
            for (let i = 0; i < 100; i++) {
                // Use atomic operations to safely update shared memory
                const index = i % sharedArray.length;

                // Atomic add - ensures no race conditions between threads
                Atomics.add(sharedArray, index, 1);

                // Simulate some processing time
                const start = Date.now();
                while (Date.now() - start < 10) {
                    // Busy-wait to simulate CPU work
                }
            }

            console.log(`Worker ${workerId} finished`);
            // Exit the worker thread
            process.exit(0);
        }
    });
}
```

### Image Processing Example

```javascript
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In a real application, you'd use a library like Sharp or Jimp
// This is a simplified example using a hypothetical image processing function
function processImageChunk(imageData, startY, endY, width, height, options) {
    // Simulate image processing operations
    // In reality, you'd manipulate pixel data here
    console.log(`Processing image chunk from y=${startY} to y=${endY}`);

    // Create a new array to hold the processed data
    const processedData = new Uint8ClampedArray(imageData.length);

    // Simulate a simple grayscale operation
    for (let i = 0; i < imageData.length; i += 4) {
        // Calculate position in the image
        const pixelIndex = i / 4;
        const x = pixelIndex % width;
        const y = Math.floor(pixelIndex / width);

        // Only process pixels in our assigned chunk
        if (y >= startY && y < endY) {
            if (options.grayscale) {
                // Grayscale formula: 0.299R + 0.587G + 0.114B
                const gray = Math.round(0.299 * imageData[i] + 0.587 * imageData[i + 1] + 0.114 * imageData[i + 2]);

                processedData[i] = gray; // R
                processedData[i + 1] = gray; // G
                processedData[i + 2] = gray; // B
                processedData[i + 3] = imageData[i + 3]; // A (unchanged)
            } else if (options.invert) {
                // Invert colors
                processedData[i] = 255 - imageData[i]; // R
                processedData[i + 1] = 255 - imageData[i + 1]; // G
                processedData[i + 2] = 255 - imageData[i + 2]; // B
                processedData[i + 3] = imageData[i + 3]; // A (unchanged)
            }
        }
    }

    return processedData;
}

if (isMainThread) {
    async function processImageWithWorkers(imagePath, outputPath, options = { grayscale: true }) {
        try {
            // In a real application, load the image using a proper library
            console.log(`Loading image from ${imagePath}`);

            // Simulate loading an image
            // For simplicity, we'll create dummy image data
            const width = 1920;
            const height = 1080;
            const imageData = new Uint8ClampedArray(width * height * 4); // RGBA

            // Fill with some dummy data
            for (let i = 0; i < imageData.length; i += 4) {
                imageData[i] = Math.floor(Math.random() * 256); // R
                imageData[i + 1] = Math.floor(Math.random() * 256); // G
                imageData[i + 2] = Math.floor(Math.random() * 256); // B
                imageData[i + 3] = 255; // A (fully opaque)
            }

            // Determine how many workers to use (one per CPU core is typical)
            const numWorkers = Math.min(os.cpus().length, 4);
            console.log(`Using ${numWorkers} worker threads`);

            // Split the image into horizontal chunks for parallel processing
            const chunkHeight = Math.ceil(height / numWorkers);
            const workers = [];
            const results = [];

            // Create a promise to track when all workers are done
            const workerPromises = [];

            for (let i = 0; i < numWorkers; i++) {
                const startY = i * chunkHeight;
                const endY = Math.min((i + 1) * chunkHeight, height);

                // Create a new promise for this worker
                const workerPromise = new Promise((resolve, reject) => {
                    const worker = new Worker(__filename, {
                        workerData: {
                            imageData,
                            startY,
                            endY,
                            width,
                            height,
                            options,
                        },
                    });

                    worker.on("message", (processedChunk) => {
                        console.log(`Received processed chunk from worker ${i}`);
                        results[i] = {
                            startY,
                            endY,
                            data: processedChunk,
                        };
                        resolve();
                    });

                    worker.on("error", reject);
                    worker.on("exit", (code) => {
                        if (code !== 0) {
                            reject(new Error(`Worker stopped with exit code ${code}`));
                        }
                    });

                    workers.push(worker);
                });

                workerPromises.push(workerPromise);
            }

            // Wait for all workers to complete
            await Promise.all(workerPromises);
            console.log("All workers have completed processing");

            // Combine the processed chunks back into a single image
            const processedImageData = new Uint8ClampedArray(width * height * 4);

            for (const result of results) {
                const { startY, endY, data } = result;

                // Copy this chunk's data to the appropriate position in the output
                for (let y = startY; y < endY; y++) {
                    for (let x = 0; x < width; x++) {
                        const sourceIndex = (y - startY) * width * 4 + x * 4;
                        const targetIndex = y * width * 4 + x * 4;

                        processedImageData[targetIndex] = data[sourceIndex]; // R
                        processedImageData[targetIndex + 1] = data[sourceIndex + 1]; // G
                        processedImageData[targetIndex + 2] = data[sourceIndex + 2]; // B
                        processedImageData[targetIndex + 3] = data[sourceIndex + 3]; // A
                    }
                }
            }

            console.log(`Writing processed image to ${outputPath}`);
            // In a real application, save the image using a proper library
            // For this example, we'll just log that it's done

            // Clean up workers
            for (const worker of workers) {
                worker.terminate();
            }

            return {
                success: true,
                width,
                height,
                outputPath,
            };
        } catch (error) {
            console.error("Error processing image:", error);
            throw error;
        }
    }

    // Example usage
    processImageWithWorkers(path.join(__dirname, "input.jpg"), path.join(__dirname, "output.jpg"), { grayscale: true })
        .then((result) => {
            console.log("Image processing completed:", result);
        })
        .catch((error) => {
            console.error("Image processing failed:", error);
        });
} else {
    // This code runs in the worker thread
    const { imageData, startY, endY, width, height, options } = workerData;

    console.log(`Worker processing chunk from y=${startY} to y=${endY}`);

    // Process this chunk of the image
    const processedChunk = processImageChunk(imageData, startY, endY, width, height, options);

    // Send the processed chunk back to the main thread
    parentPort.postMessage(processedChunk);
}
```

## Performance Monitoring

```javascript
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";
import os from "os";
import path from "path";
import { performance, PerformanceObserver } from "perf_hooks";

const __filename = fileURLToPath(import.meta.url);

// Create a performance observer to monitor task durations
const perfObserver = new PerformanceObserver((items) => {
    items.getEntries().forEach((entry) => {
        console.log(`${entry.name}: ${entry.duration.toFixed(2)}ms`);
    });
});

perfObserver.observe({ entryTypes: ["measure"] });

if (isMainThread) {
    async function runBenchmark() {
        const numCPUs = os.cpus().length;
        console.log(`Running benchmark on system with ${numCPUs} CPU cores`);

        // The task: calculate prime numbers
        const task = { maxNumber: 10000000 }; // Find primes up to 10 million

        // Measure single-threaded performance
        performance.mark("single-start");

        const singleThreadedResult = findPrimes(task.maxNumber);

        performance.mark("single-end");
        performance.measure("Single-threaded execution", "single-start", "single-end");

        console.log(`Single-threaded found ${singleThreadedResult.length} primes`);

        // Now measure multi-threaded performance with different numbers of workers
        for (let numWorkers of [2, 4, Math.max(4, numCPUs)]) {
            if (numWorkers > numCPUs) {
                numWorkers = numCPUs;
            }

            performance.mark(`workers-${numWorkers}-start`);

            const result = await runWithWorkers(task, numWorkers);

            performance.mark(`workers-${numWorkers}-end`);
            performance.measure(
                `Multi-threaded execution (${numWorkers} workers)`,
                `workers-${numWorkers}-start`,
                `workers-${numWorkers}-end`
            );

            console.log(`${numWorkers} workers found ${result.length} primes`);

            // Verify results match
            if (result.length !== singleThreadedResult.length) {
                console.error("Result mismatch between single and multi-threaded execution!");
            }
        }
    }

    function findPrimes(maxNumber) {
        const primes = [];

        for (let num = 2; num <= maxNumber; num++) {
            let isPrime = true;

            for (let i = 2; i <= Math.sqrt(num); i++) {
                if (num % i === 0) {
                    isPrime = false;
                    break;
                }
            }

            if (isPrime) {
                primes.push(num);
            }
        }

        return primes;
    }

    async function runWithWorkers(task, numWorkers) {
        const workers = [];
        const allPrimes = [];

        // Create a range for each worker
        const rangeSize = Math.ceil(task.maxNumber / numWorkers);

        const workerPromises = [];

        for (let i = 0; i < numWorkers; i++) {
            const start = i * rangeSize + 2; // Start from 2 for the first worker
            const end = Math.min((i + 1) * rangeSize + 1, task.maxNumber);

            const workerPromise = new Promise((resolve, reject) => {
                const worker = new Worker(__filename, {
                    workerData: { start, end },
                });

                worker.on("message", (primes) => {
                    allPrimes.push(...primes);
                    resolve();
                });

                worker.on("error", reject);
                worker.on("exit", (code) => {
                    if (code !== 0) {
                        reject(new Error(`Worker stopped with exit code ${code}`));
                    }
                });

                workers.push(worker);
            });

            workerPromises.push(workerPromise);
        }

        // Wait for all workers to complete
        await Promise.all(workerPromises);

        // Sort the combined results
        allPrimes.sort((a, b) => a - b);

        // Clean up workers
        for (const worker of workers) {
            worker.terminate();
        }

        return allPrimes;
    }

    // Run the benchmark
    runBenchmark().catch(console.error);
} else {
    // Worker code
    const { start, end } = workerData;

    function findPrimesInRange(start, end) {
        const primes = [];

        // Ensure start is at least 2 (smallest prime)
        const rangeStart = Math.max(2, start);

        for (let num = rangeStart; num <= end; num++) {
            let isPrime = true;

            for (let i = 2; i <= Math.sqrt(num); i++) {
                if (num % i === 0) {
                    isPrime = false;
                    break;
                }
            }

            if (isPrime) {
                primes.push(num);
            }
        }

        return primes;
    }

    // Find primes in the assigned range
    const primes = findPrimesInRange(start, end);

    // Send results back to main thread
    parentPort.postMessage(primes);
}
```

## Error Handling and Debugging

```javascript
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set up worker logging
async function workerLog(workerId, level, message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [Worker ${workerId}] [${level}] ${message}\n`;

    try {
        // Ensure log directory exists
        await fs.mkdir(path.join(__dirname, "logs"), { recursive: true });

        // Append to worker log file
        await fs.appendFile(path.join(__dirname, "logs", `worker-${workerId}.log`), logEntry);
    } catch (err) {
        // If file logging fails, at least log to console
        console.error(`Failed to write to log: ${err.message}`);
        console[level === "ERROR" ? "error" : "log"](logEntry);
    }
}

if (isMainThread) {
    async function main() {
        const tasks = [
            { id: 1, type: "normal", data: { value: 42 } },
            { id: 2, type: "error", data: { value: "will cause error" } },
            { id: 3, type: "crash", data: { value: "will crash worker" } },
            { id: 4, type: "normal", data: { value: 100 } },
            { id: 5, type: "timeout", data: { value: "will timeout" } },
        ];

        // Process tasks with error handling and recovery
        for (const task of tasks) {
            console.log(`Processing task ${task.id}...`);

            try {
                // Execute task with timeout
                const result = await executeTaskWithTimeout(task, 5000);
                console.log(`Task ${task.id} completed with result:`, result);
            } catch (error) {
                console.error(`Task ${task.id} failed:`, error.message);

                // Depending on error type, we might retry the task
                if (error.name === "TimeoutError") {
                    console.log(`Retrying task ${task.id} once...`);
                    try {
                        // Retry with longer timeout
                        const result = await executeTaskWithTimeout(task, 10000);
                        console.log(`Task ${task.id} retry completed with result:`, result);
                    } catch (retryError) {
                        console.error(`Task ${task.id} retry also failed:`, retryError.message);
                    }
                }
            }
        }

        console.log("All tasks processed");
    }

    // Execute a task in a worker with timeout
    function executeTaskWithTimeout(task, timeoutMs) {
        return new Promise((resolve, reject) => {
            const worker = new Worker(__filename, {
                workerData: {
                    task,
                    workerId: `${task.id}-${Date.now()}`,
                },
            });

            // Set timeout
            const timeoutId = setTimeout(() => {
                worker.terminate();
                const timeoutError = new Error(`Task ${task.id} timed out after ${timeoutMs}ms`);
                timeoutError.name = "TimeoutError";
                reject(timeoutError);
            }, timeoutMs);

            // Handle worker messages
            worker.on("message", (result) => {
                clearTimeout(timeoutId);
                resolve(result);
            });

            // Handle worker errors
            worker.on("error", (error) => {
                clearTimeout(timeoutId);
                error.taskId = task.id;
                reject(error);
            });

            // Handle worker exit
            worker.on("exit", (code) => {
                clearTimeout(timeoutId);
                if (code !== 0) {
                    const error = new Error(`Worker stopped with exit code ${code}`);
                    error.name = "WorkerExitError";
                    error.taskId = task.id;
                    error.exitCode = code;
                    reject(error);
                }
            });
        });
    }

    main().catch(console.error);
} else {
    // This code runs in the worker thread
    const { task, workerId } = workerData;

    // Setup global error handlers for uncaught exceptions
    process.on("uncaughtException", async (err) => {
        await workerLog(workerId, "ERROR", `Uncaught exception: ${err.message}\n${err.stack}`);
        process.exit(1);
    });

    process.on("unhandledRejection", async (reason, promise) => {
        await workerLog(workerId, "ERROR", `Unhandled rejection at ${promise}. Reason: ${reason}`);
        process.exit(1);
    });

    async function processTask(task) {
        await workerLog(workerId, "INFO", `Starting to process task ${task.id} of type ${task.type}`);

        try {
            switch (task.type) {
                case "normal":
                    // Simulate successful processing
                    await workerLog(workerId, "INFO", `Processing normal task with value ${task.data.value}`);
                    // Simulate some work
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    return { success: true, result: task.data.value * 2 };

                case "error":
                    // Simulate a handled error
                    await workerLog(workerId, "WARN", `Task will throw a handled error`);
                    throw new Error("This is a handled error");

                case "crash":
                    // Simulate an unhandled error that would crash the worker
                    await workerLog(workerId, "ERROR", `Task will cause an unhandled error`);
                    // Access an undefined variable to cause a crash
                    const undefined_var = null;
                    undefined_var.some_property = "This will throw";
                    return { success: false };

                case "timeout":
                    // Simulate a task that takes too long
                    await workerLog(workerId, "INFO", `Task will timeout`);
                    await new Promise((resolve) => setTimeout(resolve, 20000));
                    return { success: true, result: "This should never return" };

                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
        } catch (error) {
            await workerLog(workerId, "ERROR", `Error processing task: ${error.message}\n${error.stack}`);
            throw error;
        }
    }

    // Process the task and return the result
    processTask(task)
        .then((result) => {
            parentPort.postMessage(result);
        })
        .catch((error) => {
            // This will propagate the error to the main thread
            throw error;
        })
        .finally(() => {
            // Clean up any resources if needed
        });
}
```

## Best Practices

1. **Choose the Right Tasks**
    - Use worker threads for CPU-intensive tasks, not I/O operations
    - Consider the overhead of creating workers and transferring data

2. **Manage Worker Lifecycle**
    - Create a pool of workers for reuse rather than creating new ones for each task
    - Properly terminate workers to avoid memory leaks
    - Handle unexpected worker termination

3. **Optimize Data Transfer**
    - Use `transferList` parameter with `postMessage()` for large TypedArrays and ArrayBuffers
    - Use SharedArrayBuffer for frequently accessed shared data
    - Be mindful of the cost of serialization/deserialization

4. **Error Handling**
    - Always implement proper error handling for workers
    - Set up error events handlers for all workers
    - Implement timeouts for long-running tasks

5. **State Management**
    - Keep worker code stateless when possible
    - When state is needed, initialize it properly for each worker
    - Be aware of memory usage in long-running workers

## Memory Management

### Transferring vs Cloning Memory

```javascript
import { Worker, isMainThread, parentPort, workerData } from "worker_threads";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);

if (isMainThread) {
    // Demo 1: Regular cloning (expensive for large data)
    function demoCloning() {
        console.log("\n--- Cloning Demo ---");

        // Create a large array buffer (100MB)
        const largeBuffer = new ArrayBuffer(100 * 1024 * 1024);
        const view = new Uint8Array(largeBuffer);

        // Fill with some data
        for (let i = 0; i < view.length; i++) {
            view[i] = i % 256;
        }

        console.log(`Main thread: Created buffer of ${largeBuffer.byteLength / (1024 * 1024)} MB`);

        const startTime = Date.now();

        // Create worker and clone the data (slow)
        const worker = new Worker(__filename, {
            workerData: { demo: "clone", buffer: largeBuffer },
        });

        console.log(`Main thread: Cloning took ${Date.now() - startTime} ms`);
        console.log(`Main thread: Original buffer still accessible: ${largeBuffer.byteLength} bytes`);

        worker.on("exit", () => {
            console.log("Cloning demo worker exited");
        });
    }

    // Demo 2: Transferring ownership (fast, but original becomes detached)
    function demoTransfer() {
        console.log("\n--- Transfer Demo ---");

        // Create a large array buffer (100MB)
        const largeBuffer = new ArrayBuffer(100 * 1024 * 1024);
        const view = new Uint8Array(largeBuffer);

        // Fill with some data
        for (let i = 0; i < view.length; i++) {
            view[i] = i % 256;
        }

        console.log(`Main thread: Created buffer of ${largeBuffer.byteLength / (1024 * 1024)} MB`);

        const startTime = Date.now();

        // Create worker and transfer the data (fast)
        const worker = new Worker(__filename, {
            workerData: { demo: "transfer" },
            transferList: [largeBuffer],
        });

        console.log(`Main thread: Transfer took ${Date.now() - startTime} ms`);

        // The original buffer is now detached
        try {
            console.log(`Main thread: Original buffer size: ${largeBuffer.byteLength} bytes`);
        } catch (e) {
            console.log(`Main thread: Original buffer is detached: ${e.message}`);
        }

        worker.on("message", (message) => {
            console.log(`Main thread: Received message from worker: ${message}`);
        });

        worker.on("exit", () => {
            console.log("Transfer demo worker exited");
        });
    }

    // Demo 3: Using SharedArrayBuffer (best for shared memory)
    function demoSharedBuffer() {
        console.log("\n--- SharedArrayBuffer Demo ---");

        // Create a shared buffer (100MB)
        const sharedBuffer = new SharedArrayBuffer(100 * 1024 * 1024);
        const view = new Uint8Array(sharedBuffer);

        // Fill with some data
        for (let i = 0; i < 100; i++) {
            view[i] = i;
        }

        console.log(`Main thread: Created shared buffer of ${sharedBuffer.byteLength / (1024 * 1024)} MB`);
        console.log(`Main thread: First few values: ${view.slice(0, 10)}`);

        // Create worker with shared buffer
        const worker = new Worker(__filename, {
            workerData: { demo: "shared", buffer: sharedBuffer },
        });

        // Wait for worker to modify the buffer, then check the values
        worker.on("message", (message) => {
            console.log(`Main thread: Received message from worker: ${message}`);
            console.log(`Main thread: Buffer values after worker modification: ${view.slice(0, 10)}`);
        });

        worker.on("exit", () => {
            console.log("SharedArrayBuffer demo worker exited");
        });
    }

    // Run all demos
    demoCloning();
    setTimeout(demoTransfer, 1000);
    setTimeout(demoSharedBuffer, 2000);
} else {
    // Worker code
    const { demo } = workerData;

    if (demo === "clone") {
        // Handle cloned buffer
        const buffer = workerData.buffer;
        const view = new Uint8Array(buffer);

        console.log(`Worker (clone): Received buffer of ${buffer.byteLength / (1024 * 1024)} MB`);
        console.log(`Worker (clone): First few values: ${view.slice(0, 10)}`);

        // Exit after processing
        process.exit(0);
    } else if (demo === "transfer") {
        // Handle transferred buffer
        const buffer = workerData.buffer;
        console.log(`Worker (transfer): Checking received buffer...`);

        if (!buffer) {
            // In transfer mode, the buffer is sent via the message channel
            parentPort.once("message", (message) => {
                const { buffer } = message;
                const view = new Uint8Array(buffer);

                console.log(`Worker (transfer): Received buffer of ${buffer.byteLength / (1024 * 1024)} MB`);
                console.log(`Worker (transfer): First few values: ${view.slice(0, 10)}`);

                // Send acknowledgment back
                parentPort.postMessage("Received and processed transferred buffer");

                // Exit after processing
                process.exit(0);
            });
        }
    } else if (demo === "shared") {
        // Handle shared buffer
        const buffer = workerData.buffer;
        const view = new Uint8Array(buffer);

        console.log(`Worker (shared): Received shared buffer of ${buffer.byteLength / (1024 * 1024)} MB`);
        console.log(`Worker (shared): First few values before modification: ${view.slice(0, 10)}`);

        // Modify the buffer - this will be visible to the main thread
        for (let i = 0; i < 10; i++) {
            // Use atomic operations for thread safety
            Atomics.store(view, i, 100 + i);
        }

        console.log(`Worker (shared): Modified first few values: ${view.slice(0, 10)}`);

        // Notify main thread that we're done
        parentPort.postMessage("Finished modifying shared buffer");

        // Exit after processing
        process.exit(0);
    }
}
```

## Common Pitfalls

1. **Creating Too Many Workers**
    - Creating a worker for each task can cause performance issues
    - Each worker has memory and CPU overhead

2. **Improper Error Handling**
    - Not handling worker errors can lead to silent failures
    - Uncaught exceptions in workers will crash the entire process

3. **Blocking the Event Loop in Workers**
    - Each worker has its own event loop that can be blocked
    - Long-running synchronous operations can still cause issues

4. **Race Conditions with Shared Memory**
    - Not using atomic operations with SharedArrayBuffer
    - Missing proper synchronization between threads

5. **Overestimating Performance Gains**
    - Small tasks may not benefit from parallelization due to overhead
    - I/O-bound tasks usually don't benefit from worker threads

## Resources

- [Node.js Worker Threads Documentation](https://nodejs.org/api/worker_threads.html)
- [Worker Threads vs Child Process](https://nodejs.org/api/worker_threads.html#worker-threads-vs-child_process)
- [Atomics API Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Atomics)
- [SharedArrayBuffer Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/SharedArrayBuffer)
