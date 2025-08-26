# Day 8: User Authentication & Video Platform Data Models

## 📖 What You'll Learn Today

### 🌐 Core Features:

- ✅ **Secure User Authentication** - JWT & Refresh Token implementation
- ✅ **Password Encryption** - Bcrypt hashing for secure storage
- ✅ **Data Modeling** - MongoDB schemas for users and videos
- ✅ **Mongoose Hooks** - Pre-save middleware for password hashing
- ✅ **Video Platform Architecture** - Building blocks for a video sharing platform

## 🏗️ Project Structure

```
day_008/
├── config/
│   └── db.config.js     # Database configuration
├── models/
│   ├── user.model.js    # User schema with auth methods
│   └── video.model.js   # Video content schema
├── src/
│   └── app.js           # Express application setup
├── utils/
│   ├── apiError.js      # Custom error handling
│   ├── apiRes.js        # Standardized API responses
│   ├── asyncHandler.js  # Async/await error wrapper
│   └── staticFiles.js   # Static file serving utility
├── .env.sample          # Environment variables template
└── server.js            # Application entry point
```

## 🛠️ Key Components

### 1. User Authentication System (`models/user.model.js`)

- **JWT-based Authentication**
    - Access tokens for short-term authorization
    - Refresh tokens for obtaining new access tokens
- **Password Security**
    - Bcrypt hashing with configurable salt rounds
    - Pre-save hooks for automatic password encryption
- **User Profile Management**
    - Username & email validation
    - Profile images (avatar and cover image)
    - Watch history tracking

```javascript
// JWT Token Structure
/*
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30

Structure:
header.payload.signature

header: { "alg": "HS256", "typ": "JWT" }
payload: { "sub": "1234567890", "name": "John Doe", "admin": true, "iat": 1516239022 }
signature: HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  your-256-bit-secret
)
*/
```

### 2. Video Platform Schema (`models/video.model.js`)

- **Content Management**
    - Video file storage
    - Thumbnail generation
    - Title and description
    - Duration tracking
- **Engagement Metrics**
    - View counter
    - Publication status
- **Ownership & Relations**
    - User-video relationship
    - Timestamp tracking

### 3. Authentication Methods

```mermaid
sequenceDiagram
    participant User
    participant Server
    participant Database

    User->>Server: Login Request (username/password)
    Server->>Database: Verify Credentials
    Database-->>Server: User Found
    Server->>Server: Compare Password with Bcrypt
    Server->>Server: Generate JWT Token
    Server->>Server: Generate Refresh Token
    Server-->>User: Return Tokens + User Data

    Note right of User: Later: Token Expired

    User->>Server: Request with Refresh Token
    Server->>Server: Verify Refresh Token
    Server->>Server: Generate New JWT Token
    Server-->>User: Return New JWT Token
```

### 4. Password Hashing Process

```mermaid
flowchart TD
    A[User Registration] --> B[Password Received]
    B --> C[Pre-save Hook Triggered]
    C --> D{Password Modified?}
    D -->|No| F[Continue Save]
    D -->|Yes| E[Generate Salt]
    E --> G[Hash Password with Bcrypt]
    G --> F
    F --> H[Save User to Database]

    style A fill:#e1f5fe,stroke:#01579b
    style H fill:#e8f5e9,stroke:#2e7d32
```

### 5. Mongoose Aggregate Pagination

The video schema includes the `mongoose-aggregate-paginate-v2` plugin, which enables:

- Efficient pagination of video results
- Complex aggregation pipelines
- Performance optimization for large datasets

```javascript
videoSchema.plugin(mongooseAggregatePaginate);
```

#### Middleware Details:

1. **CORS (Cross-Origin Resource Sharing)**

    ```javascript
    app.use(
        cors({
            origin: process.env.CORS_ORIGIN,
            credentials: true,
        })
    );
    ```

    - **Purpose**: Enables cross-origin requests from specified domains
    - **Why?**: Essential for APIs accessed by frontend applications on different domains
    - **Configuration**:
        - `origin`: Controls which domains can access the API (use `*` for development only)
        - `credentials`: Allows sending cookies across origins

2. **Body Parser: JSON**

    ```javascript
    app.use(express.json({ limit: "1mb" }));
    ```

    - **Purpose**: Parses incoming JSON payloads
    - **Why?**: Converts JSON request bodies into JavaScript objects
    - **Limit**: 1MB max payload size to prevent large uploads
    - **Content-Type**: `application/json`

3. **Body Parser: URL-encoded**

    ```javascript
    app.use(express.urlencoded({ extended: true, limit: "1mb" }));
    ```

    - **Purpose**: Parses URL-encoded form data
    - **Why?**: Handles form submissions and query parameters
    - **Extended**: `true` allows rich objects and arrays in URL-encoded data
    - **Content-Type**: `application/x-www-form-urlencoded`

4. **Static File Serving**

    ```javascript
    serveStaticFiles(app);
    ```

    - **Purpose**: Serves static files (images, PDFs, etc.)
    - **Why?**: Efficiently serves client-side assets
    - **Paths**:
        - `/uploads/images`
        - `/uploads/files`
        - `/uploads/media`

5. **Cookie Parser**
    ```javascript
    app.use(cookieParser());
    ```

    - **Purpose**: Parses cookies attached to client requests
    - **Why?**: Essential for session management and authentication
    - **Features**:
        - Parses `Cookie` header
        - Populates `req.cookies`
        - Handles signed cookies (if configured)

#### Middleware Execution Order:

```mermaid
graph LR
    A[Request] --> B[CORS]
    B --> C[Body Parsing]
    C --> D[Static Files]
    D --> E[Cookies]
    E --> F[Your Routes]
    F --> G[Response]

    style A fill:#e1f5fe,stroke:#01579b
    style G fill:#e8f5e9,stroke#2e7d32
    style B,C,D,E fill:#f3e5f5,stroke#7b1fa2
    style F fill:#e8f5e9,stroke#2e7d32
```

#### Why This Order Matters:

1. **CORS First**: Handle cross-origin requests before any other processing
2. **Body Parsing Early**: Parse request bodies before route handlers need them
3. **Static Files Before Routes**: More efficient than hitting route handlers for static assets
4. **Cookies Before Routes**: Parse cookies before authentication/authorization middleware
5. **Your Routes Last**: Custom route handlers execute after all standard processing

## 🌐 HTTP Status Codes Reference

<details>
<summary><strong>📖 Standard HTTP Status Codes</strong></summary>

### 1xx: Informational

- `100 Continue` - The server has received the request headers
- `101 Switching Protocols` - The requester has asked to switch protocols
- `102 Processing` - The server is processing the request

### 2xx: Success

- `200 OK` - Standard response for successful requests
- `201 Created` - Request fulfilled, new resource created
- `202 Accepted` - Request accepted but processing not complete
- `204 No Content` - Request successful but no content to return

### 3xx: Redirection

- `301 Moved Permanently` - Resource permanently moved to new URL
- `302 Found` - Resource temporarily moved to different URL
- `304 Not Modified` - Resource not modified since last request
- `307 Temporary Redirect` - Resource temporarily moved to different URL (method preserved)

### 4xx: Client Errors

- `400 Bad Request` - Server cannot process the request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Server refuses to authorize the request
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - HTTP method not supported
- `406 Not Acceptable` - Requested format not available
- `408 Request Timeout` - Server timed out waiting for request
- `409 Conflict` - Request conflicts with current state
- `422 Unprocessable Entity` - Server understands but cannot process the request
- `429 Too Many Requests` - Too many requests in given time

### 5xx: Server Errors

- `500 Internal Server Error` - Generic server error
- `501 Not Implemented` - Server lacks ability to fulfill request
- `502 Bad Gateway` - Invalid response from upstream server
- `503 Service Unavailable` - Server temporarily unavailable
- `504 Gateway Timeout` - Upstream server failed to respond
- `505 HTTP Version Not Supported` - Server doesn't support HTTP version

### Common Status Codes in REST APIs

| Code | Status                | Description                    |
| ---- | --------------------- | ------------------------------ |
| 200  | OK                    | Success                        |
| 201  | Created               | Resource created               |
| 204  | No Content            | Success but no content         |
| 400  | Bad Request           | Invalid request format         |
| 401  | Unauthorized          | Authentication required        |
| 403  | Forbidden             | Insufficient permissions       |
| 404  | Not Found             | Resource not found             |
| 405  | Method Not Allowed    | HTTP method not allowed        |
| 409  | Conflict              | Resource conflict              |
| 422  | Unprocessable Entity  | Validation error               |
| 429  | Too Many Requests     | Rate limit exceeded            |
| 500  | Internal Server Error | Server error                   |
| 502  | Bad Gateway           | Invalid response from upstream |
| 503  | Service Unavailable   | Server temporarily down        |

### Best Practices

- Use appropriate status codes for responses
- Be consistent with status code usage
- Include meaningful error messages in the response body
- Document your API's status codes
- Use 2xx for successful operations
- Use 4xx for client-side errors
- Use 5xx for server-side errors

### References

- [MDN HTTP Status Codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [HTTP Status Codes (IETF)](https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml)
- [REST API Tutorial - Status Codes](https://restfulapi.net/http-status-codes/)
  </details>

## ⚙️ Environment Configuration (`.env.sample`)

```env
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb+srv://<user_name>:<db_password>@cluster0.kzx54ab.mongodb.net/
DB_NAME=DATABASE_NAME

# CORS Configuration
CORS_ORIGIN=*

# JWT (Access Token)
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d

# Password Hashing
BCRYPT_SALT_ROUNDS=10

# Refresh Token
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRES_IN=7d
```

## 🔐 JWT Authentication Flow

```mermaid
graph TD
    A[User Login] --> B[Validate Credentials]
    B --> C[Generate Access Token]
    B --> D[Generate Refresh Token]
    C --> E[Send to Client]
    D --> F[Store in Database]
    D --> E

    G[Protected Route] --> H[Verify Access Token]
    H -->|Valid| I[Access Granted]
    H -->|Invalid/Expired| J[Check Refresh Token]
    J -->|Valid| K[Generate New Access Token]
    J -->|Invalid| L[Require Login]
    K --> I
```

## 📦 User Schema Details

| Field          | Type       | Description                            |
| -------------- | ---------- | -------------------------------------- |
| `userName`     | String     | Unique username (indexed)              |
| `email`        | String     | Unique email address                   |
| `fullName`     | String     | User's full name (indexed)             |
| `avatar`       | String     | Profile picture URL                    |
| `coverImage`   | String     | Profile header image URL               |
| `watchHistory` | [ObjectId] | Array of watched video references      |
| `password`     | String     | Bcrypt hashed password                 |
| `refreshToken` | String     | Token for generating new access tokens |

## 📼 Video Schema Details

| Field         | Type     | Description                |
| ------------- | -------- | -------------------------- |
| `videoFile`   | String   | URL to the video file      |
| `thumbnail`   | String   | URL to the video thumbnail |
| `title`       | String   | Video title                |
| `desc`        | String   | Video description          |
| `duration`    | Number   | Video length in seconds    |
| `views`       | Number   | View counter (default: 0)  |
| `isPublished` | Boolean  | Publication status         |
| `owner`       | ObjectId | Reference to User schema   |

## 🚀 Getting Started

1. **Clone the repository**

    ```bash
    git clone <repository-url>
    cd day_008
    ```

2. **Install dependencies**

    ```bash
    npm install
    ```

3. **Configure environment**

    ```bash
    cp .env.sample .env
    # Update .env with your configuration
    ```

4. **Start the development server**
    ```bash
    npm run dev
    ```

## 🧪 Testing

```bash
# Run tests (if available)
npm test
```

## 🎯 Key Takeaways

- **Secure Authentication**: JWT implementation with refresh token strategy
- **Data Modeling**: Advanced MongoDB schema design with references
- **Password Security**: Bcrypt hashing and secure practices
- **Mongoose Features**: Pre-save hooks and aggregation plugins
- **Scalable Architecture**: Foundation for video platform functionality

## � Mongoose Methods Reference

### 📊 Document Methods vs Static Methods

Mongoose provides two ways to add custom methods to your models:

#### 1. Instance/Document Methods

Instance methods are available on document instances and are used to operate on individual documents.

```javascript
// Define an instance method
userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Using the instance method
const user = await User.findById(userId);
const isMatch = await user.isPasswordMatch('mypassword');
```

#### 2. Static Methods

Static methods are available on the model itself and typically perform operations across multiple documents.

```javascript
// Define a static method
userSchema.statics.findActiveUsers = function() {
    return this.find({ active: true });
};

// Using the static method
const activeUsers = await User.findActiveUsers();
```

### 🔍 Mongoose Query Methods

| Method | Description | Example |
|--------|-------------|---------|
| `find()` | Find all matching documents | `User.find({ role: 'admin' })` |
| `findOne()` | Find first matching document | `User.findOne({ email: 'user@example.com' })` |
| `findById()` | Find document by its ID | `User.findById('64a2f5d12db55890c76e1234')` |
| `updateOne()` | Update first matching document | `User.updateOne({ _id: userId }, { $set: { active: true } })` |
| `updateMany()` | Update all matching documents | `User.updateMany({ role: 'user' }, { $set: { verified: true } })` |
| `deleteOne()` | Delete first matching document | `User.deleteOne({ _id: userId })` |
| `deleteMany()` | Delete all matching documents | `User.deleteMany({ createdAt: { $lt: oneYearAgo } })` |
| `countDocuments()` | Count matching documents | `User.countDocuments({ active: true })` |
| `exists()` | Check if matching document exists | `User.exists({ email: 'test@example.com' })` |

### 📊 Mongoose Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `$eq` | Equal to | `{ age: { $eq: 25 } }` |
| `$gt` | Greater than | `{ age: { $gt: 18 } }` |
| `$gte` | Greater than or equal | `{ age: { $gte: 21 } }` |
| `$lt` | Less than | `{ price: { $lt: 100 } }` |
| `$lte` | Less than or equal | `{ price: { $lte: 99.99 } }` |
| `$in` | In array | `{ category: { $in: ['drama', 'comedy'] } }` |
| `$nin` | Not in array | `{ category: { $nin: ['horror', 'thriller'] } }` |
| `$and` | Logical AND | `{ $and: [{ age: { $gt: 18 } }, { verified: true }] }` |
| `$or` | Logical OR | `{ $or: [{ premium: true }, { credits: { $gt: 100 } }] }` |
| `$regex` | Regular expression | `{ username: { $regex: /^john/i } }` |

### 🔄 Mongoose Middleware Types

| Hook Type | Description | Example Use Case |
|-----------|-------------|-----------------|
| `pre('save')` | Before saving a document | Password hashing |
| `post('save')` | After saving a document | Logging, sending notifications |
| `pre('validate')` | Before validation | Complex validation rules |
| `post('validate')` | After validation | Logging validation results |
| `pre('remove')` | Before removing a document | Cleanup related documents |
| `pre('findOneAndUpdate')` | Before update operations | Validate updates |
| `pre('aggregate')` | Before aggregation | Modify aggregation pipeline |

## 🔐 Token Types & Authentication Methods

### 🌟 Common Token Types

| Token Type | Description | Use Cases | Pros | Cons |
|------------|-------------|-----------|------|------|
| **JWT (JSON Web Token)** | Encoded JSON data with signature | API authentication, Stateless auth | Self-contained, Stateless, Cross-domain | Can't be invalidated easily, Size can grow |
| **Refresh Token** | Long-lived token to obtain new access tokens | Persistent authentication | Improves security, Enables token rotation | Requires storage, Adds complexity |
| **Access Token** | Short-lived token for resource access | API authorization | Short lifespan limits damage if stolen | Requires frequent renewal |
| **Bearer Token** | Token that grants access to bearer | API access, OAuth | Simple to use | Must be protected in transit |
| **ID Token** | Contains user identity information | Authentication, Single Sign-On | User identity verification | Not for authorization |
| **Session Token** | Server-side session identifier | Traditional web authentication | Easy to invalidate, Stateful | Requires server storage, CSRF concerns |

### 🔑 Token Storage Strategies

1. **HTTP-only Cookies**
   - Pros: Protected from JS access, Sent automatically with requests
   - Cons: CSRF vulnerabilities, Domain restrictions

2. **Local Storage**
   - Pros: Simple to implement, Persists after browser close
   - Cons: Vulnerable to XSS attacks, Limited to single domain

3. **Session Storage**
   - Pros: Cleared when tab/browser closes, Domain-restricted
   - Cons: Vulnerable to XSS attacks, Lost on tab close

4. **Memory (JavaScript variables)**
   - Pros: Cleared on page refresh, Not accessible via XSS
   - Cons: Lost on page refresh, Doesn't persist

### 📡 JWT vs Session Authentication

```mermaid
graph TD
    subgraph "JWT Authentication"
    A1[Client] -->|1. Login Request| B1[Server]
    B1 -->|2. Verify Credentials| B1
    B1 -->|3. Generate JWT| B1
    B1 -->|4. Return JWT| A1
    A1 -->|5. Store JWT| A1
    A1 -->|6. Request with JWT| B1
    B1 -->|7. Verify JWT Signature| B1
    B1 -->|8. Return Response| A1
    end

    subgraph "Session Authentication"
    A2[Client] -->|1. Login Request| B2[Server]
    B2 -->|2. Verify Credentials| B2
    B2 -->|3. Create Session| C2[Session Store]
    B2 -->|4. Return Session Cookie| A2
    A2 -->|5. Store Cookie| A2
    A2 -->|6. Request with Cookie| B2
    B2 -->|7. Validate Session| C2
    B2 -->|8. Return Response| A2
    end

    style A1 fill:#e1f5fe,stroke:#01579b
    style B1 fill:#e8f5e9,stroke:#2e7d32
    style A2 fill:#e1f5fe,stroke:#01579b
    style B2 fill:#e8f5e9,stroke:#2e7d32
    style C2 fill:#fff9c4,stroke:#f57f17
```

### 🛡️ JWT Security Best Practices

1. **Use Short Expiration Times**: Keep access tokens short-lived (15-60 minutes)
2. **Implement Token Rotation**: Use refresh tokens to get new access tokens
3. **Use Strong Secrets**: Generate cryptographically secure secrets for signing
4. **Include Limited Data**: Keep payload small and exclude sensitive information
5. **Use HTTPS**: Always transmit tokens over encrypted connections
6. **Implement Proper Validation**: Validate all tokens on the server-side
7. **Consider Token Revocation Strategies**: Implement a blacklist or version system
8. **Use Appropriate Signature Algorithm**: Prefer RS256 over HS256 for larger systems

## �📚 Resources

- [JWT.io](https://jwt.io/) - JWT token debugging and verification
- [Bcrypt Documentation](https://github.com/kelektiv/node.bcrypt.js)
- [Mongoose Documentation](https://mongoosejs.com/docs/)
- [Express.js Documentation](https://expressjs.com/)

## 🔄 Previous Day's Work

For middleware architecture and utility functions, please refer to [Day 7's Documentation](../day_007/README.md).

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  Made with ❤️ by kush kumar
</div>
