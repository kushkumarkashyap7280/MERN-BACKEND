# Zlib Module

The `zlib` module in Node.js provides compression and decompression functionality implemented using Gzip, Deflate/Inflate, and Brotli algorithms. This module is particularly useful for optimizing network transfers and reducing storage requirements.

## Key Features

- **Multiple Compression Algorithms**: Support for Gzip, Deflate/Inflate, and Brotli
- **Streaming Interface**: Process data in chunks without loading everything into memory
- **Compression Levels**: Configure the balance between speed and compression ratio
- **Synchronous and Asynchronous APIs**: Support for both operation modes
- **Buffer and Stream Handling**: Work with both data types efficiently

## Core Concepts

### Compression Algorithms

- **Gzip**: General-purpose compression, good balance between speed and compression ratio
- **Deflate**: The compression algorithm used within the zlib format
- **Brotli**: Modern compression algorithm with superior compression ratios (particularly for text)

### Compression Levels

- Compression levels typically range from 0 (no compression) to 9 (maximum compression)
- Higher levels provide better compression but are slower and use more CPU
- Lower levels are faster but provide less compression

### Class Hierarchy

- **Compressors**: `Gzip`, `Deflate`, `BrotliCompress`
- **Decompressors**: `Gunzip`, `Inflate`, `BrotliDecompress`
- All classes inherit from streams, making them compatible with Node.js streams

## Basic Examples

### Compressing and Decompressing Buffers

```javascript
import { gzip, gunzip } from "zlib";
import { promisify } from "util";

// Promisify the callback-based APIs
const gzipPromise = promisify(gzip);
const gunzipPromise = promisify(gunzip);

async function compressAndDecompress() {
    try {
        // Sample data to compress
        const input = Buffer.from("This is some data that will be compressed and then decompressed.");

        console.log(`Original size: ${input.length} bytes`);

        // Compress the data
        const compressed = await gzipPromise(input);
        console.log(`Compressed size: ${compressed.length} bytes`);
        console.log(`Compression ratio: ${((compressed.length / input.length) * 100).toFixed(2)}%`);

        // Decompress the data
        const decompressed = await gunzipPromise(compressed);
        console.log(`Decompressed size: ${decompressed.length} bytes`);

        // Verify the data matches the original
        console.log("Data matches original:", decompressed.toString() === input.toString());
    } catch (error) {
        console.error("Error during compression/decompression:", error);
    }
}

compressAndDecompress();
```

### Streaming Compression

```javascript
import { createGzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelinePromise = promisify(pipeline);

async function compressFile(inputPath, outputPath) {
    try {
        // Create read and write streams
        const source = createReadStream(inputPath);
        const destination = createWriteStream(outputPath);

        // Create a gzip compression stream
        const gzip = createGzip();

        // Pipe the streams together
        await pipelinePromise(source, gzip, destination);

        console.log(`File compressed successfully: ${inputPath} → ${outputPath}`);
    } catch (error) {
        console.error("Error compressing file:", error);
    }
}

// Example usage
compressFile("largefile.txt", "largefile.txt.gz");
```

### Decompressing a File

```javascript
import { createGunzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelinePromise = promisify(pipeline);

async function decompressFile(inputPath, outputPath) {
    try {
        // Create read and write streams
        const source = createReadStream(inputPath);
        const destination = createWriteStream(outputPath);

        // Create a gunzip decompression stream
        const gunzip = createGunzip();

        // Pipe the streams together
        await pipelinePromise(source, gunzip, destination);

        console.log(`File decompressed successfully: ${inputPath} → ${outputPath}`);
    } catch (error) {
        console.error("Error decompressing file:", error);
    }
}

// Example usage
decompressFile("largefile.txt.gz", "largefile.decompressed.txt");
```

## Advanced Usage

### Custom Compression Options

```javascript
import { createGzip, constants } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelinePromise = promisify(pipeline);

async function compressFileWithOptions(inputPath, outputPath, options = {}) {
    try {
        const source = createReadStream(inputPath);
        const destination = createWriteStream(outputPath);

        // Set custom compression options
        const compressionOptions = {
            level: options.level || constants.Z_BEST_COMPRESSION, // Maximum compression
            memLevel: options.memLevel || 9, // Maximum memory for compression
            strategy: options.strategy || constants.Z_DEFAULT_STRATEGY,
            windowBits: options.windowBits || 15,
        };

        const gzip = createGzip(compressionOptions);

        console.log(`Compressing with options: ${JSON.stringify(compressionOptions)}`);

        // Pipe the streams together
        await pipelinePromise(source, gzip, destination);

        console.log(`File compressed successfully: ${inputPath} → ${outputPath}`);
    } catch (error) {
        console.error("Error compressing file:", error);
    }
}

// Example usage with custom options
compressFileWithOptions("largefile.txt", "largefile.max-compression.gz", {
    level: constants.Z_BEST_COMPRESSION, // 9 - Maximum compression
    memLevel: 9, // Maximum memory usage for better compression
});

// Example with faster but less effective compression
compressFileWithOptions("largefile.txt", "largefile.fast-compression.gz", {
    level: constants.Z_BEST_SPEED, // 1 - Fastest compression
    memLevel: 4, // Less memory usage
});
```

### Using Brotli Compression

```javascript
import { createBrotliCompress, createBrotliDecompress, constants } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";

const pipelinePromise = promisify(pipeline);

async function compressWithBrotli(inputPath, outputPath, quality = 11) {
    try {
        const source = createReadStream(inputPath);
        const destination = createWriteStream(outputPath);

        // Create a Brotli compression stream with custom quality
        const brotliCompress = createBrotliCompress({
            params: {
                [constants.BROTLI_PARAM_QUALITY]: quality, // 0-11, higher is better compression
                [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT, // Optimize for text
                [constants.BROTLI_PARAM_SIZE_HINT]: fs.statSync(inputPath).size, // Hint about input size
            },
        });

        // Pipe the streams together
        await pipelinePromise(source, brotliCompress, destination);

        console.log(`File compressed with Brotli (quality ${quality}): ${inputPath} → ${outputPath}`);
    } catch (error) {
        console.error("Error compressing file with Brotli:", error);
    }
}

async function decompressWithBrotli(inputPath, outputPath) {
    try {
        const source = createReadStream(inputPath);
        const destination = createWriteStream(outputPath);

        // Create a Brotli decompression stream
        const brotliDecompress = createBrotliDecompress();

        // Pipe the streams together
        await pipelinePromise(source, brotliDecompress, destination);

        console.log(`File decompressed with Brotli: ${inputPath} → ${outputPath}`);
    } catch (error) {
        console.error("Error decompressing file with Brotli:", error);
    }
}

// Example usage
compressWithBrotli("webpage.html", "webpage.html.br", 11); // Maximum quality
decompressWithBrotli("webpage.html.br", "webpage.decompressed.html");
```

### HTTP Compression

```javascript
import http from "http";
import { createGzip, createDeflate, createBrotliCompress } from "zlib";
import { createReadStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pipelinePromise = promisify(pipeline);

// Create HTTP server that serves compressed files
const server = http.createServer(async (req, res) => {
    // Path to the file we want to serve
    const filePath = path.join(__dirname, "public", "large-file.html");

    // Get the client's accepted encodings
    const acceptEncoding = req.headers["accept-encoding"] || "";

    // Set the content type
    res.setHeader("Content-Type", "text/html");

    // Determine the best compression method based on what the client accepts
    let compressor;

    if (acceptEncoding.includes("br")) {
        compressor = createBrotliCompress();
        res.setHeader("Content-Encoding", "br");
    } else if (acceptEncoding.includes("gzip")) {
        compressor = createGzip();
        res.setHeader("Content-Encoding", "gzip");
    } else if (acceptEncoding.includes("deflate")) {
        compressor = createDeflate();
        res.setHeader("Content-Encoding", "deflate");
    }

    try {
        // Create a read stream for the file
        const fileStream = createReadStream(filePath);

        if (compressor) {
            // If compression is supported, pipe through the compressor
            await pipelinePromise(fileStream, compressor, res);
        } else {
            // No compression supported, send uncompressed
            await pipelinePromise(fileStream, res);
        }
    } catch (error) {
        // Handle errors properly
        console.error("Error serving file:", error);

        if (!res.headersSent) {
            res.statusCode = 500;
            res.end("Internal Server Error");
        } else {
            // If headers were already sent, just destroy the response
            res.destroy();
        }
    }
});

// Start the server
server.listen(3000, () => {
    console.log("Server running at http://localhost:3000/");
});
```

### Compression Benchmarks

```javascript
import { gzip, brotliCompress, deflate, constants } from "zlib";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { performance } from "perf_hooks";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Promisify zlib functions
const gzipPromise = promisify(gzip);
const brotliCompressPromise = promisify(brotliCompress);
const deflatePromise = promisify(deflate);

async function runCompressionBenchmark(filePath) {
    try {
        console.log(`Running compression benchmark on ${filePath}`);

        // Read the test file
        const data = await fs.readFile(filePath);
        console.log(`Original size: ${(data.length / 1024).toFixed(2)} KB`);

        // Test different compression methods and levels
        const tests = [
            // Gzip tests
            { name: "gzip (level 1)", fn: () => gzipPromise(data, { level: 1 }) },
            { name: "gzip (level 6, default)", fn: () => gzipPromise(data, { level: 6 }) },
            { name: "gzip (level 9)", fn: () => gzipPromise(data, { level: 9 }) },

            // Deflate tests
            { name: "deflate (level 1)", fn: () => deflatePromise(data, { level: 1 }) },
            { name: "deflate (level 6, default)", fn: () => deflatePromise(data, { level: 6 }) },
            { name: "deflate (level 9)", fn: () => deflatePromise(data, { level: 9 }) },

            // Brotli tests
            {
                name: "brotli (quality 1)",
                fn: () =>
                    brotliCompressPromise(data, {
                        params: { [constants.BROTLI_PARAM_QUALITY]: 1 },
                    }),
            },
            {
                name: "brotli (quality 6)",
                fn: () =>
                    brotliCompressPromise(data, {
                        params: { [constants.BROTLI_PARAM_QUALITY]: 6 },
                    }),
            },
            {
                name: "brotli (quality 11)",
                fn: () =>
                    brotliCompressPromise(data, {
                        params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
                    }),
            },
        ];

        // Results array
        const results = [];

        // Run each test
        for (const test of tests) {
            const startTime = performance.now();
            const compressed = await test.fn();
            const endTime = performance.now();

            const compressionRatio = compressed.length / data.length;
            const timeElapsed = endTime - startTime;

            results.push({
                name: test.name,
                originalSize: data.length,
                compressedSize: compressed.length,
                compressionRatio: compressionRatio,
                compressionPercentage: (1 - compressionRatio) * 100,
                timeElapsed: timeElapsed,
            });

            console.log(`${test.name}:`);
            console.log(`  Compressed size: ${(compressed.length / 1024).toFixed(2)} KB`);
            console.log(`  Compression ratio: ${compressionRatio.toFixed(4)}`);
            console.log(`  Space saving: ${((1 - compressionRatio) * 100).toFixed(2)}%`);
            console.log(`  Time: ${timeElapsed.toFixed(2)} ms`);
        }

        // Print summary table
        console.log("\nCompression Benchmark Summary:");
        console.log(
            "================================================================================================="
        );
        console.log(
            "| Method                  | Size (KB)     | Ratio      | Space Saving | Time (ms)    | KB/s     |"
        );
        console.log(
            "|-------------------------|---------------|------------|--------------|--------------|----------|"
        );

        for (const result of results) {
            const throughput = result.originalSize / 1024 / (result.timeElapsed / 1000);

            console.log(
                `| ${result.name.padEnd(24)} | ` +
                    `${(result.compressedSize / 1024).toFixed(2).padStart(13)} | ` +
                    `${result.compressionRatio.toFixed(4).padStart(10)} | ` +
                    `${result.compressionPercentage.toFixed(2).padStart(12)}% | ` +
                    `${result.timeElapsed.toFixed(2).padStart(12)} | ` +
                    `${throughput.toFixed(2).padStart(8)} |`
            );
        }

        console.log(
            "================================================================================================="
        );

        return results;
    } catch (error) {
        console.error("Benchmark error:", error);
        throw error;
    }
}

// Example usage
runCompressionBenchmark(path.join(__dirname, "sample-files", "text-file.txt"))
    .then(() => {
        console.log("\nText file benchmark completed");
        return runCompressionBenchmark(path.join(__dirname, "sample-files", "image.jpg"));
    })
    .then(() => {
        console.log("\nImage file benchmark completed");
    })
    .catch(console.error);
```

### Memory-Efficient Processing of Large Files

```javascript
import { createGzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline, Transform } from "stream";
import { promisify } from "util";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pipelinePromise = promisify(pipeline);

// Create a transform stream to process data before compression
class DataProcessor extends Transform {
    constructor(options = {}) {
        super(options);
        this.bytesProcessed = 0;
        this.startTime = Date.now();
        this.lastLogTime = this.startTime;
        this.logInterval = options.logInterval || 1000; // Log progress every second
    }

    _transform(chunk, encoding, callback) {
        // Update bytes processed
        this.bytesProcessed += chunk.length;

        // Log progress at intervals
        const now = Date.now();
        if (now - this.lastLogTime >= this.logInterval) {
            const elapsedSeconds = (now - this.startTime) / 1000;
            const mbProcessed = this.bytesProcessed / (1024 * 1024);
            const mbPerSecond = mbProcessed / elapsedSeconds;

            console.log(`Processed ${mbProcessed.toFixed(2)} MB at ${mbPerSecond.toFixed(2)} MB/s`);
            this.lastLogTime = now;
        }

        // Process the chunk (this is where you'd implement your custom processing)
        // For this example, we're just passing it through

        // Push the processed chunk to the next stream
        callback(null, chunk);
    }

    _flush(callback) {
        const elapsedSeconds = (Date.now() - this.startTime) / 1000;
        const mbProcessed = this.bytesProcessed / (1024 * 1024);
        const mbPerSecond = mbProcessed / elapsedSeconds;

        console.log(`Processing complete. Total: ${mbProcessed.toFixed(2)} MB at avg ${mbPerSecond.toFixed(2)} MB/s`);
        callback();
    }
}

async function processAndCompressLargeFile(inputPath, outputPath) {
    try {
        console.log(`Processing and compressing ${inputPath} to ${outputPath}`);

        // Create streams
        const source = createReadStream(inputPath, { highWaterMark: 1024 * 1024 }); // 1MB chunks
        const processor = new DataProcessor({ highWaterMark: 1024 * 1024 });
        const compressor = createGzip({ level: 6, highWaterMark: 1024 * 1024 });
        const destination = createWriteStream(outputPath);

        // Start time
        const startTime = Date.now();

        // Process, compress, and save
        await pipelinePromise(source, processor, compressor, destination);

        // Calculate elapsed time and speed
        const endTime = Date.now();
        const elapsedSeconds = (endTime - startTime) / 1000;

        console.log(`Completed in ${elapsedSeconds.toFixed(2)} seconds`);
    } catch (error) {
        console.error("Error processing file:", error);
    }
}

// Example usage with a large file
const inputFile = path.join(__dirname, "data", "large-dataset.csv");
const outputFile = path.join(__dirname, "data", "large-dataset.csv.gz");

processAndCompressLargeFile(inputFile, outputFile)
    .then(() => console.log("Processing complete"))
    .catch(console.error);
```

## Performance Tips

### Choosing the Right Algorithm and Settings

```javascript
import { gzip, brotliCompress, deflate, constants } from "zlib";
import { promisify } from "util";

// Promisify zlib functions
const gzipPromise = promisify(gzip);
const brotliCompressPromise = promisify(brotliCompress);
const deflatePromise = promisify(deflate);

/**
 * Choose the best compression algorithm based on data type and constraints
 * @param {Buffer} data - The data to compress
 * @param {Object} constraints - Constraints to consider
 * @returns {Promise<Buffer>} - The compressed data
 */
async function smartCompress(data, constraints = {}) {
    // Default constraints
    const {
        maxTimeMs = 1000, // Maximum time allowed for compression in ms
        prioritizeSpeed = false, // Whether to prioritize speed over compression ratio
        dataType = "unknown", // Type of data: 'text', 'binary', 'image', 'unknown'
        minCompressionRatio = 0.8, // Minimum acceptable compression ratio
    } = constraints;

    console.log(`Smart compressing ${data.length} bytes of ${dataType} data`);

    // Strategy based on data type and constraints
    if (prioritizeSpeed) {
        console.log("Prioritizing speed over compression ratio");

        // Fast compression with gzip level 1
        return gzipPromise(data, { level: 1 });
    } else if (dataType === "text" && data.length < 1024 * 1024) {
        console.log("Using Brotli for small text data");

        // Brotli is excellent for text and provides better compression
        return brotliCompressPromise(data, {
            params: {
                [constants.BROTLI_PARAM_QUALITY]: 7, // Good balance
                [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
            },
        });
    } else if (dataType === "text" && data.length >= 1024 * 1024) {
        console.log("Using Brotli with lower quality for large text data");

        // For larger text, use Brotli but with lower quality to save time
        return brotliCompressPromise(data, {
            params: {
                [constants.BROTLI_PARAM_QUALITY]: 4, // Lower quality for speed
                [constants.BROTLI_PARAM_MODE]: constants.BROTLI_MODE_TEXT,
                [constants.BROTLI_PARAM_SIZE_HINT]: data.length,
            },
        });
    } else if (dataType === "binary" || dataType === "image") {
        console.log("Using gzip for binary/image data");

        // Gzip works well for binary data
        return gzipPromise(data, { level: 6 }); // Default level
    } else {
        console.log("Using default general-purpose compression");

        // Default: use gzip as a general-purpose compressor
        return gzipPromise(data, { level: 6 });
    }
}

// Example usage
async function testSmartCompression() {
    // Sample text data
    const textData = Buffer.from("Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(1000));

    // Create some binary data (just for demonstration)
    const binaryData = Buffer.alloc(10000);
    for (let i = 0; i < binaryData.length; i++) {
        binaryData[i] = Math.floor(Math.random() * 256);
    }

    console.log("\nCompressing text data:");
    const compressedText = await smartCompress(textData, {
        dataType: "text",
        prioritizeSpeed: false,
    });
    console.log(`Original size: ${textData.length} bytes`);
    console.log(`Compressed size: ${compressedText.length} bytes`);
    console.log(`Compression ratio: ${(compressedText.length / textData.length).toFixed(4)}`);
    console.log(`Space saving: ${((1 - compressedText.length / textData.length) * 100).toFixed(2)}%`);

    console.log("\nCompressing binary data:");
    const compressedBinary = await smartCompress(binaryData, {
        dataType: "binary",
        prioritizeSpeed: false,
    });
    console.log(`Original size: ${binaryData.length} bytes`);
    console.log(`Compressed size: ${compressedBinary.length} bytes`);
    console.log(`Compression ratio: ${(compressedBinary.length / binaryData.length).toFixed(4)}`);
    console.log(`Space saving: ${((1 - compressedBinary.length / binaryData.length) * 100).toFixed(2)}%`);

    console.log("\nCompressing text data with speed priority:");
    const fastCompressedText = await smartCompress(textData, {
        dataType: "text",
        prioritizeSpeed: true,
    });
    console.log(`Original size: ${textData.length} bytes`);
    console.log(`Compressed size: ${fastCompressedText.length} bytes`);
    console.log(`Compression ratio: ${(fastCompressedText.length / textData.length).toFixed(4)}`);
    console.log(`Space saving: ${((1 - fastCompressedText.length / textData.length) * 100).toFixed(2)}%`);
}

testSmartCompression().catch(console.error);
```

### Balancing Memory Usage, Speed, and Compression Ratio

```javascript
import { createGzip, constants } from "zlib";
import { createReadStream, createWriteStream, statSync } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import os from "os";

const pipelinePromise = promisify(pipeline);

/**
 * Compress a file with adaptive settings based on file size and system resources
 * @param {string} inputPath - Path to the input file
 * @param {string} outputPath - Path for the compressed output
 * @param {Object} options - Additional options
 */
async function adaptiveCompression(inputPath, outputPath, options = {}) {
    try {
        // Get file size
        const stats = statSync(inputPath);
        const fileSize = stats.size;
        const fileSizeMB = fileSize / (1024 * 1024);

        // Get system info
        const totalMemory = os.totalmem() / (1024 * 1024); // in MB
        const freeMemory = os.freemem() / (1024 * 1024); // in MB
        const cpuCount = os.cpus().length;

        console.log(`File size: ${fileSizeMB.toFixed(2)} MB`);
        console.log(`System memory: ${totalMemory.toFixed(2)} MB total, ${freeMemory.toFixed(2)} MB free`);
        console.log(`CPU cores: ${cpuCount}`);

        // Determine optimal settings based on file size and system resources
        let compressionLevel, memLevel, chunkSize;

        // Adjust compression level based on file size and available resources
        if (fileSizeMB > 1000 || freeMemory < fileSizeMB * 2) {
            // For very large files or low memory, use faster compression
            compressionLevel = options.level || constants.Z_BEST_SPEED;
            memLevel = options.memLevel || 4;
            chunkSize = 256 * 1024; // 256KB chunks
            console.log("Using fast compression settings for large file or limited memory");
        } else if (fileSizeMB < 10 && freeMemory > fileSizeMB * 10) {
            // For small files with plenty of memory, use maximum compression
            compressionLevel = options.level || constants.Z_BEST_COMPRESSION;
            memLevel = options.memLevel || 9;
            chunkSize = 1024 * 1024; // 1MB chunks
            console.log("Using maximum compression settings for small file");
        } else {
            // Default balanced settings
            compressionLevel = options.level || 6;
            memLevel = options.memLevel || 8;
            chunkSize = 512 * 1024; // 512KB chunks
            console.log("Using balanced compression settings");
        }

        // Create compression options
        const zlibOptions = {
            level: compressionLevel,
            memLevel: memLevel,
            flush: constants.Z_NO_FLUSH,
            windowBits: options.windowBits || 15,
        };

        console.log(
            `Compression settings: level=${zlibOptions.level}, memLevel=${zlibOptions.memLevel}, chunkSize=${chunkSize / 1024}KB`
        );

        // Create streams
        const source = createReadStream(inputPath, { highWaterMark: chunkSize });
        const destination = createWriteStream(outputPath);
        const gzip = createGzip(zlibOptions);

        // Add progress reporting
        let processedBytes = 0;
        const startTime = Date.now();

        source.on("data", (chunk) => {
            processedBytes += chunk.length;
            const percent = ((processedBytes / fileSize) * 100).toFixed(2);
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const mbPerSecond = processedBytes / (1024 * 1024) / elapsedSeconds;

            // Update progress every ~5%
            if (
                Math.floor((processedBytes / fileSize) * 20) >
                Math.floor(((processedBytes - chunk.length) / fileSize) * 20)
            ) {
                process.stdout.write(`Progress: ${percent}% (${mbPerSecond.toFixed(2)} MB/s)\r`);
            }
        });

        // Start compression
        await pipelinePromise(source, gzip, destination);

        // Calculate final stats
        const endTime = Date.now();
        const elapsedSeconds = (endTime - startTime) / 1000;
        const compressedStats = statSync(outputPath);
        const compressedSize = compressedStats.size;
        const compressionRatio = compressedSize / fileSize;

        console.log(`\nCompression complete in ${elapsedSeconds.toFixed(2)} seconds`);
        console.log(`Original size: ${fileSizeMB.toFixed(2)} MB`);
        console.log(`Compressed size: ${(compressedSize / (1024 * 1024)).toFixed(2)} MB`);
        console.log(`Compression ratio: ${compressionRatio.toFixed(4)}`);
        console.log(`Space saving: ${((1 - compressionRatio) * 100).toFixed(2)}%`);
        console.log(`Throughput: ${(fileSize / (1024 * 1024) / elapsedSeconds).toFixed(2)} MB/s`);

        return {
            originalSize: fileSize,
            compressedSize,
            compressionRatio,
            elapsedSeconds,
            throughput: fileSize / elapsedSeconds,
        };
    } catch (error) {
        console.error("Error during adaptive compression:", error);
        throw error;
    }
}

// Example usage
adaptiveCompression("/path/to/large-file.dat", "/path/to/large-file.dat.gz").catch(console.error);
```

## Error Handling

```javascript
import { createGzip, createGunzip } from "zlib";
import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const pipelinePromise = promisify(pipeline);

/**
 * Compress a file with robust error handling
 * @param {string} inputPath - Path to the input file
 * @param {string} outputPath - Path for the compressed output
 */
async function compressWithErrorHandling(inputPath, outputPath) {
    let tempOutputPath = null;

    try {
        // Validate input
        if (!inputPath || !outputPath) {
            throw new Error("Input and output paths are required");
        }

        // Check if input file exists
        try {
            await fs.access(inputPath, fs.constants.R_OK);
        } catch (err) {
            throw new Error(`Input file does not exist or is not readable: ${inputPath}`);
        }

        // Check if output directory exists
        const outputDir = path.dirname(outputPath);
        try {
            await fs.access(outputDir, fs.constants.W_OK);
        } catch (err) {
            throw new Error(`Output directory does not exist or is not writable: ${outputDir}`);
        }

        // Use a temporary file for output to avoid corrupting an existing file on error
        tempOutputPath = `${outputPath}.temp.${Date.now()}`;

        // Create streams
        const source = createReadStream(inputPath);
        const destination = createWriteStream(tempOutputPath);
        const gzip = createGzip();

        // Set up error handling for individual streams
        source.on("error", (err) => {
            throw new Error(`Error reading input file: ${err.message}`);
        });

        destination.on("error", (err) => {
            throw new Error(`Error writing output file: ${err.message}`);
        });

        gzip.on("error", (err) => {
            throw new Error(`Error during compression: ${err.message}`);
        });

        // Compress the file
        await pipelinePromise(source, gzip, destination);

        // Rename temp file to final output file
        await fs.rename(tempOutputPath, outputPath);

        console.log(`File compressed successfully: ${inputPath} → ${outputPath}`);
        return true;
    } catch (error) {
        console.error("Compression failed:", error.message);

        // Clean up temp file if it exists
        if (tempOutputPath) {
            try {
                await fs.unlink(tempOutputPath).catch(() => {});
            } catch (cleanupError) {
                console.error(`Failed to clean up temporary file: ${cleanupError.message}`);
            }
        }

        throw error;
    }
}

/**
 * Decompress a file with robust error handling
 * @param {string} inputPath - Path to the compressed input file
 * @param {string} outputPath - Path for the decompressed output
 */
async function decompressWithErrorHandling(inputPath, outputPath) {
    let tempOutputPath = null;

    try {
        // Validate input
        if (!inputPath || !outputPath) {
            throw new Error("Input and output paths are required");
        }

        // Check if input file exists
        try {
            await fs.access(inputPath, fs.constants.R_OK);
        } catch (err) {
            throw new Error(`Input file does not exist or is not readable: ${inputPath}`);
        }

        // Check if output directory exists
        const outputDir = path.dirname(outputPath);
        try {
            await fs.access(outputDir, fs.constants.W_OK);
        } catch (err) {
            throw new Error(`Output directory does not exist or is not writable: ${outputDir}`);
        }

        // Use a temporary file for output
        tempOutputPath = `${outputPath}.temp.${Date.now()}`;

        // Create streams
        const source = createReadStream(inputPath);
        const destination = createWriteStream(tempOutputPath);
        const gunzip = createGunzip();

        // Handle decompression errors specifically
        gunzip.on("error", (err) => {
            if (err.code === "Z_DATA_ERROR") {
                throw new Error("Invalid compressed data format. The file may be corrupted or not a valid gzip file.");
            } else if (err.code === "Z_BUF_ERROR") {
                throw new Error("Incomplete compressed data. The file may be truncated.");
            } else {
                throw new Error(`Decompression error: ${err.message}`);
            }
        });

        // Decompress the file
        await pipelinePromise(source, gunzip, destination);

        // Rename temp file to final output file
        await fs.rename(tempOutputPath, outputPath);

        console.log(`File decompressed successfully: ${inputPath} → ${outputPath}`);
        return true;
    } catch (error) {
        console.error("Decompression failed:", error.message);

        // Clean up temp file if it exists
        if (tempOutputPath) {
            try {
                await fs.unlink(tempOutputPath).catch(() => {});
            } catch (cleanupError) {
                console.error(`Failed to clean up temporary file: ${cleanupError.message}`);
            }
        }

        throw error;
    }
}

// Example usage with error handling
async function processFiles() {
    try {
        // Compress a file
        await compressWithErrorHandling("/path/to/input.txt", "/path/to/output.txt.gz");

        // Decompress a file
        await decompressWithErrorHandling("/path/to/output.txt.gz", "/path/to/decompressed.txt");

        console.log("All operations completed successfully");
    } catch (error) {
        console.error("Operation failed:", error.message);
        // Here you might log the error, notify the user, or take other actions
    }
}

processFiles();
```

## Best Practices

1. **Choose the Right Algorithm**
    - Use Gzip for general-purpose compression
    - Use Brotli for text-based content (especially for web)
    - Use Deflate when smaller header size is important

2. **Balance Compression Settings**
    - Higher compression levels use more CPU and memory but produce smaller files
    - For real-time applications, use lower compression levels
    - For archiving, use higher compression levels

3. **Stream Processing**
    - Always use streams for large files to avoid memory issues
    - Set appropriate chunk sizes with `highWaterMark`
    - Use `pipeline()` instead of manually piping streams

4. **Error Handling**
    - Always handle compression/decompression errors
    - Use temporary files for output to avoid corrupting files on error
    - Check for common errors like invalid or incomplete compressed data

5. **Memory Management**
    - Adjust memory level based on available system resources
    - For large files, use lower memory levels
    - Consider using worker threads for CPU-intensive compression

## Common Pitfalls

1. **Memory Usage**
    - Compressing large files in memory can cause out-of-memory errors
    - Always use streams for large files

2. **Corrupted Output**
    - Not properly handling errors can result in corrupted output files
    - Use temporary files and atomic renames

3. **Performance Issues**
    - Using too high compression levels for real-time applications
    - Not considering the CPU/memory trade-offs

4. **Incomplete Decompression**
    - Not checking if compressed data is complete before decompression
    - Not handling truncated input properly

5. **Header Compatibility**
    - Gzip and Deflate have different headers
    - Using the wrong decompression algorithm for the data format

## Resources

- [Node.js Zlib Documentation](https://nodejs.org/api/zlib.html)
- [Gzip File Format Specification](https://datatracker.ietf.org/doc/html/rfc1952)
- [Deflate Compressed Data Format Specification](https://datatracker.ietf.org/doc/html/rfc1951)
- [Brotli Compression Format](https://datatracker.ietf.org/doc/html/rfc7932)
