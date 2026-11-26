import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name:{
            type:String,
            required:true,
        },
        email:{
            type:String,
            required:true,
            unique:true,
        },
        password:{
            type:String,
            required:true,
            minlength:4
        },
        refreshTokenVersion:{
            type:Number,
            default:0,
        },
        isDisabled:{
            type:Boolean,
            default:false,
        },
        isPaid: { //Uses this to make verified models ( just dummy payment for now)
            type: Boolean,
            default: false,
        },
        currentSubscription: { //POSTGRESQL subscription id
            type: String,
            default: ""
        },
        isOwner: {
            type: Boolean,
            default: false,
        },
        //has ratings but not populated here to avoid extra memory usage, can be fetched by userid when needed
    }
)

const User = mongoose.model("User",userSchema)

export default User;