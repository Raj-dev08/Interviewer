import dsa from "../model/dsa.model.js";

export const createDSAQuestion = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled. Please contact support." });
        }

        if (!user.isOwner){
            return res.status(403).json({ message: "Only owners can create DSA questions." });
        }
    } catch (error) {
        next(error);
    }
}