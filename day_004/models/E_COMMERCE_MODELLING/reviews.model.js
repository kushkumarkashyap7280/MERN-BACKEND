import mongoose from "mongoose";

const reviewSchema = mongoose.Schema({
    customerId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    productId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
    },
    commented : {
        type : String,
        required : true
    },
    rating : {
        type : Number,
        required : true
    }
},
{
    timestamps : true
})

export const Review = mongoose.model("Review",reviewSchema);