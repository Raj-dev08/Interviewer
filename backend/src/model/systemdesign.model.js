import mongoose from "mongoose";

const systemDesignSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        constraints: { // just a string for now . It tells what constraints to keep in mind while designing the system (e.g. "Design a URL shortening service like bit.ly that can handle 100 million users and 1 billion URLs. Consider scalability, reliability, and security.")
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
        },
        duration: { // expected duration of the interview in minutes (e.g. 45)
            type: Number,
            required: true,
        },
        topics:[String], // Array of topics covered (e.g. "scalability", "database design", "caching")
        companyTags: [String], // Array of companies that have asked this question (e.g. Google, Amazon)
        isPremium: {
            type: Boolean,
            default: false,
        },
        correctAnswerFlow: [
            {
                title: { //the high level title of the step
                    type: String,
                    required: true,
                },
                approach: { // the approach with the corresponding title
                    type: String,
                    required: true,
                },
                step:{ // the step number to maintain the order of the steps
                    type: Number,
                    required: true,
                }
            }
        ], //an array of approaches with steps to solve the problem. This is meant to give just the direction to the interviewer and not a complete solution.
        followUp: [String], // Follow-up questions to ask after the main question (e.g. "How would you handle database sharding?", "How would you ensure data consistency across distributed systems?")
        hints: [String], // Hints for guiding the candidate (e.g. "Think about the core components of a URL shortening service", "Consider using a hash function to generate short URLs")
        addedBy: { // Reference to the user who added the question
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        rating: { // Average rating from users
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalRatings: { // Total number of ratings received (for calculating average rating)
            type: Number,
            default: 0,
        },
        evaluation: [//To score the user based on their approach
            {
                title: {
                    type: String,
                    required: true,
                },
                description: {
                    type: String,
                    required: true,
                },
                evalType:{
                    type: String,
                    enum: ["boolean","approx"], // boolean for must do yes or no stuff and approx for approximate solutions like not boolean yes or no answers
                    default: "approx"
                },
                weight: {
                    type: Number,
                    required: true,
                    min: 0,
                    max: 1,
                }
            }
        ]
            
        // No test cases or validation code for system design questions as they are open-ended and subjective in nature
    },{
        timestamps: true,
    }
)

systemDesignSchema.pre("validate", function (next) {
  if (this.evaluation && this.evaluation.length > 0) {
    const totalWeight = this.evaluation.reduce((sum, e) => sum + e.weight, 0);

    if (Math.abs(totalWeight - 1) > 0.01) {
      return next(new Error("Evaluation weights must sum to 1")); //to maintain relative importance
    }
  }
  next();
});

const SystemDesign = mongoose.model("SystemDesign", systemDesignSchema);

export default SystemDesign;