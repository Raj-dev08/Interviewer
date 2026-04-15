import mongoose from "mongoose";

const dsaSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            required: true,
        },
        duration: { // Time in minutes
            type: Number,
            required: true,
        },
        topics: [{ // Array of topics covered (e.g. arrays, linked lists, dynamic programming)
            type: String,
            required: true,
        }],
        companyTags: [{ // Array of companies that have asked this question (e.g. Google, Amazon)
            type: String,
        }],
        isPremium: { // Whether this question is premium content or not
            type: Boolean,
            default: false,
        },
        example:[
            {
                input: {
                    type: String,
                    required: true,
                },
                output: {
                    type: String,
                    required: true,
                },
                explanation: {
                    type: String, // not always needed but can be used to explain the example test cases
                }
            }
        ],
        testCases: [
            {
                input: {
                    type: String,
                    required: true,
                },
                output: {
                    type: String,
                    required: true,
                },
                isHidden: { // to have leetcode like demo run ones and then hidden test cases that only run on submit
                    type: Boolean,
                    default: false,
                }
            }
        ],
        availableLanguages: [{ // Array of programming languages that can be used to solve this question (e.g. Python, Java)
            type: String,
            required: true,
        }],
        maxMemory: { // Max memory limit in MB
            type: Number,
            required: true,
        },
        maxTime: { // Max time limit in ms
            type: Number,
            required: true,
        },
        constraints: [String] ,// Any additional constraints (e.g. "1 <= nums.length <= 10^5"),
        followUp: [String], // Follow-up questions 
        hints: [String], // Hints for solving the question
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
        totalRatings: { // Total number of ratings received (to calculate average rating)
            type: Number,
            default: 0,
        },
        correctAnswer: { // the correct answer which is optimized solution to the problem, can be used for test case validation and later interviewe helps if user is stuck and needs help
            language: {
                type: String,
                required: true,
            },
            code: {
                type: String,
                required: true,
            }
        },
        validationType: {
            type: String,
            enum: ["exact", "custom"],//exact means the output must match exactly, custom means we will use a custom validation function (e.g. for problems where there can be multiple correct outputs or where output format can vary)
            default: "exact",
        },
        validationCode: {
            language: {
                type: String,
            },
            code: {
                type: String, // validation code for required is in db validate
            }
        }
    },{
        timestamps: true,
    }
)

dsaSchema.pre("validate", function (next) {
  if (this.validationType === "custom") {
    if (!this.validationCode?.code || !this.validationCode?.language) {
      return next(new Error("validationCode required for custom type"));
    }
  }
  next();
});

const dsa = mongoose.model("DSA", dsaSchema);

export default dsa;