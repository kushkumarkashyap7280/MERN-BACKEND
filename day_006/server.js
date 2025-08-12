/* day_006 :

 --------------------------------------------------------

// some developer prefer connection and app making using express in same server file 
// best appraoch  is making connection in different file and app in different file


// first approach : 

import dotenv from "dotenv";

dotenv.config({path : './.env'});

import express from "express";

const app = express();


//  connect db directly in server.js
import mongoose from "mongoose";
(async () => {
    try {
        mongoose.connect(`${process.env.MONGODB_URI}${process.env.DB_NAME}`);
        console.log("db connected successfully");
        app.on("error", (error) => {
            console.log("db connection error",error);
            throw error;
        })

        app.listen(process.env.PORT,() => {
            console.log(`Server running on http://localhost:${process.env.PORT}`);
        });
        
    } catch (error) {
        console.log("db connection error",error);
        throw error;
        
    }
})();



app.get("/", (req, res) => {
    res.send("Hello World!");
});

///////////////////////////////////////////////////////////////////////////////

// second appraoch :

import dotenv from "dotenv";  //very important : always prefer to load enviroment variable first 

dotenv.config({path : './.env'});



import express from "express";
import connectDb from "./config/db.js";
const app = express();

connectDb();

 ------------------------------------- */