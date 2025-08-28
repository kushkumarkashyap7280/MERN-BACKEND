# URL Module

The `url` module provides utilities for URL resolution and parsing. It offers both a legacy API and a newer WHATWG URL API that aligns with web standards.

## Key Features

- **URL Parsing**: Parse URLs into components
- **URL Construction**: Build URLs from components
- **URL Manipulation**: Modify URLs easily
- **Query String Handling**: Parse and format query parameters
- **Web Standards Compliance**: WHATWG URL API follows web standards

## Common Methods and Properties

### WHATWG URL API (Recommended)

| Feature            | Description                           |
| ------------------ | ------------------------------------- |
| `URL` class        | Constructor for creating URL objects  |
| `URLSearchParams`  | API for working with query parameters |
| `url.href`         | The full URL string                   |
| `url.origin`       | Protocol + hostname + port            |
| `url.protocol`     | Protocol scheme                       |
| `url.username`     | Username specified in URL             |
| `url.password`     | Password specified in URL             |
| `url.host`         | Hostname with port                    |
| `url.hostname`     | Just the hostname                     |
| `url.port`         | Port number                           |
| `url.pathname`     | Path section of URL                   |
| `url.search`       | Query string with leading `?`         |
| `url.searchParams` | URLSearchParams object                |
| `url.hash`         | Fragment identifier with leading `#`  |

## Examples with ES Modules

```javascript
// In Node.js we can import URL and URLSearchParams directly from the global object
// or from the url module
import { URL, URLSearchParams } from "url";

// Create a URL object
const apiUrl = new URL("https://api.example.com/users");

// Add query parameters
apiUrl.searchParams.append("page", "1");
apiUrl.searchParams.append("limit", "20");
apiUrl.searchParams.append("sort", "name");

console.log(apiUrl.toString());
// https://api.example.com/users?page=1&limit=20&sort=name

// Parse an existing URL
const productUrl = new URL("https://shop.example.com/products/laptop?color=silver&size=15");

// Access URL components
console.log(productUrl.hostname); // shop.example.com
console.log(productUrl.pathname); // /products/laptop
console.log(productUrl.searchParams.get("color")); // silver

// Modify URL components
productUrl.pathname = "/products/tablet";
productUrl.searchParams.set("color", "black");
productUrl.searchParams.append("feature", "touchscreen");

console.log(productUrl.toString());
// https://shop.example.com/products/tablet?color=black&size=15&feature=touchscreen

// Working with URLSearchParams directly
const params = new URLSearchParams();
params.append("category", "electronics");
params.append("brand", "Samsung");
params.append("inStock", "true");

console.log(params.toString()); // category=electronics&brand=Samsung&inStock=true

// URL resolution - creating an absolute URL from a base and a relative URL
const baseUrl = new URL("https://api.example.com/v1/");
const endpointUrl = new URL("users/profile", baseUrl);

console.log(endpointUrl.href); // https://api.example.com/v1/users/profile
```

## Working with `fileURLToPath` and `pathToFileURL`

These utilities convert between file paths and `file://` URLs, which is especially useful in ES Modules:

```javascript
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

// Converting file:// URL to a path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("Current file:", __filename);
console.log("Current directory:", __dirname);

// Converting a path to a file:// URL
const fileUrl = pathToFileURL(path.join(__dirname, "data.json"));
console.log(fileUrl.href); // file:///path/to/your/directory/data.json
```

## URL and URLSearchParams Methods

### URL Methods

| Method       | Description                                               |
| ------------ | --------------------------------------------------------- |
| `toString()` | Returns the complete URL as a string                      |
| `toJSON()`   | Returns the complete URL as a string (for JSON.stringify) |

### URLSearchParams Methods

| Method                | Description                                      |
| --------------------- | ------------------------------------------------ |
| `append(name, value)` | Appends a new name-value pair                    |
| `delete(name)`        | Deletes all pairs with the specified name        |
| `get(name)`           | Returns the first value associated with the name |
| `getAll(name)`        | Returns all values associated with the name      |
| `has(name)`           | Returns boolean indicating if the name exists    |
| `set(name, value)`    | Sets the value associated with the name          |
| `sort()`              | Sorts all key-value pairs by their names         |
| `entries()`           | Returns an iterator for all key-value pairs      |
| `keys()`              | Returns an iterator for all keys                 |
| `values()`            | Returns an iterator for all values               |
| `forEach()`           | Executes a function for each key-value pair      |

## Best Practices

1. **Use WHATWG URL API**: Prefer the newer standard-compliant API over the legacy one
2. **Validate URLs**: Always validate user-provided URLs to prevent security issues
3. **Handle URL encoding properly**: Use URLSearchParams instead of manual encoding
4. **Be careful with URL manipulation**: Understand how changing one part affects others
5. **Use URL objects for comparison**: When comparing URLs, normalize them using the URL object
6. **Consider security implications**: Especially when using URLs from external sources

## Common Pitfalls

- **Manual query string manipulation**: Use URLSearchParams instead of custom parsing
- **Forgetting URL parsing errors**: Always handle potential URL constructor errors
- **Ignoring encoding issues**: Be aware of how different characters are encoded
- **Base URL confusion**: When resolving relative URLs, make sure the base URL is correct
- **Protocol security**: Be careful when accepting user input for protocols (e.g., validate against allowed list)

## Resources

- [Official Node.js URL Documentation](https://nodejs.org/api/url.html)
- [MDN URL API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/URL)
