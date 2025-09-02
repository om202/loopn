'use client';

import React, { useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../../amplify/data/resource';

// Initialize Amplify Data client
const client = generateClient<Schema>();

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

export default function ResumeParserMVP() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [parsedData, setParsedData] = useState<ResumeData | null>(null);
  const [error, setError] = useState('');

  const extractTextFromPDF = async (file: File): Promise<string> => {
    // Dynamically import PDF.js only when needed
    const pdfjsLib = await import('pdfjs-dist');

    // Set up the worker for pdf.js
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .filter((item): item is any => 'str' in item)
        .map((item: any) => item.str)
        .join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  };

  const parseResumeWithBedrock = async (text: string): Promise<ResumeData> => {
    const result = await client.queries.parseResume({
      text: text,
    });

    if (!result.data) {
      throw new Error('Failed to parse resume');
    }

    // Parse the JSON string response
    const response = JSON.parse(result.data as string);
    if (!response.success) {
      throw new Error(response.error || 'Failed to parse resume');
    }

    return response.data;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    setError('');
    setParsedData(null);

    try {
      // Step 1: Extract text from PDF
      const text = await extractTextFromPDF(file);
      setExtractedText(text);

      // Step 2: Parse with Bedrock Claude
      const parsedData = await parseResumeWithBedrock(text);
      setParsedData(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className='min-h-screen bg-neutral-50 p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold text-neutral-900 mb-8'>
          Resume Parser MVP
        </h1>

        {/* File Upload */}
        <div className='bg-white rounded-lg shadow p-6 mb-6'>
          <h2 className='text-xl font-semibold mb-4'>Upload Resume (PDF)</h2>
          <input
            type='file'
            accept='.pdf'
            onChange={handleFileUpload}
            disabled={isProcessing}
            className='block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
          />
          {isProcessing && (
            <p className='text-blue-600 mt-2'>Processing resume...</p>
          )}
          {error && <p className='text-red-600 mt-2'>{error}</p>}
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          {/* Extracted Text */}
          {extractedText && (
            <div className='bg-white rounded-lg shadow p-6'>
              <h2 className='text-xl font-semibold mb-4'>Extracted Text</h2>
              <div className='bg-neutral-100 p-4 rounded max-h-96 overflow-y-auto'>
                <pre className='text-sm whitespace-pre-wrap'>
                  {extractedText}
                </pre>
              </div>
            </div>
          )}

          {/* Parsed Data Form */}
          {parsedData && (
            <div className='bg-white rounded-lg shadow p-6'>
              <h2 className='text-xl font-semibold mb-4'>Parsed Data</h2>
              <div className='space-y-4 max-h-96 overflow-y-auto'>
                {/* Personal Info */}
                <div className='grid grid-cols-2 gap-4'>
                  <input
                    type='text'
                    placeholder='First Name'
                    value={parsedData.firstName}
                    className='border rounded px-3 py-2'
                    readOnly
                  />
                  <input
                    type='text'
                    placeholder='Last Name'
                    value={parsedData.lastName}
                    className='border rounded px-3 py-2'
                    readOnly
                  />
                </div>

                <input
                  type='email'
                  placeholder='Email'
                  value={parsedData.email}
                  className='w-full border rounded px-3 py-2'
                  readOnly
                />

                <div className='grid grid-cols-2 gap-4'>
                  <input
                    type='text'
                    placeholder='Phone'
                    value={parsedData.phone}
                    className='border rounded px-3 py-2'
                    readOnly
                  />
                  <input
                    type='text'
                    placeholder='City'
                    value={parsedData.city}
                    className='border rounded px-3 py-2'
                    readOnly
                  />
                </div>

                <div className='grid grid-cols-1 gap-4'>
                  <input
                    type='url'
                    placeholder='LinkedIn URL'
                    value={parsedData.linkedinUrl}
                    className='w-full border rounded px-3 py-2'
                    readOnly
                  />
                  <input
                    type='url'
                    placeholder='GitHub URL'
                    value={parsedData.githubUrl}
                    className='w-full border rounded px-3 py-2'
                    readOnly
                  />
                  <input
                    type='url'
                    placeholder='Portfolio URL'
                    value={parsedData.portfolioUrl}
                    className='w-full border rounded px-3 py-2'
                    readOnly
                  />
                </div>

                <textarea
                  placeholder='Summary'
                  value={parsedData.summary}
                  className='w-full border rounded px-3 py-2 h-20'
                  readOnly
                />

                {/* Skills */}
                <div>
                  <label className='block text-sm font-medium mb-2'>
                    Skills
                  </label>
                  <div className='flex flex-wrap gap-2'>
                    {parsedData.skills.map((skill, index) => (
                      <span
                        key={index}
                        className='bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm'
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Work Experience */}
                {parsedData.workExperience.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Work Experience
                    </label>
                    {parsedData.workExperience.map((job, index) => (
                      <div key={index} className='border rounded p-3 mb-2'>
                        <div className='grid grid-cols-2 gap-2 mb-2'>
                          <input
                            value={job.company}
                            placeholder='Company'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <input
                            value={job.position}
                            placeholder='Position'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                        </div>
                        <div className='grid grid-cols-2 gap-2 mb-2'>
                          <input
                            value={job.startDate}
                            placeholder='Start Date'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <input
                            value={job.endDate}
                            placeholder='End Date'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                        </div>
                        <textarea
                          value={job.description}
                          placeholder='Description'
                          className='w-full text-sm border rounded px-2 py-1'
                          rows={2}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Education */}
                {parsedData.education.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Education
                    </label>
                    {parsedData.education.map((edu, index) => (
                      <div key={index} className='border rounded p-3 mb-2'>
                        <input
                          value={edu.institution}
                          placeholder='Institution'
                          className='w-full text-sm border rounded px-2 py-1 mb-2'
                          readOnly
                        />
                        <div className='grid grid-cols-2 gap-2'>
                          <input
                            value={edu.degree}
                            placeholder='Degree'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <input
                            value={edu.field}
                            placeholder='Field'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Projects */}
                {parsedData.projects.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Projects
                    </label>
                    {parsedData.projects.map((project, index) => (
                      <div key={index} className='border rounded p-3 mb-2'>
                        <input
                          value={project.title}
                          placeholder='Project Title'
                          className='w-full text-sm border rounded px-2 py-1 mb-2'
                          readOnly
                        />
                        <textarea
                          value={project.description}
                          placeholder='Project Description'
                          className='w-full text-sm border rounded px-2 py-1 mb-2'
                          rows={2}
                          readOnly
                        />
                        <input
                          value={project.technologies}
                          placeholder='Technologies Used'
                          className='w-full text-sm border rounded px-2 py-1'
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Certifications */}
                {parsedData.certifications.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Certifications
                    </label>
                    {parsedData.certifications.map((cert, index) => (
                      <div key={index} className='border rounded p-3 mb-2'>
                        <input
                          value={cert.name}
                          placeholder='Certification Name'
                          className='w-full text-sm border rounded px-2 py-1 mb-2'
                          readOnly
                        />
                        <div className='grid grid-cols-2 gap-2 mb-2'>
                          <input
                            value={cert.issuer}
                            placeholder='Issuer'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <input
                            value={cert.date}
                            placeholder='Issue Date'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                        </div>
                        <input
                          value={cert.expiryDate}
                          placeholder='Expiry Date'
                          className='w-full text-sm border rounded px-2 py-1'
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Awards */}
                {parsedData.awards.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Awards & Achievements
                    </label>
                    {parsedData.awards.map((award, index) => (
                      <div key={index} className='border rounded p-3 mb-2'>
                        <input
                          value={award.title}
                          placeholder='Award Title'
                          className='w-full text-sm border rounded px-2 py-1 mb-2'
                          readOnly
                        />
                        <div className='grid grid-cols-2 gap-2 mb-2'>
                          <input
                            value={award.issuer}
                            placeholder='Issuing Organization'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <input
                            value={award.date}
                            placeholder='Date'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                        </div>
                        <textarea
                          value={award.description}
                          placeholder='Description'
                          className='w-full text-sm border rounded px-2 py-1'
                          rows={2}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Languages */}
                {parsedData.languages.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Languages
                    </label>
                    <div className='grid grid-cols-1 gap-2'>
                      {parsedData.languages.map((lang, index) => (
                        <div
                          key={index}
                          className='flex gap-2 items-center border rounded p-2'
                        >
                          <input
                            value={lang.language}
                            placeholder='Language'
                            className='flex-1 text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <span className='bg-b_green-100 text-b_green-800 px-2 py-1 rounded text-sm'>
                            {lang.proficiency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Publications */}
                {parsedData.publications.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Publications
                    </label>
                    {parsedData.publications.map((pub, index) => (
                      <div key={index} className='border rounded p-3 mb-2'>
                        <input
                          value={pub.title}
                          placeholder='Publication Title'
                          className='w-full text-sm border rounded px-2 py-1 mb-2'
                          readOnly
                        />
                        <div className='grid grid-cols-2 gap-2 mb-2'>
                          <input
                            value={pub.venue}
                            placeholder='Venue/Journal'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                          <input
                            value={pub.date}
                            placeholder='Date'
                            className='text-sm border rounded px-2 py-1'
                            readOnly
                          />
                        </div>
                        <textarea
                          value={pub.description}
                          placeholder='Description'
                          className='w-full text-sm border rounded px-2 py-1'
                          rows={2}
                          readOnly
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Hobbies & Interests */}
                {parsedData.hobbies.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium mb-2'>
                      Hobbies & Interests
                    </label>
                    <div className='flex flex-wrap gap-2'>
                      {parsedData.hobbies.map((hobby, index) => (
                        <span
                          key={index}
                          className='bg-purple-100 text-purple-800 px-2 py-1 rounded text-sm'
                        >
                          {hobby}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
