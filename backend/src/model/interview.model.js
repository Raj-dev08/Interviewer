import mongoose from "mongoose";

const interviewShchema = new mongoose.Schema(
    {
        type:{
            type:String,
            enum: ["case","dsa-only","system_design","mixed"],//mixed is sde type dsa+sysdes
            required: true
        },
        userId:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        questions:{
            dsa:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "DSA",
                }
            ],
            sysDes:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "SystemDesign",
                }
            ],
            case:[
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "CaseStudy",
                }
            ]  
        },
        status:{
            type: String,
            enum: ["started","cancelled","scheduled","completed"],
            default:"scheduled"
        },
        interviewRating:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Rating",
        },
        duration:{//will be calculated by either ai or based on questions duration
            type: Number,
            required: true
        }
    },{
        timestamps: true,
    }
)

interviewShchema.pre("validate", function (next) {
    const { type, questions } = this
    if (type === "case" && (!questions.case || questions.case.length === 0  || questions.dsa.length > 0 || questions.sysDes.length > 0 )){
        return next(new Error("Case interview must have only case questions"))
    }

    if (type === "dsa-only" && (!questions.dsa || questions.dsa.length === 0  || questions.case.length > 0 || questions.sysDes.length > 0 )){
        return next(new Error("Dsa interview must have only dsa questions"))
    }

    if (type === "system_design" && (!questions.sysDes || questions.sysDes.length === 0  || questions.case.length > 0 || questions.dsa.length > 0 )){
        return next(new Error("System design interview must have only system design questions"))
    }

    if (type === "mixed" && (!questions.dsa || questions.dsa.length === 0  || !questions.sysDes || questions.sysDes.length === 0 || questions.case || questions.case.length > 0 )){
        return next(new Error("Mixed interview must have both dsa and system design questions"))
    }
})

const Interview = mongoose.model("Interview",interviewShchema)

export default Interview;