
const { ApiResponse } = require("../utils/ApiResponse");
const { asyncHandler } = require("../utils/asyncHandler");


const generateSOPVideo = asyncHandler(async (req, res) => {
    const { tenantId, scriptContent, templateId } = req.body;

        const response = await axios.post(
            `https://api.heygen.com/v2/template/${templateId}/generate`,
            {
                title: `SOP for Tenant ${tenantId}`,
                variables: {
                    script: {
                        name: "script",
                        type: "text",
                        properties: { content: scriptContent },
                    },
                },
            },
            {
                headers: { "X-Api-Key": process.env.HEYGEN_API_KEY },
            },
        );

        // Store video_id in your DB linked to tenantId with status 'pending'
        const videoId = response.data.data.video_id;
        res.json(new ApiResponse(200, { success: true, videoId }, "SOP video generated!"));
    
});





module.exports = {generateSOPVideo}