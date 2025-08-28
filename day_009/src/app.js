// day_007 ---------------------------------------------------------
import express from "express";
import cookieParser from "cookie-parser";
import serveStaticFiles from "../utils/staticFiles.js";
import cors from "cors";


const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}))

app.use(express.json({limit : "1mb"}));
app.use(express.urlencoded({extended: true, limit : "1mb"}));

serveStaticFiles(app);

app.use(cookieParser());

export default app;
// -------------------------------------------------------------
