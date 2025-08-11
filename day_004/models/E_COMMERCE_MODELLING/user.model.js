import mongoose from "mongoose";

const userSchema = mongoose.Schema({

    email : {
        type : String,
        required : true,
        unique : true,
        lowercase : true
    },
    fullName :{
        type : String,
        required : true
    },
    userName : {
        type : String,
        required : true,
        unique : true,
        lowercase : true
    },
    password :{
        type : String,
        required : true
    },
    avatar : {
        type : String,
        required : true
    },
    userType :{
        type : String,
        enum : [ "customer","seller", "admin"],
        default : "customer"
    },
    sellerCategoryId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category"
    },
    orders : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Order"
        }
    ]

},
{
    timestamps : true
}
)

export const User = mongoose.model("User",userSchema);