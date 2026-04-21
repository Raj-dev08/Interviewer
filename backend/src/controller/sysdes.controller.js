import SystemDesign from "../model/systemdesign.model.js";
import { redis } from "../lib/redis.js";

export const createSystemDesignQuestion = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account has been disabled. Please contact support for more information." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can create system design questions." });
        }

        const { 
            question, 
            description, 
            constraints, 
            duration, 
            topics, 
            companyTags, 
            isPremium, 
            correctAnswerFlow,
            followUp,
            hints,
            evaluation
        } = req.body;


        if (!question || !description || !constraints || !duration || !correctAnswerFlow || correctAnswerFlow.length === 0 || !evaluation || evaluation.length === 0) {
            return res.status(400).json({ message: "Question, description, constraints, duration, and correctAnswerFlow are required." });
        }

        if ( correctAnswerFlow.some(step => !step.title || !step.approach || !step.step) ) {
            return res.status(400).json({ message: "Each step in correctAnswerFlow must have a title and description." });
        }

        if (evaluation.some(e => !e.title || !e.description || e.weight === undefined || e.weight < 0 || e.weight > 1 || !e.evalType || !["boolean","approx"].includes(e.evalType))) {
            return res.status(400).json({ message: "Each evaluation criterion must have a title, description, and valid weight." });
        }

        const totalWeight = evaluation.reduce((sum, e) => sum + e.weight, 0);
        if (Math.abs(totalWeight - 1) > 0.01) {
            return res.status(400).json({ message: "Evaluation weights must sum to 1." });
        }

        const newQuestion = await SystemDesign.create({
            question,
            description,
            constraints,
            duration,
            topics,
            companyTags,
            isPremium: isPremium || false,
            correctAnswerFlow,
            followUp,
            hints,
            addedBy: user._id,
            evaluation
        });

        await redis.set(`systemDesignQuestion:${newQuestion._id}`, JSON.stringify(newQuestion), "EX", 60 * 60 ); // Cache for 1 hour

        return res.status(201).json({ message: "System design question created successfully.", question: newQuestion });
    } catch (error) {
        next(error);
    }
}

export const getSystemDesignQuestionById = async (req, res, next) => {
    try {
        const { user } = req;
        
        if (user.isDisabled){
            return res.status(403).json({ message: "User is disabled"})
        }
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Question ID is required." });
        }

        const cachedQuestion = await redis.get(`systemDesignQuestion:${id}`);
        if (cachedQuestion) {
            return res.status(200).json({ question: JSON.parse(cachedQuestion), source: "cache" });
        }

        const question = await SystemDesign.findById(id);
        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        await redis.set(`systemDesignQuestion:${id}`, JSON.stringify(question), "EX", 60 * 60 ); // Cache for 1 hour

        return res.status(200).json({ question, source: "database" });
    } catch (error) {
        next(error);
    }

}

export const getAllSystemDesignQuestions = async (req, res, next) => {
    try {
        const { user } = req

        if (user.isDisabled){
            return res.status(403).json({ message: "Your account has been disabled. Please contact support for more information." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can view all system design questions." });
        }

        const questions = await SystemDesign.find({}).populate("addedBy", "name email");

        return res.status(200).json({ questions });
    } catch (error) {
        next(error);
    }
}

export const deleteSystemDesignQuestion = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { user } = req;

        if (user.isDisabled){
            return res.status(403).json({ message: "Your account has been disabled. Please contact support for more information." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can delete system design questions." });
        }

        if (!id) {
            return res.status(400).json({ message: "Question ID is required." });
        }

        const question = await SystemDesign.findById(id);
        if (!question) {
            return res.status(404).json({ message: "Question not found." });
        }

        await SystemDesign.findByIdAndDelete(id);
        await redis.del(`systemDesignQuestion:${id}`); // Invalidate cache
        return res.status(200).json({ message: "Question deleted successfully." });
    } catch (error) {
        next(error);
    }
}