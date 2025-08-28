# Child Process Module

The `child_process` module provides the ability to spawn child processes in Node.js. This capability is particularly useful for executing system commands, running scripts in other languages, and leveraging multi-core processors for CPU-intensive tasks.

## Key Features

- **Command Execution**: Run system commands from Node.js
- **Cross-Platform**: Works on Windows, macOS, Linux with appropriate handling
- **Input/Output Control**: Manage stdin, stdout, and stderr of child processes
- **Synchronous and Asynchronous APIs**: Support for both execution models
- **IPC Channels**: Communication between parent and child processes
- **Process Management**: Control and monitor spawned processes

## Core Methods

| Method       | Description                                     | Usage                                               |
| ------------ | ----------------------------------------------- | --------------------------------------------------- |
| `spawn()`    | Spawns a new process with given command         | Best for long-running processes with large outputs  |
| `exec()`     | Spawns a shell and executes a command           | Best for commands with limited output and callbacks |
| `execFile()` | Similar to `exec()` but doesn't spawn a shell   | More efficient than exec for executable files       |
| `fork()`     | Special case of `spawn()` for Node.js processes | Best for creating Node.js child processes with IPC  |

## Basic Examples

### spawn(): Running Commands with Stream Output

```javascript
import { spawn } from "child_process";

// Spawn a new process
const ls = spawn("ls", ["-la", "/usr"]);

// Capture standard output
ls.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
});

// Capture standard error
ls.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
});

// Process completion
ls.on("close", (code) => {
    console.log(`child process exited with code ${code}`);
});
```

### exec(): Running Commands with Buffered Output

```javascript
import { exec } from "child_process";

// Execute a command
exec("ls -la /usr", (error, stdout, stderr) => {
    if (error) {
        console.error(`exec error: ${error}`);
        return;
    }

    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);
});
```

### execFile(): Running Executable Files

```javascript
import { execFile } from "child_process";

// Execute an executable file directly
execFile("node", ["--version"], (error, stdout, stderr) => {
    if (error) {
        console.error(`execFile error: ${error}`);
        return;
    }

    console.log(`Node.js version: ${stdout.trim()}`);
});
```

### fork(): Creating Node.js Child Processes

**Parent script (parent.js)**:

```javascript
import { fork } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Fork a child process
const child = fork(path.join(__dirname, "child.js"));

// Send message to child
child.send({ hello: "world" });

// Receive messages from child
child.on("message", (message) => {
    console.log("Message from child:", message);
});

// Handle child process exit
child.on("exit", (code, signal) => {
    console.log(`Child process exited with code ${code} and signal ${signal}`);
});
```

**Child script (child.js)**:

```javascript
// Receive messages from parent
process.on("message", (message) => {
    console.log("Message from parent:", message);

    // Send response back to parent
    process.send({ received: true, echo: message });

    // Exit after 3 seconds
    setTimeout(() => {
        process.exit(0);
    }, 3000);
});
```

## Advanced Usage

### Spawning with Shell Syntax (Windows & Unix)

```javascript
import { spawn } from "child_process";
import os from "os";

// Determine which shell to use
const isWindows = os.platform() === "win32";
const shell = isWindows ? "cmd.exe" : "/bin/sh";
const shellFlag = isWindows ? "/c" : "-c";

// Command with shell features (pipes, redirects, etc.)
const command = 'echo "Hello" | grep "Hello"';

// Spawn process with shell
const child = spawn(shell, [shellFlag, command]);

child.stdout.on("data", (data) => {
    console.log(`Output: ${data}`);
});

child.stderr.on("data", (data) => {
    console.error(`Error: ${data}`);
});

child.on("close", (code) => {
    console.log(`Process exited with code ${code}`);
});
```

### Streaming Data to Child Process

```javascript
import { spawn } from "child_process";
import fs from "fs";

// Example: Compressing a file using gzip
const source = fs.createReadStream("largefile.txt");
const gzip = spawn("gzip", ["-9", "-c"]);
const destination = fs.createWriteStream("largefile.txt.gz");

// Pipe data: source -> gzip -> destination
source.pipe(gzip.stdin);
gzip.stdout.pipe(destination);

// Handle errors
gzip.stderr.on("data", (data) => {
    console.error(`gzip error: ${data}`);
});

gzip.on("close", (code) => {
    if (code === 0) {
        console.log("File compressed successfully");
    } else {
        console.error(`gzip process exited with code ${code}`);
    }
});
```

### Executing Multiple Commands in Sequence

```javascript
import { exec } from "child_process";
import util from "util";

// Promisify exec
const execPromise = util.promisify(exec);

// Execute commands in sequence
async function runSequentialCommands() {
    try {
        console.log("Creating directory...");
        await execPromise("mkdir -p test-dir");

        console.log("Creating file...");
        await execPromise('echo "Hello World" > test-dir/test.txt');

        console.log("Reading file...");
        const { stdout } = await execPromise("cat test-dir/test.txt");
        console.log(`File contents: ${stdout.trim()}`);

        console.log("All commands completed successfully");
    } catch (error) {
        console.error("Error executing commands:", error);
    }
}

runSequentialCommands();
```

### Running Commands with Environment Variables

```javascript
import { spawn } from "child_process";

// Set environment variables
const env = { ...process.env, MY_CUSTOM_VAR: "Hello from Node.js" };

// Spawn process with custom environment
const child = spawn("echo", ["$MY_CUSTOM_VAR"], {
    env: env,
    shell: true, // Required for environment variable expansion
});

child.stdout.on("data", (data) => {
    console.log(`Output: ${data.toString().trim()}`);
});

child.on("error", (error) => {
    console.error(`Error: ${error.message}`);
});
```

### Detached Processes

```javascript
import { spawn } from "child_process";
import fs from "fs";

// Create a detached process that continues running after parent exits
const out = fs.openSync("./out.log", "a");
const err = fs.openSync("./err.log", "a");

const child = spawn("node", ["long-running-script.js"], {
    detached: true,
    stdio: ["ignore", out, err],
});

// Unref the child to allow the parent to exit independently
child.unref();

console.log(`Started detached process with PID: ${child.pid}`);
console.log("Parent process will now exit");
```

## Error Handling

```javascript
import { spawn } from "child_process";

// Try to spawn a non-existent command
const child = spawn("non-existent-command", []);

// Handle spawn error (e.g., command not found)
child.on("error", (error) => {
    console.error(`Failed to start child process: ${error.message}`);
});

// Handle runtime errors (via stderr)
child.stderr.on("data", (data) => {
    console.error(`stderr: ${data}`);
});

// Check exit code
child.on("close", (code) => {
    if (code !== 0) {
        console.error(`Child process exited with code ${code}`);
    } else {
        console.log("Child process completed successfully");
    }
});
```

## Working with Streams & Pipes

```javascript
import { spawn } from "child_process";
import fs from "fs";

// Create a processing pipeline
async function processLargeFile(inputFile, outputFile) {
    // Create read stream for large file
    const input = fs.createReadStream(inputFile);

    // First process: grep for pattern
    const grep = spawn("grep", ["important", "-i"]);

    // Second process: count lines
    const wc = spawn("wc", ["-l"]);

    // Output file
    const output = fs.createWriteStream(outputFile);

    // Connect the pipeline
    input.pipe(grep.stdin);
    grep.stdout.pipe(wc.stdin);
    wc.stdout.pipe(output);

    // Handle errors in each part of the pipeline
    input.on("error", (err) => console.error(`Input error: ${err}`));
    grep.on("error", (err) => console.error(`Grep error: ${err}`));
    wc.on("error", (err) => console.error(`WC error: ${err}`));
    output.on("error", (err) => console.error(`Output error: ${err}`));

    // Wait for completion
    return new Promise((resolve, reject) => {
        wc.on("close", (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Process exited with code ${code}`));
            }
        });
    });
}

// Usage
processLargeFile("large-log-file.txt", "count-results.txt")
    .then(() => console.log("Processing complete"))
    .catch((err) => console.error("Processing failed:", err));
```

## Best Practices

1. **Prefer spawn() for large outputs**: Use `spawn()` for commands with large or continuous output
2. **Handle all streams**: Always handle stdout, stderr, and errors for each child process
3. **Sanitize inputs**: Validate and sanitize any user inputs used in commands
4. **Set timeouts**: Implement timeouts for commands that might hang
5. **Use absolute paths**: Specify full paths to executables for consistency
6. **Manage process termination**: Properly terminate child processes when no longer needed
7. **Consider shell injection**: Be aware of shell injection risks when using `exec()`
8. **Match OS environments**: Handle platform differences in command syntax and paths
9. **Check exit codes**: Always check exit codes to verify successful execution
10. **Limit buffer sizes**: Set maxBuffer for `exec()` based on expected output size

## Security Considerations

### Command Injection Prevention

```javascript
import { spawn } from "child_process";

// UNSAFE - vulnerable to command injection
function unsafeExecute(fileName) {
    return spawn("ls", ["-la", fileName + " && rm -rf /"]); // Dangerous!
}

// SAFE - uses array syntax to prevent injection
function safeExecute(fileName) {
    return spawn("ls", ["-la", fileName]); // Safe: arguments are passed separately
}
```

### Working With User Input Safely

```javascript
import { spawn } from "child_process";

function findInFiles(searchTerm) {
    // Validate input before using in command
    if (!/^[a-zA-Z0-9_\- ]+$/.test(searchTerm)) {
        throw new Error("Invalid search term: only alphanumeric characters allowed");
    }

    // Use spawn with array arguments for safety
    const grep = spawn("grep", ["-r", searchTerm, "./logs"]);

    // Process output and return results
    return new Promise((resolve, reject) => {
        let output = "";
        let errorOutput = "";

        grep.stdout.on("data", (data) => {
            output += data;
        });

        grep.stderr.on("data", (data) => {
            errorOutput += data;
        });

        grep.on("error", reject);

        grep.on("close", (code) => {
            if (code !== 0) {
                reject(new Error(`grep failed with code ${code}: ${errorOutput}`));
            } else {
                resolve(output);
            }
        });
    });
}
```

## Common Pitfalls

- **Buffer overflow**: By default, `exec()` and `execFile()` buffer output up to a limit
- **Zombie processes**: Not handling or terminating child processes properly
- **Shell injection**: Using user input directly in command strings
- **Platform dependencies**: Commands that work differently across operating systems
- **Resource leaks**: Not properly handling streams and file descriptors
- **Ignoring stderr**: Not capturing or handling error output
- **Signal handling**: Failing to handle signals properly in parent/child processes

## Real-world Example: Thumbnail Generator

```javascript
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Generate thumbnails for images using ImageMagick
 * @param {string} imageDir - Directory containing images
 * @param {string} thumbDir - Directory to store thumbnails
 * @param {number} size - Thumbnail size in pixels
 */
async function generateThumbnails(imageDir, thumbDir, size = 200) {
    try {
        // Ensure thumbnail directory exists
        await fs.mkdir(thumbDir, { recursive: true });

        // Get all image files
        const files = await fs.readdir(imageDir);
        const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|gif)$/i.test(file));

        console.log(`Found ${imageFiles.length} images to process`);

        // Process each image
        const results = await Promise.all(
            imageFiles.map(async (file) => {
                const inputPath = path.join(imageDir, file);
                const outputPath = path.join(thumbDir, `thumb_${file}`);

                return new Promise((resolve, reject) => {
                    // Use ImageMagick's convert command
                    const convert = spawn("convert", [inputPath, "-resize", `${size}x${size}`, outputPath]);

                    let errorOutput = "";

                    convert.stderr.on("data", (data) => {
                        errorOutput += data;
                    });

                    convert.on("error", (err) => {
                        reject(new Error(`Failed to start convert: ${err.message}`));
                    });

                    convert.on("close", (code) => {
                        if (code === 0) {
                            resolve({ file, success: true });
                        } else {
                            reject(new Error(`Convert failed for ${file}: ${errorOutput}`));
                        }
                    });
                });
            })
        );

        console.log("Thumbnail generation completed");
        return results;
    } catch (error) {
        console.error("Thumbnail generation failed:", error);
        throw error;
    }
}

// Usage
const imagesDir = path.join(__dirname, "images");
const thumbnailsDir = path.join(__dirname, "thumbnails");

generateThumbnails(imagesDir, thumbnailsDir, 150)
    .then((results) => {
        console.log(`Successfully processed ${results.length} images`);
    })
    .catch((err) => {
        console.error("Error in thumbnail generation process:", err);
    });
```

## Resources

- [Node.js Child Process Documentation](https://nodejs.org/api/child_process.html)
- [Understanding execFile, spawn, exec, and fork in Node.js](https://2ality.com/2022/07/nodejs-child-process.html)
- [Security Best Practices for Child Processes](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
