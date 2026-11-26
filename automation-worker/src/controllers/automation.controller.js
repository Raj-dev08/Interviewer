
import UserAutomation from "../models/userAutomationData.js";

export const getAutomationProfile = async (req, res) => {
    try {
        const userId = req.authenticatedUserId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const profile = await UserAutomation.findOneAndUpdate(
            { userId },
            { $setOnInsert: { userId } },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        ).select("-emailAuth");

        return res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Get automation profile:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get automation profile"
        });
    }
};

export const updateAutomationPreferences = async (req, res) => {
    try {
        const userId = req.authenticatedUserId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const {
            searchPreference,
            automationEnabled,
            timezone
        } = req.body;

        const updates = {};

        if (searchPreference !== undefined) {
            if (!Array.isArray(searchPreference)) {
                return res.status(400).json({
                    success: false,
                    message: "searchPreference must be an array"
                });
            }

            updates.searchPreference = searchPreference;
        }

        if (automationEnabled !== undefined) {
            if (typeof automationEnabled !== "boolean") {
                return res.status(400).json({
                    success: false,
                    message: "automationEnabled must be a boolean"
                });
            }

            updates.automationEnabled = automationEnabled;
        }

        if (timezone !== undefined) {
            if (typeof timezone !== "string" || !timezone.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid timezone"
                });
            }

            updates.timezone = timezone.trim();
        }

        const profile = await UserAutomation.findOneAndUpdate(
            { userId },
            {
                $set: updates,
                $setOnInsert: { userId }
            },
            {
                new: true,
                upsert: true,
                runValidators: true,
                setDefaultsOnInsert: true
            }
        ).select("-emailAuth");

        return res.json({
            success: true,
            data: profile
        });
    } catch (error) {
        console.error("Update automation preferences:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update preferences"
        });
    }
};

export const getLinkedInStatus = async (req, res) => {
    try {
        const userId = req.authenticatedUserId;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const profile = await UserAutomation.findOne({ userId })
            .select("browserSession");

        return res.json({
            success: true,
            data: profile?.browserSession ?? {
                status: "idle",
                userConfirmedLogin: false,
                lastConnectedAt: null,
                lastDisconnectedAt: null
            }
        });
    } catch (error) {
        console.error("Get LinkedIn status:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to get LinkedIn status"
        });
    }
};
