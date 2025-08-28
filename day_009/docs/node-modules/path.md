# Path Module

The `path` module provides utilities for working with file and directory paths. It helps handle path differences across operating systems.

## Key Features

- **Path Normalization**: Convert paths to a consistent format
- **Path Joining**: Combine path segments correctly
- **Path Resolution**: Resolve relative paths
- **Path Extraction**: Extract components of a path (directory, filename, extension)
- **Cross-platform**: Works consistently across Windows, macOS, and Linux

## Common Methods

| Method         | Description                                               |
| -------------- | --------------------------------------------------------- |
| `join()`       | Joins path segments using the platform-specific separator |
| `resolve()`    | Resolves a sequence of paths to an absolute path          |
| `normalize()`  | Normalizes a path, resolving `..` and `.` segments        |
| `basename()`   | Returns the last portion of a path                        |
| `dirname()`    | Returns the directory name of a path                      |
| `extname()`    | Returns the file extension                                |
| `parse()`      | Returns an object with path components                    |
| `format()`     | Returns a path string from an object                      |
| `isAbsolute()` | Determines if a path is absolute                          |

## Examples with ES Modules

```javascript
import path from "path";

// Join paths (works cross-platform)
const uploadsPath = path.join("uploads", "images", "profile.jpg");
console.log(uploadsPath);
// outputs: uploads/images/profile.jpg (Unix) or uploads\images\profile.jpg (Windows)

// Resolve absolute path
const absolutePath = path.resolve("uploads", "documents", "report.pdf");
console.log(absolutePath);
// outputs: /full/path/to/current/directory/uploads/documents/report.pdf

// Get file extension
const fileExtension = path.extname("user-image.jpg");
console.log(fileExtension); // outputs: .jpg

// Get base name (filename)
const fileName = path.basename("/uploads/images/profile.jpg");
console.log(fileName); // outputs: profile.jpg

// Get filename without extension
const fileNameNoExt = path.basename("/uploads/images/profile.jpg", ".jpg");
console.log(fileNameNoExt); // outputs: profile

// Get directory name
const dirName = path.dirname("/uploads/images/profile.jpg");
console.log(dirName); // outputs: /uploads/images

// Parse a path into components
const pathInfo = path.parse("/uploads/images/profile.jpg");
console.log(pathInfo);
// outputs:
// {
//   root: '/',
//   dir: '/uploads/images',
//   base: 'profile.jpg',
//   ext: '.jpg',
//   name: 'profile'
// }

// Format path from components
const newPath = path.format({
    dir: "/uploads/videos",
    base: "tutorial.mp4",
});
console.log(newPath); // outputs: /uploads/videos/tutorial.mp4

// Normalize a path (resolve .. and . segments)
const normalizedPath = path.normalize("/uploads/../assets/./images/profile.jpg");
console.log(normalizedPath); // outputs: /assets/images/profile.jpg
```

## Platform Differences

### Windows vs. POSIX Paths

The path module accounts for different path formats across operating systems:

| Feature          | Windows             | POSIX (Unix, Linux, macOS) |
| ---------------- | ------------------- | -------------------------- |
| Path separator   | Backslash (`\`)     | Forward slash (`/`)        |
| Drive letter     | Yes (e.g., `C:\`)   | No                         |
| Root directory   | `C:\` (drive-based) | `/` (single root)          |
| Path delimiter   | Semicolon (`;`)     | Colon (`:`)                |
| Case sensitivity | Case-insensitive    | Case-sensitive (typically) |

### Working with Windows Paths

```javascript
// Windows-specific path handling
import { win32 } from "path";

const windowsPath = win32.join("C:", "Users", "Username", "Documents");
console.log(windowsPath); // 'C:\Users\Username\Documents'
```

### Working with POSIX Paths

```javascript
// POSIX-specific path handling
import { posix } from "path";

const posixPath = posix.join("/home", "username", "documents");
console.log(posixPath); // '/home/username/documents'
```

## Best Practices

1. **Always use path module**: Never manually concatenate paths with string operators
2. **Use path.join() for relative paths**: For combining path segments safely
3. **Use path.resolve() for absolute paths**: When you need a full path from relative segments
4. **Consistent forward slashes**: For path displays in user interfaces or logs
5. **Handle path.sep correctly**: When working with paths programmatically
6. **Check for absolute paths**: Use path.isAbsolute() when validating paths

## Common Pitfalls

- **Hardcoded separators**: Using `/` or `\` directly instead of `path.sep`
- **Mixed POSIX/Win32 methods**: Be consistent with which path API you use
- **Ignoring path normalization**: When dealing with user input or external data
- **Forgetting path.resolve behavior**: It resolves to absolute paths from the current working directory

## Resources

- [Official Node.js path Documentation](https://nodejs.org/api/path.html)
