import mongoose from "mongoose";

const productSchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    desc : {
        type : String,
        required : true
    },
    price : {
        type : Number,
        required : true
    },
    quantity : {
        type : Number,
        required : true
    },
    categoryId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Category"
    },
    image : {
        type : String,
        required : true
    },
    specialFeatures  : {
        type : String,
    },
    ratings : {
        type : Number,
        default : 0
    },
    reviews : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : "Review"
        }
    ],
    totalSelled : {
        type : Number,
        default : 0
    },
    sellerId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }

},{
    timestamps : true
})

export const Product = mongoose.model("Product",productSchema);