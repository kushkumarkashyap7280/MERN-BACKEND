import mongoose from "mongoose";


const orderSchema = mongoose.Schema({
    orderedProducts : [
        { 
            type : mongoose.Schema.Types.ObjectId,
            ref : "OrderedProducts"
            
        }
    ],
    totalItems : {
        type :  Number,
        default : 0
    },
    totalPrice : {
        type : Number,
        default : 0
    },
    paymentStatus : {
        type : String,
        enum : ["pending","completed","failed"],
        default : "pending"
    },
    paymentMethod : {
        type : String,
        enum : ["cod","online"],
        default : "cod"
    },
    status  : {
        type : String,
        enum : ["pending","cancelled","packaging","shipped","delivering","delivered"],
        default : "pending"
    },
    customerId :{
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
    

},
{
    timestamps :true
})

export const Order = mongoose.model("Order",orderSchema);