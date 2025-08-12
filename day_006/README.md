# Day 6: Professional MongoDB Connection Setup

This project demonstrates how to set up a professional MongoDB connection in a Node.js/Express application using MongoDB Atlas.

## 🚀 Project Structure

```
day_006/
├── config/
│   └── db.config.js     # Database connection configuration
├── .env                 # Environment variables (git-ignored)
├── .env.sample          # Environment variables template
├── package.json         # Project dependencies and scripts
└── server.js            # Main application entry point
```

## 📋 Prerequisites

- Node.js (v14+ recommended)
- npm or yarn
- MongoDB Atlas account

## 🔧 Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd day_006
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn
   ```

3. **Set up MongoDB Atlas**
   - Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
   - Create a new project and cluster
   - Create a database user and get the connection string
   - Whitelist your IP address

4. **Configure environment variables**
   ```bash
   cp .env.sample .env
   # Edit .env with your MongoDB Atlas connection string
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔌 Database Configuration

The database connection is configured in `config/db.config.js` with the following features:

- Environment-based configuration
- Connection event handling
- Graceful shutdown on process termination
- Error handling and logging

### Connection Options

- `useNewUrlParser`: Enables new URL parser
- `useUnifiedTopology`: Enables new server discovery and monitoring engine
- `serverSelectionTimeoutMS`: Timeout for server selection
- `socketTimeoutMS`: Socket timeout for operations

## 🌐 MongoDB Atlas Setup Guide

### 1. Create a Free Cluster
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Click "Build a Database"
3. Select the free shared cluster (M0)
4. Choose a cloud provider and region
5. Click "Create Cluster"

### 2. Create a Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Select "Password" authentication
4. Enter a username and password
5. For development, select "Atlas admin" role
6. Click "Add User"

### 3. Whitelist Your IP
1. Go to "Network Access"
2. Click "Add IP Address"
3. Add your current IP or `0.0.0.0/0` (not recommended for production)
4. Click "Confirm"

### 4. Get Connection String
1. Go to "Database"
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" and copy the connection string

## ⚙️ Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/
DB_NAME=your_database_name
```

## 🛠️ Available Scripts

- `npm run dev`: Start development server with nodemon
- `npm start`: Start production server
- `npm test`: Run tests (to be implemented)

## 🔄 Connection Events

The application handles the following MongoDB connection events:

- `connected`: When successfully connected to the database
- `error`: When there's a connection error
- `disconnected`: When the connection is lost
- `SIGINT`: Handles graceful shutdown on process termination

## 🚨 Error Handling

The application includes basic error handling for:
- Database connection failures
- Unhandled promise rejections
- Process termination signals

## 📚 Resources

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Mongoose Documentation](https://mongoosejs.com/docs/guide.html)
- [Node.js MongoDB Driver](https://docs.mongodb.com/drivers/node/current/)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

Built with ❤️ by kush kumar