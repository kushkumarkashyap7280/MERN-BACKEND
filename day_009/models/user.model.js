// ---------------------------------------- day 8 ---------------------------
import { Schema, model } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true,
            index: true,
            unique: true,
            lowercase: true,
        },
        email: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            lowercase: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true,
            lowercase: true,
        },
        avatar: {
            type: String,
            required: true,
        },
        avatarId: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String,
        },
        coverImageId: {
            type: String,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video",
            },
        ],
        password: {
            type: String,
            required: [true, "password is required"],
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);


// save password but in hashing form
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const salt = await bcrypt.genSalt(rounds);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});


// lets see if password is correct while login 

userSchema.methods.isPasswordMatch = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// generate jwt token
userSchema.methods.generateJwtToken = function () {
    return jwt.sign({ id: this._id,
         email : this.email,
          userName : this.userName,
          fullName : this.fullName
     }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};


// generate refresh token
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        { id: this._id,
         }
        , process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN,
    });
};

const User = model("User", userSchema);

export default User;



/// jwt 

/*
this is a jwt token

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30


it is three parts : header.payload.signature

header : { "alg": "HS256", "typ": "JWT" }

payload : { "sub": "1234567890", "name": "John Doe", "admin": true, "iat": 1516239022 }

signature : HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  your-256-bit-secret
)

*/


// -----------------------------------------------------------------------
