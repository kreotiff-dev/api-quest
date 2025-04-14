const express = require('express');
const { chatCompletion } = require('../controllers/ai');
const { protect } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * /api/ai/chat:
 *   post:
 *     summary: Send a chat completion request to OpenAI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - content
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [system, user, assistant]
 *                     content:
 *                       type: string
 *               options:
 *                 type: object
 *                 properties:
 *                   model:
 *                     type: string
 *                   temperature:
 *                     type: number
 *                   maxTokens:
 *                     type: number
 *     responses:
 *       200:
 *         description: AI completion response
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/chat', protect, chatCompletion);

module.exports = router;