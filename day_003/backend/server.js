import express from "express";

// way to fix cors issue 
import cors from "cors";

import dotenv from "dotenv";

dotenv.config();

// port
const PORT = process.env.PORT || 3000;

// creating server
const app = express();

// use cors  when origin is static 
// app.use(cors({
//     origin: "http://localhost:5173", // frontend URL
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true // if you need cookies/auth headers
// }));

/////////////////////////////////////////////////////////////////////////////////////
// third way  dynamically 

// ✅ Allowed origins list (from .env)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",") // comma-separated in .env
  : [];

// ✅ CORS middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS: Not allowed by server"));
    }
  },
  credentials: true
}));
/////////////////////////////////////////////////////////////////////////



// routes 

app.get('/', (req, res)=>{
    res.send("this is our first basic fullstack in mern")
})

// jokes route
app.get('/api/jokes', (req, res)=>{
    const jokes = [
        { id: 1, joke: "Why don’t skeletons fight each other?", punchline: "They don’t have the guts." },
        { id: 2, joke: "Why did the computer go to the doctor?", punchline: "Because it caught a virus." },
        { id: 3, joke: "Why can’t your nose be 12 inches long?", punchline: "Because then it’d be a foot." },
        { id: 4, joke: "Why was the math book sad?", punchline: "It had too many problems." },
        { id: 5, joke: "Why don’t eggs tell jokes?", punchline: "They’d crack each other up." },
        { id: 6, joke: "Why did the scarecrow win an award?", punchline: "Because he was outstanding in his field." },
        { id: 7, joke: "Why can’t you give Elsa a balloon?", punchline: "Because she’ll let it go." },
        { id: 8, joke: "Why was the JavaScript developer sad?", punchline: "Because he didn’t ‘null’ his feelings." },
        { id: 9, joke: "Why do cows have hooves instead of feet?", punchline: "Because they lactose." },
        { id: 10, joke: "Why did the coffee file a police report?", punchline: "It got mugged." }
      ];
      
    res.send(jokes)
})


// app listen

app.listen(PORT,()=>{
    console.log(`Server running on http://localhost:${PORT}`);
})


