import mongoose from "mongoose";


const orderedProductsSchema = mongoose.Schema({
    name : {
        type : String,
        required : true
    },
    productId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Product"
    },
    quantity : {
        type : Number,
        default : 1
    },
    price : {
        type : Number,
        required : true
    },
    sellerId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},
{
    timestamps : true
})

export const OrderedProducts = mongoose.model("OrderedProducts",orderedProductsSchema);