import mongoose from "mongoose";

const userAutomationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true,
            index: true
        },

        // Email integration settings
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: null
        },

        emailConnected: {
            type: Boolean,
            default: false
        },

        // App password for mail; never returned in API responses
        emailAuth: {
            type: String,
            default: null,
            select: false
        },

        // Job search preferences
        searchPreference: {
            type: [{
                role: [String],
                keywords: [String],
                locations: [String],
                remote: {
                    type: Boolean,
                    default: false
                },
                experience: {
                    type: String,
                    default: "any"
                },
                employmentType: [String],
                excludedCompanies: [String]
            }],
            default: []
        },

        // Preserved legacy field; never used to store cookies or raw authentication state
        linkdinProfile: {
            type: String,
            default: null
        },

        // Local browser session metadata (never stores cookies or secrets)
        
        browserSession: {
            status: {
                type: String,
                enum: [
                    "idle",
                    "opening",
                    "waiting_for_login",
                    "connected",
                    "verification_required",
                    "closed",
                    "error"
                ],
                default: "idle"
            },
            userConfirmedLogin: {
                type: Boolean,
                default: false
            },
            lastConnectedAt: {
                type: Date,
                default: null
            },
            lastDisconnectedAt: {
                type: Date,
                default: null
            },
            lastError: {
                type: String,
                default: null
            }
        },

        // General automation settings
        automationEnabled: {
            type: Boolean,
            default: true
        },

        timezone: {
            type: String,
            default: "Asia/Kolkata"
        }
    },
    {
        timestamps: true
    }
);

const UserAutomation = mongoose.model("UserAutomation", userAutomationSchema);

export default UserAutomation;
