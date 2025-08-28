# File System (fs) Module

The `fs` module provides an API for interacting with the file system in a way modeled on standard POSIX functions.

## Key Features

- **File Operations**: Read, write, update, and delete files
- **Directory Operations**: Create, read, and delete directories
- **File Watching**: Monitor files for changes
- **Permissions**: Change permissions, ownership, and timestamps
- **Streams**: Handle file streams for efficient I/O operations

## Common Methods

### Synchronous vs. Asynchronous

Most methods have both synchronous and asynchronous forms:

| Asynchronous (Preferred) | Synchronous          |
| ------------------------ | -------------------- |
| `fs.readFile()`          | `fs.readFileSync()`  |
| `fs.writeFile()`         | `fs.writeFileSync()` |
| `fs.mkdir()`             | `fs.mkdirSync()`     |

Asynchronous methods are preferred in production to avoid blocking the event loop.

### Promise-based API

In modern Node.js, the `fs/promises` API provides promise-based alternatives to callback-based methods.

### Key Methods:

| Method                | Description                                            |
| --------------------- | ------------------------------------------------------ |
| `readFile()`          | Reads the entire contents of a file                    |
| `writeFile()`         | Writes data to a file, replacing the file if it exists |
| `appendFile()`        | Appends data to a file                                 |
| `mkdir()`             | Creates a directory                                    |
| `readdir()`           | Reads the contents of a directory                      |
| `stat()`              | Gets file information                                  |
| `unlink()`            | Removes a file                                         |
| `rmdir()`             | Removes a directory                                    |
| `copyFile()`          | Copies a file                                          |
| `createReadStream()`  | Creates a readable stream                              |
| `createWriteStream()` | Creates a writable stream                              |

## Examples with ES Modules

```javascript
// Importing from fs/promises (Promise-based API)
import { readFile, writeFile, mkdir, readdir } from "fs/promises";

// Reading a file
async function readConfigFile() {
    try {
        const data = await readFile("./config.json", "utf8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading file:", error);
        throw error;
    }
}

// Writing to a file
async function saveUserData(userData) {
    try {
        await writeFile("./data/user.json", JSON.stringify(userData, null, 2));
        console.log("User data saved successfully");
    } catch (error) {
        console.error("Error writing file:", error);
        throw error;
    }
}

// Creating directories
async function createUploadDirectories() {
    try {
        await mkdir("./uploads/images", { recursive: true });
        await mkdir("./uploads/videos", { recursive: true });
        await mkdir("./uploads/documents", { recursive: true });
        console.log("Upload directories created");
    } catch (error) {
        console.error("Error creating directories:", error);
        throw error;
    }
}

// Reading directory contents
async function listUploads() {
    try {
        const files = await readdir("./uploads");
        console.log("Upload directory contains:", files);
        return files;
    } catch (error) {
        console.error("Error reading directory:", error);
        throw error;
    }
}
```

## Best Practices

1. **Use async/await with promises**: For cleaner, more maintainable code
2. **Prefer streaming for large files**: Use `createReadStream`/`createWriteStream` instead of `readFile`/`writeFile`
3. **Handle errors properly**: Always include try/catch blocks or error handlers
4. **Check file existence**: Use `fs.access()` or `fs.stat()` before operations when needed
5. **Close file descriptors**: When using low-level functions that return file descriptors
6. **Use relative paths carefully**: Consider working directory context
7. **Avoid synchronous methods in production**: They block the event loop

## Common Pitfalls

- **Path inconsistencies**: Use the `path` module to handle paths consistently across platforms
- **Permissions issues**: Handle EACCES errors, especially in production environments
- **Memory limitations**: Avoid loading large files entirely into memory
- **Race conditions**: Be careful with multiple concurrent operations on the same files

## Resources

- [Official Node.js fs Documentation](https://nodejs.org/api/fs.html)
- [fs/promises API Documentation](https://nodejs.org/api/fs.html#fs_promises_api)
