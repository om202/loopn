'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <main className='min-h-screen bg-white'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b border-neutral-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4'>
          <div className='flex items-center justify-between'>
            <Link href='/home' className='flex items-center space-x-3'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-medium text-neutral-900'>Loopn</span>
            </Link>
            <Link
              href='/home'
              className='text-neutral-600 hover:text-neutral-900 font-medium'
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Terms of Service Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        <div className='prose prose-gray max-w-none'>
          <h1 className='text-3xl font-semibold text-neutral-900 mb-2'>
            Terms of Service
          </h1>
          <p className='text-neutral-600 mb-8'>Last updated: September 1, 2025</p>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8'>
            <p className='text-blue-800 font-medium'>
              <strong>Quick Summary:</strong> Loopn is a professional networking
              platform. By using our service, you agree to behave
              professionally, respect other users, and not misuse the platform.
              We provide the service as-is and reserve the right to suspend
              accounts that violate our rules. All conversations and connections
              are permanent once established.
            </p>
          </div>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            1. Acceptance of Terms
          </h2>
          <p className='text-neutral-700 mb-6'>
            By accessing or using Loopn (&quot;the Service&quot;), you agree to
            be bound by these Terms of Service (&quot;Terms&quot;). If you do
            not agree to these Terms, please do not use the Service. These Terms
            apply to all users, including visitors, registered users, and anyone
            else who accesses or uses the Service.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            2. Description of Service
          </h2>
          <p className='text-neutral-700 mb-4'>
            Loopn is a professional networking platform that:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-6 space-y-2'>
            <li>
              Uses AI to help match professionals based on skills, interests,
              and career goals
            </li>
            <li>
              Enables real-time messaging and permanent conversation history
            </li>
            <li>
              Processes resumes using AI to automatically build user profiles
            </li>
            <li>
              Facilitates professional networking through chat requests and
              connections
            </li>
            <li>
              Provides semantic search to help users discover relevant
              professionals
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            3. User Accounts and Registration
          </h2>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Account Requirements
          </h3>
          <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
            <li>You must be at least 18 years old to use the Service</li>
            <li>You must provide accurate and complete information</li>
            <li>You are responsible for maintaining account security</li>
            <li>One account per person - no duplicate accounts</li>
            <li>
              Professional use only - this is not a casual dating platform
            </li>
          </ul>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Account Responsibilities
          </h3>
          <ul className='list-disc pl-6 text-neutral-700 mb-6 space-y-2'>
            <li>
              Keep your login credentials secure and do not share them with
              others
            </li>
            <li>
              Notify us immediately of any unauthorized access to your account
            </li>
            <li>You are responsible for all activities under your account</li>
            <li>Maintain accurate and up-to-date profile information</li>
          </ul>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            4. Acceptable Use
          </h2>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Professional Standards
          </h3>
          <p className='text-neutral-700 mb-4'>
            Loopn is designed for professional networking. You agree to:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
            <li>
              Use the platform for legitimate professional networking purposes
            </li>
            <li>Maintain professional and respectful communication</li>
            <li>
              Provide truthful information about your professional background
            </li>
            <li>Respect other users&apos; time and professional boundaries</li>
            <li>Use appropriate language and conduct in all interactions</li>
          </ul>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Prohibited Activities
          </h3>
          <p className='text-neutral-700 mb-4'>You may NOT:</p>
          <ul className='list-disc pl-6 text-neutral-700 mb-6 space-y-2'>
            <li>
              <strong>Harassment:</strong> Harass, abuse, threaten, or
              intimidate other users
            </li>
            <li>
              <strong>Spam:</strong> Send unsolicited promotional messages or
              spam
            </li>
            <li>
              <strong>False Information:</strong> Provide false, misleading, or
              fraudulent information
            </li>
            <li>
              <strong>Impersonation:</strong> Impersonate another person or
              entity
            </li>
            <li>
              <strong>Inappropriate Content:</strong> Post sexual, violent, or
              otherwise inappropriate content
            </li>
            <li>
              <strong>System Abuse:</strong> Attempt to hack, disrupt, or abuse
              our systems
            </li>
            <li>
              <strong>Data Scraping:</strong> Use automated tools to collect
              user data
            </li>
            <li>
              <strong>Commercial Misuse:</strong> Use the platform for
              unauthorized commercial activities
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            5. Content and Communications
          </h2>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            User-Generated Content
          </h3>
          <p className='text-neutral-700 mb-4'>
            You retain ownership of content you create, but grant us certain
            rights:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
            <li>
              Right to store, display, and transmit your content through the
              Service
            </li>
            <li>Right to use your professional information for AI matching</li>
            <li>
              Right to process your data as described in our Privacy Policy
            </li>
            <li>
              You remain responsible for the accuracy and legality of your
              content
            </li>
          </ul>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Permanent Conversations
          </h3>
          <p className='text-neutral-700 mb-6'>
            <strong>Important:</strong> All conversations on Loopn are
            permanent. Once you accept a chat request, the conversation history
            is preserved indefinitely. Consider this before sharing sensitive
            information.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            6. AI and Automated Processing
          </h2>

          <p className='text-neutral-700 mb-4'>
            By using our Service, you consent to:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-6 space-y-2'>
            <li>
              AI processing of your resume and profile information for matching
              purposes
            </li>
            <li>
              Creation of mathematical embeddings (representations) of your
              profile for search
            </li>
            <li>
              Automated matching with other professionals based on your profile
            </li>
            <li>Use of your data to improve our AI algorithms (anonymized)</li>
          </ul>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            7. Privacy and Data Protection
          </h2>

          <p className='text-neutral-700 mb-6'>
            Your privacy is important to us. Please review our{' '}
            <Link href='/privacy' className='text-blue-600 hover:underline'>
              Privacy Policy
            </Link>{' '}
            to understand how we collect, use, and protect your information. By
            using the Service, you consent to the collection and use of your
            information as described in the Privacy Policy.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            8. Intellectual Property
          </h2>

          <p className='text-neutral-700 mb-4'>
            The Loopn platform, including its design, functionality, and
            content, is protected by intellectual property laws. You agree that:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-6 space-y-2'>
            <li>
              Loopn and its content are owned by us and protected by copyright,
              trademark, and other laws
            </li>
            <li>
              You may not copy, modify, distribute, or create derivative works
              from our platform
            </li>
            <li>
              You grant us a license to use content you submit for platform
              operations
            </li>
            <li>
              You will respect the intellectual property rights of other users
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            9. Service Availability and Modifications
          </h2>

          <p className='text-neutral-700 mb-4'>We reserve the right to:</p>
          <ul className='list-disc pl-6 text-neutral-700 mb-6 space-y-2'>
            <li>
              Modify, suspend, or discontinue the Service at any time with or
              without notice
            </li>
            <li>Change these Terms at any time with reasonable notice</li>
            <li>Implement new features or remove existing ones as needed</li>
            <li>
              Perform maintenance that may temporarily limit Service
              availability
            </li>
          </ul>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            10. Account Suspension and Termination
          </h2>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Our Rights
          </h3>
          <p className='text-neutral-700 mb-4'>
            We may suspend or terminate your account if you:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
            <li>Violate these Terms or our community standards</li>
            <li>Engage in fraudulent or illegal activities</li>
            <li>Harass or abuse other users</li>
            <li>Attempt to circumvent our systems or security measures</li>
            <li>
              Fail to respond to our requests for verification or information
            </li>
          </ul>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Your Rights
          </h3>
          <p className='text-neutral-700 mb-6'>
            You may delete your account at any time through your account
            settings. Upon deletion, your profile will be removed, but
            conversation history with other users may be retained as described
            in our Privacy Policy.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            11. Disclaimers and Limitation of Liability
          </h2>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Service Disclaimers
          </h3>
          <p className='text-neutral-700 mb-4'>
            THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY
            KIND. WE DO NOT GUARANTEE:
          </p>
          <ul className='list-disc pl-6 text-neutral-700 mb-4 space-y-2'>
            <li>Uninterrupted or error-free operation</li>
            <li>The accuracy of AI matching or recommendations</li>
            <li>The behavior or identity of other users</li>
            <li>
              That you will achieve specific professional or networking outcomes
            </li>
            <li>
              The security of communications (though we implement best
              practices)
            </li>
          </ul>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Limitation of Liability
          </h3>
          <p className='text-neutral-700 mb-6'>
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR
            ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE
            DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED
            DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER
            INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            12. Indemnification
          </h2>

          <p className='text-neutral-700 mb-6'>
            You agree to defend, indemnify, and hold harmless Loopn and its
            officers, directors, employees, and agents from and against any
            claims, liabilities, damages, losses, and expenses arising out of or
            in any way connected with your use of the Service or violation of
            these Terms.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            13. Dispute Resolution
          </h2>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Governing Law
          </h3>
          <p className='text-neutral-700 mb-4'>
            These Terms shall be governed by and construed in accordance with
            the laws of the United States, without regard to conflict of law
            principles.
          </p>

          <h3 className='text-xl font-medium text-neutral-900 mt-6 mb-3'>
            Dispute Resolution Process
          </h3>
          <p className='text-neutral-700 mb-6'>
            If you have a dispute with us, please first contact us at{' '}
            <a
              href='mailto:exonary.build@gmail.com'
              className='text-blue-600 hover:underline'
            >
              exonary.build@gmail.com
            </a>{' '}
            to attempt to resolve the issue informally. We are committed to
            working with our users to address concerns.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            14. Changes to Terms
          </h2>

          <p className='text-neutral-700 mb-6'>
            We may update these Terms from time to time to reflect changes in
            our Service or legal requirements. We will provide notice of
            material changes by posting the updated Terms on this page and
            updating the &quot;Last updated&quot; date. Your continued use of
            the Service after such changes constitutes acceptance of the new
            Terms.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            15. Severability
          </h2>

          <p className='text-neutral-700 mb-6'>
            If any provision of these Terms is held to be invalid or
            unenforceable, the remaining provisions will continue to be valid
            and enforceable to the fullest extent permitted by law.
          </p>

          <h2 className='text-2xl font-semibold text-neutral-900 mt-8 mb-4'>
            16. Contact Information
          </h2>

          <p className='text-neutral-700 mb-4'>
            If you have questions about these Terms, please contact us:
          </p>
          <div className='bg-neutral-50 border border-neutral-200 rounded-lg p-6 mb-8'>
            <p className='text-neutral-700 mb-2'>
              <strong>Email:</strong> exonary.build@gmail.com
            </p>
            <p className='text-neutral-700'>
              <strong>Subject Line:</strong> Terms of Service Question
            </p>
          </div>

          <div className='bg-green-50 border border-green-200 rounded-lg p-6 mt-8'>
            <h3 className='text-lg font-medium text-green-800 mb-2'>
              Professional Networking Done Right
            </h3>
            <p className='text-green-700'>
              These Terms are designed to create a professional, respectful
              environment where meaningful career connections can flourish. By
              using Loopn, you&apos;re joining a community committed to
              professional growth and mutual success.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className='bg-neutral-50 py-8 border-t border-neutral-200'>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='flex items-center justify-center space-x-3 mb-4'>
              <Image src='/loopn.svg' alt='Loopn' width={32} height={32} />
              <span className='text-xl font-medium text-neutral-900'>Loopn</span>
            </div>
            <p className='text-neutral-600 text-sm mb-6'>
              Professional networking that actually matters
            </p>
            <div className='flex justify-center items-center gap-6 mb-6'>
              <Link
                href='/privacy'
                className='text-neutral-600 text-sm font-medium hover:underline'
              >
                Privacy Policy
              </Link>
              <Link
                href='/terms'
                className='text-neutral-600 text-sm font-medium hover:underline'
              >
                Terms of Service
              </Link>
              <Link
                href='/home'
                className='text-neutral-600 text-sm font-medium hover:underline'
              >
                Home
              </Link>
            </div>
            <p className='text-neutral-600 text-sm'>
              © 2025 Loopn. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
