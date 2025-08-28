import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';

// AWS Bedrock client for Claude AI processing
const bedrockClient = new BedrockRuntimeClient({
  region: process.env.AWS_REGION!,
});

interface ResumeParserRequest {
  text: string;
}

interface ResumeData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  summary: string;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
  }>;
  workExperience: Array<{
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  skills: string[];
  projects: Array<{
    title: string;
    description: string;
    technologies: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
    expiryDate: string;
  }>;
  awards: Array<{
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
  publications: Array<{
    title: string;
    venue: string;
    date: string;
    description: string;
  }>;
  hobbies: string[];
}

interface ResumeParserResponse {
  success: boolean;
  data?: ResumeData;
  error?: string;
}

const RESUME_PARSING_PROMPT = `
You are an expert resume parser. Please analyze the following resume text and extract structured information. Return ONLY a valid JSON object with the following structure:

{
  "firstName": "string",
  "lastName": "string", 
  "email": "string",
  "phone": "string",
  "city": "string",
  "country": "string",
  "linkedinUrl": "string",
  "githubUrl": "string",
  "portfolioUrl": "string",
  "summary": "string",
  "education": [
    {
      "institution": "string",
      "degree": "string", 
      "field": "string",
      "startYear": "string",
      "endYear": "string"
    }
  ],
  "workExperience": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string",
      "endDate": "string", 
      "description": "string"
    }
  ],
  "skills": ["skill1", "skill2", "skill3"],
  "projects": [
    {
      "title": "string",
      "description": "string",
      "technologies": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "expiryDate": "string"
    }
  ],
  "awards": [
    {
      "title": "string",
      "issuer": "string",
      "date": "string",
      "description": "string"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ],
  "publications": [
    {
      "title": "string",
      "venue": "string",
      "date": "string",
      "description": "string"
    }
  ],
  "hobbies": ["hobby1", "hobby2", "hobby3"]
}

Rules:
- Extract information accurately from the resume text
- Separate LinkedIn URLs from GitHub URLs - they are different fields
- For GitHub, look for github.com links or "GitHub:" mentions
- For portfolio, look for personal websites, portfolio links
- For hobbies/interests, look for sections like "Interests", "Hobbies", "Personal Interests", "Activities"
- If information is missing, use empty strings or empty arrays
- For dates, use formats like "Jan 2020", "2020-2023", etc.
- For languages, include proficiency levels like "Native", "Fluent", "Intermediate", "Basic"
- Keep descriptions concise but informative
- Return ONLY the JSON object, no additional text

Resume text to parse:
`;

// Parse resume text using Claude 3.5 Haiku
async function parseResumeWithClaude(text: string): Promise<ResumeData> {
  console.log('Parsing resume with Claude 3.5 Haiku...');

  try {
    const payload = {
      anthropic_version: 'bedrock-2023-05-31',
      max_tokens: 4000,
      messages: [
        {
          role: 'user',
          content: RESUME_PARSING_PROMPT + text,
        },
      ],
      temperature: 0.1,
      top_p: 0.9,
    };

    const command = new InvokeModelCommand({
      modelId: 'us.anthropic.claude-3-5-haiku-20241022-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify(payload),
    });

    const response = await bedrockClient.send(command);

    if (!response.body) {
      throw new Error('No response body from Bedrock Claude');
    }

    const responseBody = JSON.parse(new TextDecoder().decode(response.body));
    const content = responseBody.content[0].text;

    // Try to parse the JSON from Claude's response
    let parsedData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in Claude response');
      }
    } catch (_parseError) {
      console.error('Failed to parse Claude response as JSON:', content);
      throw new Error('Failed to parse AI response');
    }

    // Validate and clean the parsed data
    const cleanedData: ResumeData = {
      firstName: parsedData.firstName || '',
      lastName: parsedData.lastName || '',
      email: parsedData.email || '',
      phone: parsedData.phone || '',
      city: parsedData.city || '',
      country: parsedData.country || '',
      linkedinUrl: parsedData.linkedinUrl || '',
      githubUrl: parsedData.githubUrl || '',
      portfolioUrl: parsedData.portfolioUrl || '',
      summary: parsedData.summary || '',
      education: Array.isArray(parsedData.education)
        ? parsedData.education
        : [],
      workExperience: Array.isArray(parsedData.workExperience)
        ? parsedData.workExperience
        : [],
      skills: Array.isArray(parsedData.skills) ? parsedData.skills : [],
      projects: Array.isArray(parsedData.projects) ? parsedData.projects : [],
      certifications: Array.isArray(parsedData.certifications)
        ? parsedData.certifications
        : [],
      awards: Array.isArray(parsedData.awards) ? parsedData.awards : [],
      languages: Array.isArray(parsedData.languages)
        ? parsedData.languages
        : [],
      publications: Array.isArray(parsedData.publications)
        ? parsedData.publications
        : [],
      hobbies: Array.isArray(parsedData.hobbies) ? parsedData.hobbies : [],
    };

    console.log('✅ Successfully parsed resume data');
    return cleanedData;
  } catch (error) {
    console.error('Error parsing resume with Claude:', error);
    throw error;
  }
}

export const handler = async (event: any): Promise<ResumeParserResponse> => {
  try {
    console.log(
      'Resume parser handler called with event:',
      JSON.stringify(event, null, 2)
    );

    const request = event.arguments as ResumeParserRequest;

    if (!request.text || request.text.trim() === '') {
      return {
        success: false,
        error: 'No resume text provided',
      };
    }

    console.log('Processing resume text with length:', request.text.length);

    const parsedData = await parseResumeWithClaude(request.text);

    return {
      success: true,
      data: parsedData,
    };
  } catch (error) {
    console.error('Resume parser handler error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
