# Cluster Module

The `cluster` module in Node.js enables the creation of child processes that share server ports, allowing you to take advantage of multi-core systems to handle load. This module significantly improves performance for CPU-intensive applications by distributing workloads across available cores.

## Key Features

- **Load Balancing**: Automatically distributes incoming connections across worker processes
- **Zero Downtime Restarts**: Allows graceful worker replacement without service interruption
- **IPC Communication**: Enables message passing between master and worker processes
- **Worker Management**: Provides tools for monitoring and managing worker processes
- **State Sharing**: Facilitates sharing state between processes (with limitations)

## Core Concepts

### Master and Worker Processes

- **Master Process**: The main Node.js process that spawns worker processes
- **Worker Processes**: Child processes that share the same server port

### Load Distribution Models

- **Round-Robin** (default on all platforms except Windows)
- **Second Connection Distribution** (Windows)
- **Custom** (configurable via third-party modules)

## Basic Example

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

const numCPUs = cpus().length;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        // Replace the dead worker
        cluster.fork();
    });
} else {
    // Workers share the HTTP server
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Hello from Worker ${process.pid}\n`);
    }).listen(8000);

    console.log(`Worker ${process.pid} started`);
}
```

## Advanced Usage

### Worker Communication

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = cpus().length;
    const workers = [];

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        workers.push(worker);

        // Listen for messages from worker
        worker.on("message", (message) => {
            console.log(`Master received: ${JSON.stringify(message)} from worker ${worker.id}`);

            // Broadcast to all workers
            for (const w of workers) {
                w.send({ from: "master", to: "all-workers", data: message.data });
            }
        });
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
        console.log("Starting a new worker");
        const newWorker = cluster.fork();
        workers.push(newWorker);
    });
} else {
    // Workers can share any TCP connection
    http.createServer((req, res) => {
        // Send message to master
        process.send({
            from: `worker-${cluster.worker.id}`,
            to: "master",
            data: {
                url: req.url,
                method: req.method,
                timestamp: Date.now(),
            },
        });

        res.writeHead(200);
        res.end(`Worker ${process.pid} handled request\n`);
    }).listen(8000);

    // Listen for messages from master
    process.on("message", (message) => {
        console.log(`Worker ${cluster.worker.id} received: ${JSON.stringify(message)}`);
    });

    console.log(`Worker ${process.pid} started`);
}
```

### Zero Downtime Restart

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";
import fs from "fs";

const numCPUs = cpus().length;

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Track worker processes
    const workers = {};

    // Helper function for spawning workers
    const spawn = (i) => {
        workers[i] = cluster.fork();

        // Setup restart on exit
        workers[i].on("exit", (code, signal) => {
            console.log(`Worker ${i} died with code: ${code} and signal: ${signal}`);
            console.log("Restarting worker");
            spawn(i);
        });
    };

    // Spawn workers initially
    for (let i = 0; i < numCPUs; i++) {
        spawn(i);
    }

    // Handle graceful restart
    const restartWorkers = () => {
        let i = 0;

        // Recursive function to restart each worker
        const restartWorker = () => {
            if (i >= Object.keys(workers).length) {
                console.log("All workers have been restarted");
                return;
            }

            const worker = workers[i];
            console.log(`Restarting worker ${i}`);

            // Disconnect from the master
            worker.disconnect();

            // Wait for disconnect before forking a new worker
            worker.on("disconnect", () => {
                // Create a new worker
                const newWorker = cluster.fork();

                // Replace the old worker reference
                workers[i] = newWorker;

                // When the new worker is listening, move to the next worker
                newWorker.on("listening", () => {
                    console.log(`Worker ${i} has been replaced`);
                    i++;
                    restartWorker();
                });
            });
        };

        restartWorker();
    };

    // Listen for SIGUSR2 for zero-downtime restart
    process.on("SIGUSR2", () => {
        console.log("Received SIGUSR2, restarting workers...");
        restartWorkers();
    });

    // Handle app termination
    process.on("SIGTERM", () => {
        console.log("Received SIGTERM, shutting down...");
        for (const id in workers) {
            workers[id].kill();
        }
        process.exit(0);
    });
} else {
    // Workers share the HTTP server
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Hello from Worker ${process.pid}, version 1.0\n`);
    }).listen(8000);

    console.log(`Worker ${process.pid} started`);
}
```

### Worker-Specific Tasks

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = cpus().length;

    // Fork regular web server workers
    for (let i = 0; i < numCPUs - 1; i++) {
        const worker = cluster.fork({ WORKER_TYPE: "web" });
        console.log(`Started web worker ${worker.id}`);
    }

    // Fork a special worker for background tasks
    const backgroundWorker = cluster.fork({ WORKER_TYPE: "background" });
    console.log(`Started background worker ${backgroundWorker.id}`);

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);

        // Get the worker type from environment
        const workerType = worker.process.env.WORKER_TYPE;

        // Restart the appropriate type of worker
        const newWorker = cluster.fork({ WORKER_TYPE: workerType });
        console.log(`Started new ${workerType} worker ${newWorker.id}`);
    });
} else {
    if (process.env.WORKER_TYPE === "web") {
        // Web server workers
        http.createServer((req, res) => {
            res.writeHead(200);
            res.end(`Hello from Web Worker ${process.pid}\n`);
        }).listen(8000);

        console.log(`Web worker ${process.pid} started`);
    } else {
        // Background worker
        console.log(`Background worker ${process.pid} started`);

        // Perform regular background tasks
        setInterval(() => {
            console.log(`Background worker ${process.pid} running task at ${new Date().toISOString()}`);
            // e.g., clean up database, send emails, process queue, etc.
        }, 5000);
    }
}
```

### Shared State with Redis

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";
import Redis from "ioredis"; // You'll need to install this: npm install ioredis

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = cpus().length;

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    // Create Redis client for shared state
    const redis = new Redis({
        host: "localhost",
        port: 6379,
        // Other Redis configuration options
    });

    // Workers share HTTP server
    http.createServer(async (req, res) => {
        if (req.url === "/counter") {
            // Increment a shared counter in Redis
            const count = await redis.incr("visit_counter");
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(
                JSON.stringify({
                    worker: process.pid,
                    counter: count,
                })
            );
        } else {
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(`Hello from Worker ${process.pid}\n`);
        }
    }).listen(8000);

    console.log(`Worker ${process.pid} started`);

    // Cleanup Redis connection on worker exit
    process.on("exit", () => {
        console.log(`Worker ${process.pid} is shutting down, closing Redis connection`);
        redis.disconnect();
    });
}
```

## Load Balancing Strategies

### Default Round-Robin

Node.js cluster module uses a round-robin approach by default on most platforms (except Windows):

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = cpus().length;

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);
        cluster.fork();
    });
} else {
    // Workers share HTTP server
    http.createServer((req, res) => {
        // Simulate CPU work
        const start = Date.now();
        while (Date.now() - start < 100) {
            // Empty loop to simulate CPU work
        }

        res.writeHead(200);
        res.end(`Hello from Worker ${process.pid}\n`);
    }).listen(8000);

    console.log(`Worker ${process.pid} started`);
}
```

### Custom Load Balancing (Performance-Based)

For more advanced scenarios, you may want to implement custom load balancing:

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = cpus().length;
    const workers = [];
    const workerLoads = {};

    // Disable automatic round-robin
    cluster.schedulingPolicy = cluster.SCHED_NONE;

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        workers.push(worker);
        workerLoads[worker.id] = 0;

        worker.on("message", (message) => {
            if (message.type === "load_update") {
                workerLoads[worker.id] = message.load;
            }
        });
    }

    // Create a server to distribute connections
    const server = http.createServer((req, res) => {
        // Find the worker with the lowest load
        let minLoad = Infinity;
        let targetWorker = null;

        for (const worker of workers) {
            const load = workerLoads[worker.id];
            if (load < minLoad) {
                minLoad = load;
                targetWorker = worker;
            }
        }

        // Increment the load for the selected worker
        workerLoads[targetWorker.id]++;

        // Forward the connection to the selected worker
        targetWorker.send("connection", req.socket);
        req.socket.resume();
    });

    server.listen(8000);

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died`);

        // Remove the worker from our lists
        const index = workers.indexOf(worker);
        if (index !== -1) {
            workers.splice(index, 1);
        }
        delete workerLoads[worker.id];

        // Fork a new worker
        const newWorker = cluster.fork();
        workers.push(newWorker);
        workerLoads[newWorker.id] = 0;

        newWorker.on("message", (message) => {
            if (message.type === "load_update") {
                workerLoads[newWorker.id] = message.load;
            }
        });
    });
} else {
    // Workers don't create a server, but handle connections sent from the master
    const server = http.createServer((req, res) => {
        // Track active connections
        cluster.worker.activeConnections = (cluster.worker.activeConnections || 0) + 1;

        // Simulate varying processing times
        const processingTime = Math.floor(Math.random() * 200) + 50;
        setTimeout(() => {
            res.writeHead(200);
            res.end(`Hello from Worker ${process.pid}, processed in ${processingTime}ms\n`);

            // Update connection count and notify master of load
            cluster.worker.activeConnections--;
            process.send({
                type: "load_update",
                load: cluster.worker.activeConnections,
            });
        }, processingTime);
    });

    // Listen for connections forwarded by the master
    process.on("message", (message, connection) => {
        if (message === "connection") {
            // Emulate a connection event on the server
            connection.server = server;
            server.emit("connection", connection);
        }
    });

    console.log(`Worker ${process.pid} started`);

    // Regularly update the master about our load
    setInterval(() => {
        process.send({
            type: "load_update",
            load: cluster.worker.activeConnections || 0,
        });
    }, 1000);
}
```

## Monitoring and Debugging

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure logging
const logDir = path.join(__dirname, "logs");

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    // Ensure log directory exists
    fs.mkdir(logDir, { recursive: true }).catch(console.error);

    const numCPUs = cpus().length;
    const workers = {};

    // Track stats
    const stats = {
        totalRequests: 0,
        workerRequests: {},
        restarts: 0,
        startTime: Date.now(),
    };

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        const worker = cluster.fork();
        workers[worker.id] = {
            process: worker,
            id: worker.id,
            pid: worker.process.pid,
            startTime: Date.now(),
            restarts: 0,
        };
        stats.workerRequests[worker.id] = 0;

        console.log(`Worker ${worker.process.pid} started (ID: ${worker.id})`);
    }

    // Handle worker exit
    cluster.on("exit", (worker, code, signal) => {
        const workerInfo = workers[worker.id];
        console.log(`Worker ${workerInfo.pid} died with code: ${code} and signal: ${signal}`);

        // Log the event
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} - Worker ${workerInfo.pid} (ID: ${worker.id}) died after ${formatUptime(Date.now() - workerInfo.startTime)}. Code: ${code}, Signal: ${signal}\n`;

        fs.appendFile(path.join(logDir, "cluster.log"), logEntry).catch(console.error);

        // Spawn a new worker
        const newWorker = cluster.fork();
        stats.restarts++;

        // Update workers list
        delete workers[worker.id];
        workers[newWorker.id] = {
            process: newWorker,
            id: newWorker.id,
            pid: newWorker.process.pid,
            startTime: Date.now(),
            restarts: ++workerInfo.restarts,
        };
        stats.workerRequests[newWorker.id] = 0;

        console.log(`Restarted worker with PID ${newWorker.process.pid} (ID: ${newWorker.id})`);
    });

    // Setup status endpoint
    http.createServer((req, res) => {
        if (req.url === "/status") {
            // Calculate cluster uptime
            const uptime = formatUptime(Date.now() - stats.startTime);

            // Create status report
            const status = {
                master: {
                    pid: process.pid,
                    uptime,
                    platform: process.platform,
                    nodeVersion: process.version,
                    cpus: cpus().length,
                },
                workers: Object.values(workers).map((w) => ({
                    id: w.id,
                    pid: w.pid,
                    uptime: formatUptime(Date.now() - w.startTime),
                    restarts: w.restarts,
                    requests: stats.workerRequests[w.id] || 0,
                })),
                stats: {
                    totalWorkers: Object.keys(workers).length,
                    totalRequests: stats.totalRequests,
                    totalRestarts: stats.restarts,
                },
            };

            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify(status, null, 2));
        } else {
            res.writeHead(404);
            res.end("Not found");
        }
    }).listen(8001);

    console.log("Status server running on port 8001");

    // Listen for messages from workers
    Object.values(cluster.workers).forEach((worker) => {
        worker.on("message", (message) => {
            if (message.type === "request_completed") {
                stats.totalRequests++;
                stats.workerRequests[worker.id] = (stats.workerRequests[worker.id] || 0) + 1;
            }
        });
    });

    // Helper function to format uptime
    function formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
    }
} else {
    // Create a worker-specific log file
    const logFile = path.join(logDir, `worker-${process.pid}.log`);

    // Workers create HTTP server
    const server = http.createServer(async (req, res) => {
        const timestamp = new Date().toISOString();

        try {
            // Log the request
            const logEntry = `${timestamp} - ${req.method} ${req.url}\n`;
            await fs.appendFile(logFile, logEntry);

            // Process request
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(`Hello from Worker ${process.pid}\n`);

            // Notify master
            process.send({ type: "request_completed", timestamp });
        } catch (err) {
            console.error(`Worker ${process.pid} error:`, err);
            res.writeHead(500);
            res.end("Internal Server Error");

            // Log the error
            const errorEntry = `${timestamp} - ERROR: ${err.message}\n${err.stack}\n`;
            fs.appendFile(logFile, errorEntry).catch(console.error);
        }
    });

    server.listen(8000);
    console.log(`Worker ${process.pid} started and listening on port 8000`);

    // Handle uncaught exceptions
    process.on("uncaughtException", async (err) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] Uncaught exception in worker ${process.pid}:`, err);

        // Log the error
        const errorEntry = `${timestamp} - UNCAUGHT EXCEPTION: ${err.message}\n${err.stack}\n`;
        await fs.appendFile(logFile, errorEntry).catch(console.error);

        // Allow time for logging before exiting
        setTimeout(() => {
            process.exit(1);
        }, 1000);
    });
}
```

## Best Practices

### Memory Usage Management

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

const MEMORY_THRESHOLD = 200 * 1024 * 1024; // 200MB

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = Math.min(cpus().length, 4); // Limit to 4 workers max

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Set up periodic checks for worker health
    setInterval(() => {
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            worker.send({ cmd: "memory_check" });
        }
    }, 30000); // Check every 30 seconds

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
        console.log("Starting a new worker");
        cluster.fork();
    });
} else {
    // Workers create HTTP server
    http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Hello from Worker ${process.pid}\n`);
    }).listen(8000);

    console.log(`Worker ${process.pid} started`);

    // Listen for memory check requests
    process.on("message", (msg) => {
        if (msg.cmd === "memory_check") {
            const memoryUsage = process.memoryUsage();

            console.log(`Worker ${process.pid} memory usage: ${Math.round(memoryUsage.rss / 1024 / 1024)}MB`);

            // If memory usage exceeds threshold, gracefully exit
            if (memoryUsage.rss > MEMORY_THRESHOLD) {
                console.log(
                    `Worker ${process.pid} is using too much memory (${Math.round(memoryUsage.rss / 1024 / 1024)}MB). Restarting...`
                );

                // Close server to stop accepting new connections
                server.close(() => {
                    console.log(`Worker ${process.pid} closed all connections. Exiting...`);
                    process.exit(0);
                });

                // Force exit after 5 seconds if connections don't close
                setTimeout(() => {
                    console.log(`Worker ${process.pid} could not close connections in time. Forcing exit.`);
                    process.exit(1);
                }, 5000);
            }
        }
    });

    // Catch memory errors
    process.on("memoryUsage", () => {
        console.error(`Worker ${process.pid} out of memory!`);
        process.exit(1);
    });
}
```

### Graceful Shutdown

```javascript
import cluster from "cluster";
import http from "http";
import { cpus } from "os";
import process from "process";

if (cluster.isPrimary) {
    console.log(`Master ${process.pid} is running`);

    const numCPUs = cpus().length;

    // Fork workers
    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    // Track workers that have disconnected
    const disconnectedWorkers = new Set();

    cluster.on("exit", (worker, code, signal) => {
        console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);

        // Remove from tracking set
        disconnectedWorkers.delete(worker.id);

        // Only fork a new worker if this wasn't a deliberate shutdown
        if (!worker.exitedAfterDisconnect) {
            console.log("Starting a new worker");
            cluster.fork();
        }
    });

    // Handle graceful shutdown for the entire cluster
    const gracefulShutdown = () => {
        console.log("Master received shutdown signal");

        // Set a timeout for the graceful shutdown
        const forceShutdownTimeout = setTimeout(() => {
            console.log("Could not close connections in time, forcefully shutting down");
            process.exit(1);
        }, 30000); // 30 seconds timeout

        // Count of workers pending disconnect
        let workersRunning = Object.keys(cluster.workers).length;

        // If no workers, exit immediately
        if (workersRunning === 0) {
            clearTimeout(forceShutdownTimeout);
            process.exit(0);
            return;
        }

        // Track successful worker disconnections
        cluster.on("disconnect", (worker) => {
            console.log(`Worker ${worker.process.pid} disconnected`);
            disconnectedWorkers.add(worker.id);
        });

        // Track worker exits during shutdown
        cluster.on("exit", (worker) => {
            workersRunning--;
            console.log(`Worker ${worker.process.pid} exited, ${workersRunning} remaining`);

            if (workersRunning === 0) {
                clearTimeout(forceShutdownTimeout);
                console.log("All workers have exited, shutting down master");
                process.exit(0);
            }
        });

        // Signal all workers to disconnect
        for (const id in cluster.workers) {
            const worker = cluster.workers[id];
            worker.send("shutdown");

            // Set a timeout for this specific worker
            setTimeout(() => {
                if (!disconnectedWorkers.has(worker.id)) {
                    console.log(`Worker ${worker.process.pid} did not disconnect, killing it`);
                    worker.kill("SIGTERM");
                }
            }, 15000); // 15 seconds timeout per worker
        }
    };

    // Listen for termination signals
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
} else {
    // Create a server
    const server = http.createServer((req, res) => {
        res.writeHead(200);
        res.end(`Hello from Worker ${process.pid}\n`);
    });

    // Store active connections
    const connections = new Map();

    // Track connections
    server.on("connection", (conn) => {
        const key = `${conn.remoteAddress}:${conn.remotePort}`;
        connections.set(key, conn);

        conn.on("close", () => {
            connections.delete(key);
        });
    });

    // Start listening
    server.listen(8000, () => {
        console.log(`Worker ${process.pid} started and listening on port 8000`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = () => {
        console.log(`Worker ${process.pid} received shutdown signal`);

        // Stop accepting new connections
        server.close(() => {
            console.log(`Worker ${process.pid} closed server`);
            process.exit(0);
        });

        // Set a timeout to force close if needed
        setTimeout(() => {
            console.log(`Worker ${process.pid} could not close all connections in time, forcing exit`);
            process.exit(1);
        }, 10000); // 10 seconds timeout

        // Close idle connections
        for (const [key, conn] of connections) {
            // Check if the connection is idle
            if (conn.writableEnded) {
                connections.delete(key);
                conn.destroy();
            }
        }
    };

    // Listen for shutdown message from master
    process.on("message", (msg) => {
        if (msg === "shutdown") {
            gracefulShutdown();
        }
    });

    // Direct signal handling as backup
    process.on("SIGTERM", gracefulShutdown);
    process.on("SIGINT", gracefulShutdown);
}
```

### Using PM2 with Cluster Mode

For production environments, it's often better to use process managers like PM2:

```javascript
// app.js
import http from "http";
import process from "process";

const server = http.createServer((req, res) => {
    res.writeHead(200);
    res.end(`Hello from Worker ${process.pid}\n`);
});

server.listen(8000, () => {
    console.log(`Worker ${process.pid} started and listening on port 8000`);
});

// Handle graceful shutdown
process.on("SIGTERM", () => {
    console.log(`Worker ${process.pid} received SIGTERM`);
    server.close(() => {
        console.log(`Worker ${process.pid} closed all connections`);
        process.exit(0);
    });

    // Force close after timeout
    setTimeout(() => {
        console.log(`Worker ${process.pid} could not close connections in time, forcing exit`);
        process.exit(1);
    }, 10000);
});
```

PM2 ecosystem.config.js:

```javascript
module.exports = {
    apps: [
        {
            name: "app",
            script: "app.js",
            instances: "max", // Use all available CPUs
            exec_mode: "cluster",
            watch: false,
            max_memory_restart: "300M",
            env: {
                NODE_ENV: "production",
            },
        },
    ],
};
```

## Common Pitfalls

1. **Shared State**: Workers do not share memory, so you need external solutions for shared state
2. **Worker Deaths**: Workers can die unexpectedly, always handle restart scenarios
3. **Socket Handling**: Be careful with persistent connections when workers restart
4. **Memory Leaks**: Each worker needs its own memory management
5. **Sticky Sessions**: For stateful applications, implement sticky sessions
6. **Debugging Complexity**: Debugging clustered applications can be challenging
7. **Startup Order**: Ensure proper initialization sequence for complex applications

## Security Considerations

1. **Process Isolation**: Cluster provides process isolation, but can't prevent application-level vulnerabilities
2. **Privilege Separation**: Consider running workers with minimal privileges
3. **Resource Constraints**: Set limits on memory and CPU usage for workers
4. **Secure IPC**: Be careful what data is passed between master and workers

## Resources

- [Node.js Cluster Documentation](https://nodejs.org/api/cluster.html)
- [PM2 Process Manager](https://pm2.keymetrics.io/)
- [Node.js Design Patterns for Production](https://www.joyent.com/node-js/production)
