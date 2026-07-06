import dsaFeedBack from "../model/dsaFeedBack.model.js";
import SysdesFeedback from "../model/sysdesfeedback.js";
import CaseFeedback from "../model/caseStudyFeedback.model.js";
import Submission from "../model/submission.model.js";


export const getDSAfeedback = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({
                message: "user is disabled"
            });
        }

        const { interviewId } = req.params;

        if (!interviewId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const feedback = await dsaFeedBack.find({
            interviewId,
            userId: user._id
        });

        if (!feedback) {
            return res.status(200).json({
                message: "No available feedback please generate feedback first"
            });
        }

        return res.status(200).json({
            feedback
        });

    } catch (error) {
        next(error);
    }
};

export const getAllSubmission = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled) {
            return res.status(403).json({
                message: "user is disabled"
            });
        }

        const { interviewId } = req.params

        if (!interviewId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const submissions = await Submission.find({
            interviewId,
            userId: user._id
        })

        if (!submissions) {
            return res.status(404).json({
                message: "No available feedback please generate feedback first"
            });
        }

        return res.status(200).json({
            submissions
        });

    } catch (error) {
        next(error)
    }
}

export const getSysDesignFeedback = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({
                message: "user is disabled"
            });
        }

        const { interviewId } = req.params;

        if (!interviewId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const feedback = await SysdesFeedback.findOne({
            interviewId,
            userId: user._id
        });

        if (!feedback) {
            return res.status(200).json({
                message: "No available feedback please generate feedback first"
            });
        }

        return res.status(200).json({
            feedback
        });

    } catch (error) {
        next(error);
    }
};

export const getCaseStudyFeedback = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({
                message: "user is disabled"
            });
        }

        const { interviewId } = req.params;

        if (!interviewId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const feedback = await CaseFeedback.findOne({
            interviewId,
            userId: user._id
        });

        if (!feedback) {
            return res.status(200).json({
                message: "No available feedback please generate feedback first"
            });
        }

        return res.status(200).json({
            feedback
        });

    } catch (error) {
        next(error);
    }
};

