import caseStudy from "../model/case.model.js";
import { redis } from "../lib/redis.js";

export const createCaseStudy = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can create case studies." });
        }

        const {
            title,
            description,
            difficulity,
            domain,
            type,
            previousContext,
            goal,
            expectedApproach,
            data,
            sampleSolution,
            hints,
            followUps,
            constraints,
            evaluation,
            answerFormat
        } = req.body;

        if (
            !title || !description || !difficulity ||
            !domain || !type || !previousContext ||
            !goal || !expectedApproach || expectedApproach.length === 0 ||
            !sampleSolution || !sampleSolution.answer ||
            !sampleSolution.keyPoints || sampleSolution.keyPoints.length === 0 ||
            !evaluation || evaluation.length === 0
        ) {
            return res.status(400).json({ message: "Missing required fields." });
        }

        if (expectedApproach.some(step => !step)) {
            return res.status(400).json({ message: "Invalid expectedApproach." });
        }

        if (data && data.length > 0) {
            if (data.some(d => !d.label || !d.value)) {
                return res.status(400).json({ message: "Each data point must have label and value." });
            }
        }

        if (
            evaluation.some(e =>
                !e.category ||
                !e.description ||
                e.weight === undefined ||
                e.weight < 0 ||
                e.weight > 1
            )
        ) {
            return res.status(400).json({
                message: "Each evaluation must have category, description and valid weight."
            });
        }

        const totalWeight = evaluation.reduce((sum, e) => sum + e.weight, 0);
        if (Math.abs(totalWeight - 1) > 0.01) {
            return res.status(400).json({ message: "Evaluation weights must sum to 1." });
        }

        const newCase = await caseStudy.create({
            title,
            description,
            difficulity,
            domain,
            type,
            previousContext,
            goal,
            expectedApproach,
            data,
            sampleSolution,
            hints,
            followUps,
            constraints,
            evaluation,
            answerFormat,
            addedBy: user._id
        });

        await redis.set(
            `caseStudy:${newCase._id}`,
            JSON.stringify(newCase),
            "EX",
            60 * 60
        );

        return res.status(201).json({
            message: "Case study created successfully.",
            caseStudy: newCase
        });

    } catch (error) {
        next(error);
    }
};

export const getCaseStudyById = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        if (user.isDisabled) {
            return res.status(403).json({ message: "User is disabled." });
        }

        if (!id) {
            return res.status(400).json({ message: "CaseStudy ID is required." });
        }

        const cached = await redis.get(`caseStudy:${id}`);
        if (cached) {
            return res.status(200).json({
                caseStudy: JSON.parse(cached),
            });
        }

        const CaseStudy = await caseStudy.findById(id);
        if (!CaseStudy) {
            return res.status(404).json({ message: "Case study not found." });
        }

        await redis.set(
            `caseStudy:${id}`,
            JSON.stringify(CaseStudy),
            "EX",
            60 * 60
        );

        return res.status(200).json({
            CaseStudy,
        });

    } catch (error) {
        next(error);
    }
};

export const getAllCaseStudies = async (req, res, next) => {
    try {
        const { user } = req;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can view all case studies." });
        }

        const cases = await caseStudy.find({})
            .populate("addedBy", "name email");

        return res.status(200).json({ caseStudies: cases });

    } catch (error) {
        next(error);
    }
};

export const deleteCaseStudy = async (req, res, next) => {
    try {
        const { user } = req;
        const { id } = req.params;

        if (user.isDisabled) {
            return res.status(403).json({ message: "Your account is disabled." });
        }

        if (!user.isOwner) {
            return res.status(403).json({ message: "Only owners can delete case studies." });
        }

        if (!id) {
            return res.status(400).json({ message: "CaseStudy ID is required." });
        }

        const CaseStudy = await caseStudy.findById(id);
        if (!CaseStudy) {
            return res.status(404).json({ message: "Case study not found." });
        }

        await caseStudy.findByIdAndDelete(id);

        await redis.del(`caseStudy:${id}`);

        return res.status(200).json({ message: "Case study deleted successfully." });

    } catch (error) {
        next(error);
    }
};

