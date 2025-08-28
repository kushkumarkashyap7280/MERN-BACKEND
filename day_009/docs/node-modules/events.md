# Events Module

The `events` module is fundamental to Node.js's asynchronous event-driven architecture. It provides the `EventEmitter` class, which is the foundation for many Node.js core components.

## Key Features

- **Event-Driven Programming**: Enables asynchronous event-based communication
- **Observer Pattern**: Implements the observer design pattern
- **Non-Blocking**: Works with Node.js's non-blocking I/O model
- **Custom Events**: Create and handle custom application events
- **Built-in Integration**: Used by many Node.js core modules internally

## EventEmitter Class

The core of the events module is the `EventEmitter` class, which provides methods for:

| Method                       | Description                              |
| ---------------------------- | ---------------------------------------- |
| `on()` / `addListener()`     | Register a listener for a named event    |
| `once()`                     | Register a one-time listener             |
| `emit()`                     | Trigger an event with optional arguments |
| `off()` / `removeListener()` | Remove a specific listener               |
| `removeAllListeners()`       | Remove all listeners for an event        |
| `setMaxListeners()`          | Modify max listeners (default is 10)     |
| `listeners()`                | Get array of listeners for an event      |
| `rawListeners()`             | Get array of listeners with wrappers     |
| `listenerCount()`            | Get count of listeners for an event      |
| `eventNames()`               | Get array of event names with listeners  |
| `prependListener()`          | Add listener to beginning of array       |
| `prependOnceListener()`      | Add one-time listener to beginning       |

## Basic Examples

### Creating an EventEmitter

```javascript
import { EventEmitter } from "events";

// Create a new EventEmitter instance
const myEmitter = new EventEmitter();

// Register an event listener
myEmitter.on("event", function (a, b) {
    console.log("Event occurred with arguments:", a, b);
});

// Emit the event
myEmitter.emit("event", "arg1", "arg2");
// Output: Event occurred with arguments: arg1 arg2
```

### One-time Event Listeners

```javascript
import { EventEmitter } from "events";

const myEmitter = new EventEmitter();

// Register a one-time listener
myEmitter.once("singleEvent", () => {
    console.log("This will be called only once");
});

// Emit the event twice
myEmitter.emit("singleEvent"); // Logs: This will be called only once
myEmitter.emit("singleEvent"); // No output - listener already removed
```

### Error Events

```javascript
import { EventEmitter } from "events";

const myEmitter = new EventEmitter();

// It's important to have an error listener
// otherwise Node.js will crash if an 'error' event is emitted
myEmitter.on("error", (err) => {
    console.error("An error occurred:", err.message);
});

// Simulate an error
myEmitter.emit("error", new Error("Something went wrong"));
```

## Creating a Custom EventEmitter Class

```javascript
import { EventEmitter } from "events";

// Create a custom class that extends EventEmitter
class MyStream extends EventEmitter {
    constructor() {
        super();
    }

    write(data) {
        this.emit("data", data);
    }

    end() {
        this.emit("end");
    }
}

// Use the custom EventEmitter
const stream = new MyStream();

// Add listeners
stream.on("data", (data) => {
    console.log("Received data:", data);
});

stream.on("end", () => {
    console.log("Stream ended");
});

// Trigger events
stream.write("Hello World");
stream.end();
```

## Asynchronous vs. Synchronous Events

By default, EventEmitter calls listeners synchronously:

```javascript
import { EventEmitter } from "events";

const myEmitter = new EventEmitter();

myEmitter.on("event", () => {
    console.log("Listener executed");
});

console.log("Before emit");
myEmitter.emit("event");
console.log("After emit");

// Output:
// Before emit
// Listener executed
// After emit
```

For asynchronous execution, you can use `setImmediate()` or `process.nextTick()`:

```javascript
myEmitter.on("event", () => {
    setImmediate(() => {
        console.log("Asynchronous listener executed");
    });
});

console.log("Before emit");
myEmitter.emit("event");
console.log("After emit");

// Output:
// Before emit
// After emit
// Asynchronous listener executed
```

## Memory Leaks and MaxListeners

By default, EventEmitter warns if more than 10 listeners are added to a single event:

```javascript
const myEmitter = new EventEmitter();

// Increase limit if needed (use cautiously)
myEmitter.setMaxListeners(20);

// Check current limit
console.log(myEmitter.getMaxListeners()); // 20
```

## Best Practices

1. **Always handle errors**: Always add a listener for the 'error' event
2. **Memory management**: Remove listeners when no longer needed
3. **Proper naming**: Use descriptive event names
4. **Documentation**: Document events and their expected arguments
5. **Be cautious with setMaxListeners**: Don't increase unnecessarily
6. **Use appropriate scope**: Consider using symbols for private events
7. **Avoid excessive listeners**: Too many listeners can cause performance issues

## Common Pitfalls

- **Memory leaks**: Not removing listeners can prevent garbage collection
- **Missing error handlers**: Unhandled 'error' events crash Node.js
- **Confusing this binding**: Arrow functions change `this` context
- **Event name typos**: Misspelled event names don't trigger errors
- **Order-dependent code**: Listeners are called in registration order
- **Synchronous execution**: Events don't "wait" for async operations by default

## Real-world Example: Custom Logger

```javascript
import { EventEmitter } from "events";
import fs from "fs/promises";

class Logger extends EventEmitter {
    constructor() {
        super();
        this.logs = [];

        // Set up listeners
        this.on("log", (message) => {
            const timestamp = new Date().toISOString();
            const logEntry = `${timestamp}: ${message}`;
            this.logs.push(logEntry);
            console.log(logEntry);
        });

        this.on("error", (err) => {
            const timestamp = new Date().toISOString();
            const errorEntry = `${timestamp} ERROR: ${err.message}`;
            this.logs.push(errorEntry);
            console.error(errorEntry);
        });
    }

    log(message) {
        this.emit("log", message);
    }

    async saveToFile(filePath) {
        try {
            await fs.writeFile(filePath, this.logs.join("\n"));
            this.emit("log", `Logs saved to ${filePath}`);
            return true;
        } catch (err) {
            this.emit("error", err);
            return false;
        }
    }
}

// Usage
const logger = new Logger();
logger.log("Application started");
logger.log("Processing data");

// Later in the application
logger.saveToFile("./app.log").then((success) => {
    if (success) {
        logger.log("Log file created successfully");
    }
});
```

## Resources

- [Node.js Events Documentation](https://nodejs.org/api/events.html)
- [Understanding EventEmitter in Node.js](https://nodejs.dev/learn/the-nodejs-event-emitter)
- [Observer Pattern in JavaScript](https://www.patterns.dev/posts/observer-pattern/)
