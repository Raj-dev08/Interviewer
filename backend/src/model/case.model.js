import mongoose from "mongoose";

const caseSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        description: {
            type: String,
            required: true
        },
        difficulity:{
            type: String,
            enum: ["easy","medium","hard"],
            required: true
        },
        duration:{
            type:Number,
            required: true
        },
        domain:{
            type: String,
            enum: ["consulting", "finance", "product", "analytics", "general","sales","detective","medical"],
            required: true
        },
        type: {
            type: String,
            enum: ["market_sizing", "profitability", "product", "strategy", "data","persuasion","clue_finding","diagnosis"],
            required: true
        },
        previousContext: {//previous context for this case
            type: String,
            required: true
        },
        goal:{
            type: String,
            required: true
        },
        expectedApproach: [
            { 
                type: String,
                required: true
            }
        ],

        data:[
            {
                label: {
                    type: String,
                    required: true
                },
                value: {
                    type: String,
                    required: true,
                }
            }
        ],

        sampleSolution: {
            answer: {
                type: String,
                required: true
            },
            keyPoints: [
                {
                    type: String,
                    required: true
                }
            ]
        },

        hints:[String],
        followUps: [String],
        constraints: [String],
        evaluation: [
            {
                category:{
                    type: String,
                    required: true
                },
                description:{
                    type: String,
                    required: true
                },
                weight: {
                    type: Number,
                    required: true,
                    default: 0,
                    min:0,
                    max:1
                }
            }
        ],
        answerFormat: {
            type: String,
            enum: ["structured", "freeform", "stepwise"],
            default: "structured"
        },
        addedBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    }
)

caseSchema.pre("validate", function (next) {
  if ( this.evaluation && this.evaluation.length > 0){
    const totalWeight = this.evaluation.reduce((sum, e) => sum + e.weight, 0)

    if (Math.abs(totalWeight - 1) > 0.01) {
      return next(new Error("Evaluation weights must sum to 1")); //to maintain relative importance
    }
  }
  next();
});

const caseStudy = mongoose.model("CaseStudy",caseSchema)

export default caseStudy;