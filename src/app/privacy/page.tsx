'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <main className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/home' className='flex items-center space-x-3'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-medium text-gray-900'>Loopn</span>
            </Link>
            <Link
              href='/home'
              className='text-gray-600 hover:text-gray-900 font-medium'
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Privacy Policy Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='prose prose-gray max-w-none'>
          <h1 className='text-3xl font-semibold text-gray-900 mb-2'>
            Privacy Policy
          </h1>
          <p className='text-gray-600 mb-8'>Last updated: September 1, 2025</p>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
            <p className='text-blue-800 font-medium'>
              <strong>Quick Summary:</strong> Loopn is a professional networking
              platform that uses AI to help you connect with other
              professionals. We collect your professional information (resume
              data, profile details, messages) to provide our matching and chat
              services. We use AWS services to securely store and process your
              data. We don&apos;t sell your personal information to third
              parties.
            </p>
          </div>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            1. Information We Collect
          </h2>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            Personal Information
          </h3>
          <p className='text-gray-700 mb-4'>
            When you create an account and complete your profile, we collect:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-4 space-y-2'>
            <li>
              <strong>Basic Information:</strong> Full name, email address,
              phone number, city, country
            </li>
            <li>
              <strong>Demographics:</strong> Gender (optional) and any custom
              gender description if you choose to self-describe
            </li>
            <li>
              <strong>Professional URLs:</strong> LinkedIn, GitHub, and
              portfolio website links
            </li>
            <li>
              <strong>Profile Pictures:</strong> Images you upload for your
              profile (stored securely in AWS S3)
            </li>
          </ul>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            Professional Information
          </h3>
          <p className='text-gray-700 mb-4'>
            To help match you with relevant professionals, we collect:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-4 space-y-2'>
            <li>
              <strong>Current Role:</strong> Job title, company name, industry,
              years of experience
            </li>
            <li>
              <strong>Education:</strong> Educational background and detailed
              education history
            </li>
            <li>
              <strong>Professional Background:</strong> Work experience,
              projects, certifications, awards, publications
            </li>
            <li>
              <strong>Skills &amp; Interests:</strong> Technical skills,
              professional interests, and hobbies
            </li>
            <li>
              <strong>Languages:</strong> Languages you speak and proficiency
              levels
            </li>
            <li>
              <strong>Career Status:</strong> Whether you&apos;re hiring,
              looking for jobs, or open to opportunities
            </li>
            <li>
              <strong>About Section:</strong> Professional description and
              career goals
            </li>
          </ul>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            Resume and Document Processing
          </h3>
          <p className='text-gray-700 mb-4'>
            When you upload a resume or other documents:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-4 space-y-2'>
            <li>
              We extract text content from your PDF files using PDF.js
              technology
            </li>
            <li>
              We send this text to AWS Bedrock (Claude 3.5 Haiku AI model) to
              parse and structure your professional information
            </li>
            <li>
              The AI-extracted information is used to automatically fill your
              profile fields
            </li>
            <li>
              We track which fields were auto-filled vs. manually entered by
              you
            </li>
          </ul>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            Communication Data
          </h3>
          <p className='text-gray-700 mb-4'>
            To provide our messaging and networking features:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-4 space-y-2'>
            <li>
              <strong>Chat Requests:</strong> Requests you send or receive to
              start conversations
            </li>
            <li>
              <strong>Messages:</strong> All messages you send and receive
              through our platform
            </li>
            <li>
              <strong>Conversations:</strong> Chat history, read receipts, and
              message metadata
            </li>
            <li>
              <strong>Message Reactions:</strong> Emoji reactions to messages
            </li>
            <li>
              <strong>Connection Requests:</strong> Professional connection
              requests and their status
            </li>
          </ul>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            Usage and Activity Data
          </h3>
          <ul className='list-disc pl-6 text-gray-700 mb-4 space-y-2'>
            <li>
              <strong>Presence Information:</strong> Online/offline status,
              last seen timestamps, active chat sessions
            </li>
            <li>
              <strong>Notifications:</strong> In-app notifications and their
              read status
            </li>
            <li>
              <strong>Search Activity:</strong> User searches and search
              history (stored locally in your browser)
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            2. How We Use Your Information
          </h2>

          <p className='text-gray-700 mb-4'>We use your information to:</p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>
              <strong>Provide Core Services:</strong> Create your profile,
              facilitate messaging, and enable professional networking
            </li>
            <li>
              <strong>AI Matching:</strong> Use AI to match you with relevant
              professionals based on skills, interests, and career goals
            </li>
            <li>
              <strong>Search and Discovery:</strong> Generate AI embeddings
              (mathematical representations) of your profile for semantic search
            </li>
            <li>
              <strong>Account Management:</strong> Authenticate your account,
              verify your email, and maintain your profile
            </li>
            <li>
              <strong>Platform Safety:</strong> Monitor for inappropriate
              content and maintain a professional environment
            </li>
            <li>
              <strong>Service Improvement:</strong> Understand how users
              interact with our platform to improve features
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            3. AI and Machine Learning
          </h2>

          <p className='text-gray-700 mb-4'>
            We use artificial intelligence to enhance your experience:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>
              <strong>Resume Parsing:</strong> AWS Bedrock&apos;s Claude 3.5
              Haiku model processes your resume text to extract structured
              professional information
            </li>
            <li>
              <strong>Profile Embeddings:</strong> AWS Bedrock&apos;s Titan Text
              Embeddings model creates mathematical representations of your
              profile for matching and search
            </li>
            <li>
              <strong>Smart Matching:</strong> AI algorithms help identify
              professionals who might be relevant to your career goals
            </li>
            <li>
              <strong>Search Enhancement:</strong> Semantic search technology
              helps find professionals based on meaning, not just keywords
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            4. Data Storage and Security
          </h2>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            AWS Infrastructure
          </h3>
          <p className='text-gray-700 mb-4'>
            Your data is stored and processed using Amazon Web Services (AWS):
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>
              <strong>AWS Amplify:</strong> Hosts our application and provides
              authentication
            </li>
            <li>
              <strong>AWS Cognito:</strong> Manages user authentication and
              account security
            </li>
            <li>
              <strong>AWS AppSync:</strong> Provides secure GraphQL API access
              to your data
            </li>
            <li>
              <strong>Amazon DynamoDB:</strong> Stores your profile, messages,
              and app data
            </li>
            <li>
              <strong>Amazon S3:</strong> Securely stores uploaded files like
              profile pictures
            </li>
            <li>
              <strong>AWS Lambda:</strong> Processes background tasks like
              resume parsing and presence cleanup
            </li>
            <li>
              <strong>AWS Bedrock:</strong> Provides AI services for resume
              parsing and embeddings
            </li>
          </ul>

          <h3 className='text-xl font-medium text-gray-900 mt-6 mb-3'>
            Security Measures
          </h3>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>All data is encrypted in transit and at rest</li>
            <li>AWS provides enterprise-level security and compliance</li>
            <li>Access to your data is restricted to authorized personnel only</li>
            <li>
              We follow AWS security best practices and regularly review our
              security measures
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            5. Data Sharing and Disclosure
          </h2>

          <p className='text-gray-700 mb-4'>
            We do not sell your personal information to third parties. We may
            share your information in these limited circumstances:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>
              <strong>With Other Users:</strong> Your professional profile
              information is visible to other users for networking purposes
            </li>
            <li>
              <strong>Service Providers:</strong> AWS and other service
              providers who help us operate the platform
            </li>
            <li>
              <strong>Legal Requirements:</strong> When required by law,
              regulation, or legal process
            </li>
            <li>
              <strong>Safety:</strong> To protect the rights, property, or
              safety of our users or others
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            6. Data Retention
          </h2>

          <p className='text-gray-700 mb-4'>We retain your data as follows:</p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>
              <strong>Profile Data:</strong> Until you delete your account
            </li>
            <li>
              <strong>Messages:</strong> Permanently stored to maintain chat
              history
            </li>
            <li>
              <strong>Chat Requests:</strong> 24 hours if no response (automatic
              deletion)
            </li>
            <li>
              <strong>Notifications:</strong> 30 days (automatic deletion)
            </li>
            <li>
              <strong>User Presence:</strong> Regularly cleaned up by automated
              processes
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            7. Your Rights and Choices
          </h2>

          <p className='text-gray-700 mb-4'>You have the right to:</p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>
              <strong>Access:</strong> View and download your personal data
            </li>
            <li>
              <strong>Update:</strong> Modify your profile and account
              information at any time
            </li>
            <li>
              <strong>Delete:</strong> Request deletion of your account and
              associated data
            </li>
            <li>
              <strong>Opt-out:</strong> Control your visibility and who can
              contact you
            </li>
            <li>
              <strong>Data Portability:</strong> Request a copy of your data in
              a portable format
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            8. Cookies and Local Storage
          </h2>

          <p className='text-gray-700 mb-4'>
            We use cookies and local browser storage to:
          </p>
          <ul className='list-disc pl-6 text-gray-700 mb-6 space-y-2'>
            <li>Keep you signed in to your account</li>
            <li>Remember your preferences and settings</li>
            <li>Store your search history locally (not sent to our servers)</li>
            <li>Improve the performance and functionality of our platform</li>
          </ul>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            9. Children&apos;s Privacy
          </h2>

          <p className='text-gray-700 mb-6'>
            Loopn is designed for professionals and is not intended for use by
            children under 18. We do not knowingly collect personal information
            from children under 18. If we become aware that we have collected
            such information, we will take steps to delete it.
          </p>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            10. International Users
          </h2>

          <p className='text-gray-700 mb-6'>
            Our services are hosted in the United States using AWS
            infrastructure. If you are accessing our services from outside the
            United States, your information will be transferred to, stored, and
            processed in the United States. By using our services, you consent
            to this transfer.
          </p>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            11. Changes to This Policy
          </h2>

          <p className='text-gray-700 mb-6'>
            We may update this Privacy Policy from time to time. We will notify
            you of any material changes by posting the new Privacy Policy on
            this page and updating the &quot;Last updated&quot; date. We
            encourage you to review this Privacy Policy periodically.
          </p>

          <h2 className='text-2xl font-semibold text-gray-900 mt-8 mb-4'>
            12. Contact Us
          </h2>

          <p className='text-gray-700 mb-4'>
            If you have any questions about this Privacy Policy or our data
            practices, please contact us:
          </p>
          <div className='bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8'>
            <p className='text-gray-700 mb-2'>
              <strong>Email:</strong> exonary.build@gmail.com
            </p>
            <p className='text-gray-700'>
              <strong>Subject Line:</strong> Privacy Policy Question
            </p>
          </div>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 mt-8'>
            <h3 className='text-lg font-medium text-green-800 mb-2'>
              Your Privacy Matters
            </h3>
            <p className='text-green-700'>
              We are committed to protecting your privacy and being transparent
              about how we use your data. This policy will be updated as our
              platform evolves, and we&apos;ll always notify you of significant
              changes.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='bg-slate-50 py-8 border-t border-gray-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-medium text-gray-900'>Loopn</span>
            </div>
            <p className='text-gray-600 text-sm mb-6'>
              Professional networking that actually matters
            </p>
            <div className='flex justify-center items-center gap-6 mb-6'>
              <Link
                href='/privacy'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Terms of Service
              </Link>
              <Link
                href='/home'
                className='text-gray-600 text-sm font-medium hover:underline'
              >
                Home
              </Link>
            </div>
            <p className='text-gray-600 text-sm'>
              © 2025 Loopn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
