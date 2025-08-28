# HTTP/HTTPS Modules

The HTTP and HTTPS modules are core to Node.js web development, allowing you to create web servers and make HTTP requests without any external dependencies.

## Key Features

- **Server Creation**: Create HTTP/HTTPS servers
- **Client Requests**: Make outgoing HTTP/HTTPS requests
- **Message Parsing**: Work with HTTP headers, methods, and bodies
- **Streaming**: Handle HTTP streams efficiently
- **Low-level Control**: Access to low-level HTTP features

## HTTP Server

### Creating a Basic HTTP Server

```javascript
import http from 'http';

const server = http.createServer((req, res) => {
  // Set status code and headers
  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  
  // Send response body
  res.end(JSON.stringify({
    message: 'Hello World',
    path: req.url
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### Request Object Properties

| Property          | Description                                            |
|-------------------|--------------------------------------------------------|
| `req.method`      | The HTTP method (GET, POST, etc.)                      |
| `req.url`         | The request URL                                        |
| `req.headers`     | Object containing request headers                      |
| `req.httpVersion` | HTTP version of the request                            |

### Response Object Methods

| Method                             | Description                                     |
|------------------------------------|-------------------------------------------------|
| `res.writeHead(statusCode, headers)` | Write status code and multiple headers         |
| `res.setHeader(name, value)`        | Set a single header                             |
| `res.write(chunk)`                  | Write response data (can be called multiple times) |
| `res.end([data])`                   | End the response, optionally sending final data |

## HTTP Client

### Making HTTP Requests

```javascript
import http from 'http';

const options = {
  hostname: 'api.example.com',
  port: 80,
  path: '/data',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  
  // Collect data chunks
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  // Process complete response
  res.on('end', () => {
    try {
      const parsedData = JSON.parse(data);
      console.log(parsedData);
    } catch (e) {
      console.error('Error parsing response:', e);
    }
  });
});

req.on('error', (error) => {
  console.error('Request error:', error);
});

// For POST requests, write to the request body
// req.write(JSON.stringify({ key: 'value' }));

req.end();
```

### Simplified GET Request

```javascript
import http from 'http';

http.get('http://api.example.com/data', (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
}).on('error', (err) => {
  console.error('Error: ', err.message);
});
```

## HTTPS Module

The HTTPS module extends the HTTP module with TLS/SSL support.

### Creating an HTTPS Server

```javascript
import https from 'https';
import fs from 'fs';

const options = {
  key: fs.readFileSync('private-key.pem'),
  cert: fs.readFileSync('certificate.pem')
};

const server = https.createServer(options, (req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Secure Hello World!');
});

server.listen(443, () => {
  console.log('HTTPS server running on port 443');
});
```

### Making HTTPS Requests

```javascript
import https from 'https';

const options = {
  hostname: 'api.example.com',
  port: 443,
  path: '/secure-data',
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(JSON.parse(data));
  });
});

req.on('error', (error) => {
  console.error(error);
});

req.end();
```

## Common HTTP Status Codes

| Code | Message               | Description                              |
|------|----------------------|------------------------------------------|
| 200  | OK                   | Request succeeded                        |
| 201  | Created              | Resource created successfully            |
| 204  | No Content           | Success but no content to return         |
| 400  | Bad Request          | Server couldn't understand the request   |
| 401  | Unauthorized         | Authentication required                  |
| 403  | Forbidden            | Server refuses to authorize              |
| 404  | Not Found            | Resource not found                       |
| 500  | Internal Server Error| Server encountered an error              |
| 503  | Service Unavailable  | Server temporarily unavailable           |

## Best Practices

1. **Handle errors properly**: Always add error listeners to requests and servers
2. **Use streams efficiently**: For large payloads, process data in chunks
3. **Set proper headers**: Including content-type, cache control, etc.
4. **Validate input**: Always validate and sanitize user input
5. **Use HTTPS in production**: For security and data integrity
6. **Implement proper timeout handling**: Prevent hanging connections
7. **Consider compression**: Use gzip/deflate when appropriate

## Common Pitfalls

- **Memory leaks**: Not properly ending requests or handling large payloads
- **Blocking operations**: Performing synchronous operations in request handlers
- **Missing error handling**: Not handling network errors or exceptions
- **Improper header handling**: Headers are case-insensitive but often treated otherwise
- **Not validating HTTPS certificates**: In production, always validate certificates

## Resources

- [Node.js HTTP Documentation](https://nodejs.org/api/http.html)
- [Node.js HTTPS Documentation](https://nodejs.org/api/https.html)
- [MDN HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
