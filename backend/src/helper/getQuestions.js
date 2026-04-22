export const getRandomQuestion = async (Model, difficulty, excludedIds, limit) => {
    let questions = await Model.aggregate([
        {
            $match: {
                _id: { $nin: excludedIds },
                difficulty: difficulty,
            },
            $project: {
                _id:1,
                duration:1
            }
        },
        { $sample: { size: limit } }
    ]);

    if (questions.length < limit ) {
        const remainingLimit = limit - questions.length;
        const remainingQuestions = await Model.aggregate([
            {
                $match: {
                    difficulty: difficulty
                },
                $project: {
                    _id:1,
                    duration:1
                }
                
            },
            { $sample: { size: remainingLimit } }
        ])

        questions = [...questions, ...remainingQuestions]
    }

    const totalDuration = questions.reduce((sum,e)=>sum+e.duration,0)

    return { ids: questions.map(q => q._id), totalDuration };
}