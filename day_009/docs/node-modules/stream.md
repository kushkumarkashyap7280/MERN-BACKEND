# Stream Module

The `stream` module provides an abstraction for working with streaming data in Node.js. Streams enable efficient processing of data in chunks rather than loading entire files into memory, making them essential for handling large files, network communications, and I/O operations.

## Key Features

- **Memory Efficiency**: Process data in chunks instead of loading everything into memory
- **Time Efficiency**: Start processing data as soon as chunks are available
- **Composability**: Pipe streams together to create powerful data pipelines
- **Event-Based API**: Built on the EventEmitter pattern
- **Backpressure Handling**: Automatic flow control for fast producers and slow consumers

## Types of Streams

| Stream Type | Description                           | Common Methods                            | Examples                   |
| ----------- | ------------------------------------- | ----------------------------------------- | -------------------------- |
| Readable    | Sources data for reading              | `pipe()`, `read()`, `resume()`, `pause()` | HTTP responses, file reads |
| Writable    | Destinations for data                 | `write()`, `end()`                        | HTTP requests, file writes |
| Duplex      | Both readable and writable            | (Combined from both)                      | TCP sockets                |
| Transform   | Transforms data while reading/writing | `transform()`                             | Compression, encryption    |

## Stream Modes

Streams operate in one of two modes:

1. **Binary Mode**: Default mode working with Buffer/Uint8Array objects
2. **Object Mode**: Working with JavaScript objects (requires explicit configuration)

## Basic Examples

### Reading from a File Stream

```javascript
import fs from "fs";

// Create a readable stream
const readStream = fs.createReadStream("input.txt", {
    encoding: "utf8",
    highWaterMark: 64 * 1024, // 64KB chunks
});

// Handle events
readStream.on("data", (chunk) => {
    console.log(`Received ${chunk.length} bytes of data`);
    // Process chunk here
});

readStream.on("end", () => {
    console.log("Finished reading file");
});

readStream.on("error", (err) => {
    console.error("Error reading file:", err);
});
```

### Writing to a File Stream

```javascript
import fs from "fs";

// Create a writable stream
const writeStream = fs.createWriteStream("output.txt");

// Write data
writeStream.write("Hello, ");
writeStream.write("world!");
writeStream.end("\nEnd of file");

// Handle events
writeStream.on("finish", () => {
    console.log("All data has been written");
});

writeStream.on("error", (err) => {
    console.error("Error writing to file:", err);
});
```

### Piping Streams

```javascript
import fs from "fs";
import zlib from "zlib";

// Create streams
const readStream = fs.createReadStream("input.txt");
const gzipStream = zlib.createGzip();
const writeStream = fs.createWriteStream("input.txt.gz");

// Pipe data: input -> gzip -> output
readStream.pipe(gzipStream).pipe(writeStream);

writeStream.on("finish", () => {
    console.log("File successfully compressed");
});
```

## Creating Custom Streams

### Custom Readable Stream

```javascript
import { Readable } from "stream";

class CounterStream extends Readable {
    constructor(max) {
        super();
        this.max = max;
        this.counter = 0;
    }

    _read() {
        this.counter++;

        if (this.counter <= this.max) {
            // Convert number to string for binary mode stream
            const data = `${this.counter}\n`;
            this.push(data);
        } else {
            // Signal the end of the stream
            this.push(null);
        }
    }
}

// Usage
const counterStream = new CounterStream(5);
counterStream.pipe(process.stdout);
```

### Custom Writable Stream

```javascript
import { Writable } from "stream";

class ConsoleLogStream extends Writable {
    constructor(options) {
        super(options);
    }

    _write(chunk, encoding, callback) {
        // Process the chunk
        console.log(`[${new Date().toISOString()}] ${chunk.toString()}`);

        // Signal that we're ready for the next chunk
        callback();
    }
}

// Usage
const logger = new ConsoleLogStream();
logger.write("This is a log message");
logger.end("End of logging");
```

### Custom Transform Stream

```javascript
import { Transform } from "stream";

class UppercaseTransform extends Transform {
    constructor(options) {
        super(options);
    }

    _transform(chunk, encoding, callback) {
        // Transform chunk to uppercase
        const upperChunk = chunk.toString().toUpperCase();

        // Push the transformed data
        this.push(upperChunk);

        // Signal that transformation is done
        callback();
    }
}

// Usage
import fs from "fs";

const readStream = fs.createReadStream("input.txt");
const uppercaseStream = new UppercaseTransform();
const writeStream = fs.createWriteStream("uppercase.txt");

readStream.pipe(uppercaseStream).pipe(writeStream);
```

## Stream Events

### Common Events for All Streams

| Event   | Description                       |
| ------- | --------------------------------- |
| `error` | Emitted when an error occurs      |
| `close` | Emitted when the stream is closed |

### Readable Stream Events

| Event      | Description                                      |
| ---------- | ------------------------------------------------ |
| `data`     | Emitted when data is available to be read        |
| `end`      | Emitted when there's no more data to read        |
| `readable` | Emitted when data is available to be read or EOF |

### Writable Stream Events

| Event    | Description                                               |
| -------- | --------------------------------------------------------- |
| `drain`  | Emitted when the stream is ready to receive more data     |
| `finish` | Emitted when all data has been processed                  |
| `pipe`   | Emitted when the stream is piped to by a readable stream  |
| `unpipe` | Emitted when a readable stream unpiped from this writable |

## Advanced Features

### Backpressure Handling

```javascript
import fs from "fs";

const readStream = fs.createReadStream("large-file.txt");
const writeStream = fs.createWriteStream("output.txt");

readStream.on("data", (chunk) => {
    // Check if buffer is full
    const canContinue = writeStream.write(chunk);

    if (!canContinue) {
        console.log("Backpressure - pausing reading");
        // Pause the readable stream
        readStream.pause();
    }
});

writeStream.on("drain", () => {
    console.log("Buffer emptied - resuming reading");
    // Resume the readable stream
    readStream.resume();
});

readStream.on("end", () => {
    writeStream.end();
});
```

### Object Mode Streams

```javascript
import { Transform } from "stream";

// Create a transform stream in object mode
const jsonParser = new Transform({
    readableObjectMode: true,
    writableObjectMode: false,

    transform(chunk, encoding, callback) {
        try {
            // Convert Buffer/string to JavaScript object
            const parsedData = JSON.parse(chunk.toString());
            this.push(parsedData);
            callback();
        } catch (err) {
            callback(err);
        }
    },
});

// Usage with pipeline
import { pipeline } from "stream/promises";
import fs from "fs";

async function processJsonFile() {
    try {
        await pipeline(
            fs.createReadStream("data.json"),
            jsonParser,
            new Transform({
                objectMode: true,
                transform(object, encoding, callback) {
                    // Process the JavaScript object
                    object.processed = true;
                    object.timestamp = new Date().toISOString();
                    this.push(JSON.stringify(object, null, 2) + "\n");
                    callback();
                },
            }),
            fs.createWriteStream("processed-data.json")
        );
        console.log("Processing complete");
    } catch (err) {
        console.error("Pipeline failed", err);
    }
}

processJsonFile();
```

### Async Iteration with Streams

```javascript
import fs from "fs";
import readline from "readline";

async function processLineByLine() {
    // Create readline interface
    const fileStream = fs.createReadStream("data.txt");
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity,
    });

    // Use for-await-of loop to process lines
    let lineCount = 0;
    for await (const line of rl) {
        lineCount++;
        console.log(`Line ${lineCount}: ${line}`);
    }

    console.log(`File contained ${lineCount} lines.`);
}

processLineByLine();
```

### Using stream/promises API

```javascript
import { pipeline } from "stream/promises";
import fs from "fs";
import zlib from "zlib";

async function compressFile(input, output) {
    try {
        await pipeline(fs.createReadStream(input), zlib.createGzip(), fs.createWriteStream(output));
        console.log("Compression completed successfully");
    } catch (err) {
        console.error("Pipeline failed", err);
    }
}

compressFile("input.txt", "input.txt.gz");
```

## Best Practices

1. **Always handle errors**: Add error event listeners to all streams
2. **End writable streams**: Always call `end()` when done writing
3. **Manage backpressure**: Pay attention to the return value of `write()`
4. **Use pipeline**: Prefer `stream.pipeline()` for proper error handling and cleanup
5. **Set encoding**: For text processing, set encoding rather than converting buffers
6. **Choose appropriate chunk size**: Set `highWaterMark` based on your use case
7. **Memory management**: Be mindful of keeping references to large chunks
8. **Avoid sync operations**: Don't use synchronous methods in stream callbacks

## Common Pitfalls

- **Memory leaks**: Not properly ending streams or handling errors
- **Backpressure ignorance**: Not respecting the return value of `write()`
- **Error propagation**: Errors not properly propagated through pipelines
- **Data loss**: Losing data when not properly handling stream events
- **Premature end**: Ending a stream before all data is processed
- **Buffer encoding**: Not setting or handling encoding correctly

## Practical Example: CSV Processor

```javascript
import fs from "fs";
import { Transform } from "stream";
import { parse } from "csv-parse";
import { stringify } from "csv-stringify";
import { pipeline } from "stream/promises";

async function processCSV(inputFile, outputFile) {
    // Create a transform stream to process each row
    const processRow = new Transform({
        objectMode: true,
        transform(row, encoding, callback) {
            // Example transformation: Calculate a new column
            row.total = Number(row.quantity) * Number(row.price);

            // Filter rows if needed
            if (row.total > 100) {
                this.push(row);
            }

            callback();
        },
    });

    try {
        await pipeline(
            fs.createReadStream(inputFile),
            parse({
                columns: true,
                skip_empty_lines: true,
            }),
            processRow,
            stringify({
                header: true,
            }),
            fs.createWriteStream(outputFile)
        );

        console.log(`Processed CSV from ${inputFile} to ${outputFile}`);
    } catch (err) {
        console.error("Error processing CSV:", err);
    }
}

// Usage
processCSV("sales.csv", "high-value-sales.csv");
```

## Resources

- [Node.js Stream Documentation](https://nodejs.org/api/stream.html)
- [Stream Handbook](https://github.com/substack/stream-handbook)
- [Node.js Streams: Everything you need to know](https://www.freecodecamp.org/news/node-js-streams-everything-you-need-to-know-c9141306be93/)
