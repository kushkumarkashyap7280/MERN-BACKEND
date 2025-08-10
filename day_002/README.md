# 📅 Day 002 - Express Server & Environment Setup

<div align="center">

```
🎯 DAY 2 LEARNING OBJECTIVES 🎯

Express.js Server Creation
Request & Response Objects Deep Dive
Environment Variables & Security
Development Tools (Nodemon)
ES Modules vs CommonJS
```

</div>

---

## 🚀 Express.js Server Implementation

### 📋 **Project Overview**
Building upon Day 1's theoretical foundation, Day 2 focuses on creating a practical Express.js server with proper development setup, environment configuration, and understanding the core request-response cycle.

## Package.json Initialization

During the setup of this project, we encountered an ES Module loading warning and successfully created a package.json file:

```
node.js is loading ES Module C:\Users\kushk\AppData\Roaming\npm\node_modules\npm\node_modules\supports-color\index.js using require().
Support for loading ES Module in require() is an experimental feature and might change at any time
(Use `node --trace-warnings ...` to show where the warning was created)
This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help init` for definitive documentation on these fields
and exactly what they do.

Use `npm install <pkg>` afterwards to install a package and
save it as a dependency in the package.json file.

Press ^C at any time to quit.
package name: (day_002) just_to_overview
version: (1.0.0)                                                                                                           
description: this is just for overview how backend and frontend works
entry point: (index.js)
test command:                                                                                                              
git repository:                                                                                                            
keywords: overview
author: kush kumar                                                                                                         
license: (ISC)
type: (commonjs) module
About to write to C:\Users\kushk\OneDrive\Desktop\DSA AND DEV\MERN-BACKEND\day_002\package.json:

{
  "name": "just_to_overview",
  "version": "1.0.0",
  "description": "this is just for overview how backend and frontend works",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "overview"
  ],
  "author": "kush kumar",
  "license": "ISC",
  "type": "module"
}


Is this OK? (yes) y
```

---

## 🔍 Deep Dive: Express Request & Response Objects

### 📥 **Understanding the Request Object (req)**

When you hit `http://localhost:3000/` in your browser, Express creates a massive request object containing all the information about the incoming HTTP request. Here's what our code reveals:

```javascript
app.get('/', (req, res) => {
    console.log("==================== req is =======================", req);
    // This logs the ENTIRE request object - it's huge!
});
```

#### 🗂️ **Key Request Object Properties**

| Property | Description | Example |
|----------|-------------|---------|
| `req.method` | HTTP method used | `'GET'`, `'POST'`, `'PUT'`, `'DELETE'` |
| `req.url` | The URL path | `'/'`, `'/about'`, `'/api/users'` |
| `req.headers` | All HTTP headers | `{ 'user-agent': 'Mozilla/5.0...', 'host': 'localhost:3000' }` |
| `req.query` | URL query parameters | `?name=john&age=25` becomes `{ name: 'john', age: '25' }` |
| `req.params` | Route parameters | `/users/:id` gives `{ id: '123' }` |
| `req.body` | Request body data | Form data, JSON payload |

#### 🌐 **Real Request Object Structure**

Based on our console output, a real request object contains:

```javascript
// Socket Information
req.socket = {
    connecting: false,
    _hadError: false,
    server: Server { /* Express server instance */ },
    parser: HTTPParser { /* HTTP parsing logic */ }
}

// HTTP Version & Headers
req.httpVersion = '1.1'
req.rawHeaders = [
    'Host', 'localhost:3000',
    'Connection', 'keep-alive',
    'User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)...',
    'Accept', 'text/html,application/xhtml+xml...'
]

// Request Details
req.method = 'GET'
req.url = '/'
req.complete = false  // Still receiving data
```

### 📤 **Understanding the Response Object (res)**

The response object is equally complex and contains methods to send data back to the client:

```javascript
app.get('/', (req, res) => {
    console.log("========= response ==========", res);
    res.send("this is our first basic fullstack in mern");
});
```

#### 🛠️ **Key Response Object Methods**

| Method | Purpose | Example |
|--------|---------|---------|
| `res.send()` | Send any type of response | `res.send("Hello World")` |
| `res.json()` | Send JSON response | `res.json({ message: "Success" })` |
| `res.status()` | Set status code | `res.status(404).send("Not Found")` |
| `res.redirect()` | Redirect to another URL | `res.redirect('/login')` |
| `res.render()` | Render template | `res.render('index', { title: 'Home' })` |

---

## ⚙️ Development Tools & Environment Setup

### 🔄 **Step 2: Nodemon - Auto-Restart Development Server**

**Problem**: Every time you make changes to your code, you need to manually restart the server with `npm run dev`.

**Solution**: Nodemon automatically monitors your files and restarts the server when changes are detected.

```bash
# Install nodemon as a development dependency
npm install --save-dev nodemon
```

#### 📝 **Package.json Scripts Configuration**

```json
{
  "scripts": {
    "dev": "nodemon index.js",    // Development with auto-restart
    "start": "node index.js",     // Production mode
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

#### 🎯 **Why Nodemon for Development Only?**

- **Development**: You want instant feedback when coding
- **Production**: The hosting server handles restarts automatically
- **DevDependency**: Only needed during development, not in production

### 🔐 **Step 3: Environment Variables & Security**

**Problem**: Sensitive data like API keys, database URLs, and ports shouldn't be hardcoded in your source code.

**Solution**: Use environment variables stored in a `.env` file.

#### 🛡️ **Security Best Practices**

```javascript
// ❌ BAD: Hardcoded sensitive data
const JWT_SECRET = "my-super-secret-key";
const DATABASE_URL = "mongodb://username:password@localhost:27017/mydb";

// ✅ GOOD: Environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const DATABASE_URL = process.env.DATABASE_URL;
```

#### 📁 **Environment Files Setup**

**`.env`** (Never commit to Git):
```env
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
DATABASE_URL=mongodb://localhost:27017/myapp
```

**`.env.sample`** (Safe to commit):
```env
PORT=YOUR PORT
JWT_SECRET=YOUR JWT SECRET
DATABASE_URL=YOUR DATABASE URL
```

#### 🔧 **Dotenv Package Implementation**

```javascript
import express from "express";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const app = express();

// Use environment variable instead of hardcoded port
app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
});
```

#### 🌍 **Understanding the Process Object**

When you log `process.env.PORT`, you're accessing Node.js's global `process` object:

```javascript
console.log("=================process==========", process);
```

The process object contains:
- **Environment variables**: `process.env`
- **Command line arguments**: `process.argv`
- **Node.js version**: `process.version`
- **Platform info**: `process.platform`, `process.arch`
- **Memory usage**: `process.memoryUsage()`

---

## 📦 Dependencies & Package Management

### 🏗️ **Project Dependencies**

```json
{
  "dependencies": {
    "dotenv": "^17.2.1",    // Environment variable management
    "express": "^5.1.0"     // Web framework
  }
}
```

#### 🔍 **Dependency Types Explained**

| Type | Purpose | When Installed | Example |
|------|---------|----------------|---------|
| **dependencies** | Required in production | Always | `express`, `dotenv` |
| **devDependencies** | Development tools only | Only during development | `nodemon`, `jest` |

```bash
# Install production dependency
npm install express dotenv

# Install development dependency  
npm install --save-dev nodemon

# Global installation (available system-wide)
npm install -g nodemon
```

### 🎯 **NPM Command Shortcuts**

```bash
# These are equivalent
npm install package_name
npm i package_name

# Global installation
npm install -g package_name
npm i -g package_name
```

---

## 🔄 ES Modules vs CommonJS

### 📋 **Module System Comparison**

Our project uses **ES Modules** (modern JavaScript modules):

```json
{
  "type": "module"  // Enables ES6 import/export syntax
}
```

#### 🆚 **Syntax Differences**

| Feature | ES Modules (Modern) | CommonJS (Traditional) |
|---------|-------------------|----------------------|
| **Import** | `import express from "express"` | `const express = require("express")` |
| **Export** | `export default app` | `module.exports = app` |
| **File Extension** | `.js` (with "type": "module") | `.js` (default) |
| **Loading** | Asynchronous | Synchronous |

#### ✅ **Why ES Modules?**

- **Modern Standard**: Latest JavaScript specification
- **Better Tree Shaking**: Unused code elimination
- **Static Analysis**: Better tooling support
- **Async Loading**: Non-blocking module loading
- **Browser Compatible**: Same syntax in browser and Node.js

---

## 🛣️ Route Implementation

### 🎯 **Basic Route Structure**

```javascript
app.get("/", (req, res) => {
    res.send("this is our first basic fullstack in mern");
});

app.get('/about', (req, res) => {
    res.send("<h1>about page</h1>");
});
```

#### 📊 **Route Breakdown**

| Component | Purpose | Example |
|-----------|---------|---------|
| **HTTP Method** | Type of request | `app.get()`, `app.post()`, `app.put()`, `app.delete()` |
| **Route Path** | URL endpoint | `"/"`, `"/about"`, `"/api/users"` |
| **Callback Function** | Request handler | `(req, res) => { /* logic */ }` |
| **Response** | Data sent back | `res.send()`, `res.json()`, `res.render()` |

---

## 🔧 Development Workflow

### 🚀 **Complete Development Setup**

1. **Initialize Project**:
   ```bash
   npm init
   ```

2. **Install Dependencies**:
   ```bash
   npm install express dotenv
   npm install --save-dev nodemon
   ```

3. **Create Environment File**:
   ```bash
   echo "PORT=3000" > .env
   ```

4. **Setup Git Ignore**:
   ```bash
   echo "node_modules" > .gitignore
   echo ".env" >> .gitignore
   ```

5. **Start Development**:
   ```bash
   npm run dev
   ```

### 📈 **Expected Output**

When you run `npm run dev`, you should see:

```bash
[nodemon] restarting due to changes...
[nodemon] starting `node index.js`
[dotenv@17.2.1] injecting env (1) from .env
Example app listening on port 3000
```

---

## 💡 Key Takeaways

### 🎯 **What You Learned**

1. **Express Server Creation**: Basic HTTP server with routing
2. **Request/Response Cycle**: Deep understanding of req/res objects
3. **Development Tools**: Nodemon for auto-restart functionality
4. **Environment Security**: Protecting sensitive data with .env files
5. **Modern JavaScript**: ES Modules vs CommonJS
6. **Package Management**: Dependencies vs devDependencies

### 🔄 **Next Steps**

- Learn middleware concepts
- Implement request body parsing
- Add error handling
- Create RESTful API endpoints
- Connect to a database

### 📚 **Additional Resources**

- **Git & GitHub**: Essential for version control
- **HTTP Methods**: GET, POST, PUT, DELETE
- **Status Codes**: 200, 404, 500, etc.
- **JSON**: Data exchange format

## How to Run the Project

The package.json includes several npm scripts for running the application:

```json
"scripts": {
  "dev": "node index.js",
  "start": "node index.js", 
  "test": "echo \"Error: no test specified\" && exit 1"
}
```

### Available Commands:

- **Development mode**: `npm run dev`
  - Runs the application using Node.js
  - Best for development and testing

- **Production mode**: `npm start`
  - Standard way to start the application
  - Same as dev mode in this basic setup

- **Run tests**: `npm test`
  - Currently shows a placeholder message
  - Can be configured later with actual test commands

### Quick Start:
```bash
# Navigate to the project directory
cd day_002

# Run in development mode
npm run dev

# OR run in production mode
npm start
```

## Git Configuration

### .gitignore Setup
**Important**: Always create a `.gitignore` file in your project root to prevent `node_modules` from being committed to Git:

```gitignore
node_modules
```

**Why this matters**:
- `node_modules` contains thousands of dependency files
- These files are large and change frequently
- They can be regenerated using `npm install`
- Including them in Git causes repository bloat and merge conflicts

**Best Practice**: Add `.gitignore` as the first step in every Node.js project!

## Notes

- **ES Module Warning**: The warning about loading ES modules using `require()` is expected behavior in newer Node.js versions and doesn't affect functionality.
- **Project Type**: Set to "module" to enable ES6 import/export syntax
- **Purpose**: This project serves as an overview of how backend and frontend work together
