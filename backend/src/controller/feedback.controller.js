import dsaFeedBack from "../model/dsaFeedBack.model.js";
import SysdesFeedback from "../model/sysdesfeedback.js";
import CaseFeedback from "../model/caseStudyFeedback.model.js";
import { interviewQueue } from "../lib/interview.queue.js";


export const getDSAfeedback = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({
                message: "user is disabled"
            });
        }

        const { interviewId, questionId } = req.params;

        if (!interviewId || !questionId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const feedback = await dsaFeedBack.findOne({
            interviewId,
            userId: user._id,
            questionId
        });

        if (!feedback) {
            return res.status(404).json({
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

export const getSysDesignFeedback = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({
                message: "user is disabled"
            });
        }

        const { interviewId, questionId } = req.params;

        if (!interviewId || !questionId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const feedback = await SysdesFeedback.findOne({
            interviewId,
            userId: user._id,
            questionId
        });

        if (!feedback) {
            return res.status(404).json({
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

        const { interviewId, questionId } = req.params;

        if (!interviewId || !questionId) {
            return res.status(400).json({
                message: "Missing required fields"
            });
        }

        const feedback = await CaseFeedback.findOne({
            interviewId,
            userId: user._id,
            questionId
        });

        if (!feedback) {
            return res.status(404).json({
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

export const generateDSAFeedBack = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(400).json({ message: "User is disabled"})
        }

        //will generate all the feedbacks 
        const { interviewId, questionId } = req.params
        const { type } = req.query

        if (interviewId){
            return res.status(400).json({ message: "Interview id missing"})
        }

        if (!["dsa","sysDes","case"].includes(type)){
            return res.status(400).json({ message: "invalid type"})
        }

        await interviewQueue.add("generateFeedbackForTheInterView",{
            interviewId,
            questionId,
            type,
            userId: user._id
        })

        return res.status(200).json({ message: "Feedback generation started"})
    } catch (error) {
        next(error)
    }
}