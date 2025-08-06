import type { Schema } from '../../data/resource';
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
  InvokeModelCommandInput,
} from '@aws-sdk/client-bedrock-runtime';

// Initialize Bedrock Runtime client
const client = new BedrockRuntimeClient({
  region: 'us-east-1',
});

export const handler: Schema['generateAnonymousSummary']['functionHandler'] =
  async event => {
    try {
      const {
        jobRole,
        companyName,
        industry,
        yearsOfExperience,
        education,
        about,
        interests,
      } = event.arguments;

      // Create a prompt for generating anonymous summary
      // We carefully select fields that don't need AI to remove personal info
      const prompt = `Create a brief, engaging anonymous professional summary (max 50 words) based on:

Role: ${jobRole}
Industry: ${industry} 
Experience: ${yearsOfExperience} years
Education: ${education}
About: ${about}
Key Interests: ${interests.slice(0, 5).join(', ')}

Generate a summary that highlights their professional profile without revealing personal details. Make it sound engaging and professional for networking purposes. Focus on their expertise, background, and interests.`;

      // Invoke the model
      const input: InvokeModelCommandInput = {
        modelId: process.env.MODEL_ID,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify({
          anthropic_version: 'bedrock-2023-05-31',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
          top_p: 0.9,
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await client.send(command);

      // Parse the response
      const data = JSON.parse(Buffer.from(response.body).toString());
      const summary = data.content[0].text.trim();

      return {
        summary,
        success: true,
      };
    } catch (error) {
      console.error('Error generating AI summary:', error);

      // Fallback summary if AI fails
      const fallbackSummary = `${event.arguments.jobRole} with ${event.arguments.yearsOfExperience} years of experience in ${event.arguments.industry}. Passionate about ${event.arguments.interests.slice(0, 2).join(' and ')}.`;

      return {
        summary: fallbackSummary,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  };
