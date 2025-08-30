import MarkdownIt from 'markdown-it';
import type { Schema } from '../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

interface ResumeData {
  userProfile: UserProfile;
  name: string;
}

export class MarkdownResumePDFGenerator {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
  }

  private generateMarkdown(data: ResumeData): string {
    const { userProfile, name } = data;
    let markdown = '';

    // Header with name and contact info
    markdown += `# ${name}\n\n`;

    // Job title and company
    if (userProfile.jobRole || userProfile.companyName) {
      let jobLine = '';
      if (userProfile.jobRole) jobLine += userProfile.jobRole;
      if (userProfile.companyName) {
        jobLine += jobLine
          ? ` at ${userProfile.companyName}`
          : userProfile.companyName;
      }
      markdown += `**${jobLine}**\n\n`;
    }

    // Contact information
    const contactInfo = [];
    if (userProfile.email) contactInfo.push(userProfile.email);
    if (userProfile.phone) contactInfo.push(userProfile.phone);
    if (userProfile.city || userProfile.country) {
      const location = [userProfile.city, userProfile.country]
        .filter(Boolean)
        .join(', ');
      contactInfo.push(location);
    }

    if (contactInfo.length > 0) {
      markdown += `${contactInfo.join(' • ')}\n\n`;
    }

    // Professional links
    const links = [];
    if (userProfile.linkedinUrl) {
      links.push(`[LinkedIn](${userProfile.linkedinUrl})`);
    }
    if (userProfile.githubUrl) {
      links.push(`[GitHub](${userProfile.githubUrl})`);
    }
    if (userProfile.portfolioUrl) {
      links.push(`[Portfolio](${userProfile.portfolioUrl})`);
    }

    if (links.length > 0) {
      markdown += `${links.join(' • ')}\n\n`;
    }

    markdown += '---\n\n';

    // Professional Summary
    if (userProfile.about) {
      markdown += `## Professional Summary\n\n`;
      markdown += `${userProfile.about}\n\n`;
    }

    // Work Experience
    const workExperience = userProfile.workExperience as any[];
    if (
      workExperience &&
      Array.isArray(workExperience) &&
      workExperience.length > 0
    ) {
      markdown += `## Work Experience\n\n`;

      workExperience.forEach(job => {
        markdown += `### ${job.position || 'Position'}\n`;
        if (job.company) {
          markdown += `**${job.company}**`;
        }
        if (job.startDate || job.endDate) {
          const dates = `${job.startDate || ''} - ${job.endDate || 'Present'}`;
          markdown += job.company ? ` • ${dates}\n\n` : `${dates}\n\n`;
        } else if (job.company) {
          markdown += '\n\n';
        }

        if (job.description) {
          markdown += `${job.description}\n\n`;
        }
      });
    }

    // Education
    const education = userProfile.educationHistory as any[];
    if (education && Array.isArray(education) && education.length > 0) {
      markdown += `## Education\n\n`;

      education.forEach(edu => {
        markdown += `### ${edu.degree || 'Degree'}\n`;
        if (edu.field) {
          markdown += `**${edu.field}**`;
        }
        if (edu.institution) {
          markdown += edu.field
            ? ` • ${edu.institution}`
            : `**${edu.institution}**`;
        }
        if (edu.startYear || edu.endYear) {
          const dates = `${edu.startYear || ''} - ${edu.endYear || ''}`;
          markdown += ` • ${dates}\n\n`;
        } else {
          markdown += '\n\n';
        }
      });
    } else if (userProfile.education) {
      markdown += `## Education\n\n`;
      markdown += `${userProfile.education}\n\n`;
    }

    // Skills
    if (
      userProfile.skills &&
      Array.isArray(userProfile.skills) &&
      userProfile.skills.length > 0
    ) {
      markdown += `## Skills\n\n`;
      markdown += `${userProfile.skills.join(' • ')}\n\n`;
    }

    // Projects
    const projects = userProfile.projects as any[];
    if (projects && Array.isArray(projects) && projects.length > 0) {
      markdown += `## Projects\n\n`;

      projects.forEach(project => {
        markdown += `### ${project.title || 'Project'}\n`;
        if (project.technologies) {
          markdown += `**Technologies:** ${project.technologies}\n\n`;
        }
        if (project.description) {
          markdown += `${project.description}\n\n`;
        }
      });
    }

    // Certifications
    const certifications = userProfile.certifications as any[];
    if (
      certifications &&
      Array.isArray(certifications) &&
      certifications.length > 0
    ) {
      markdown += `## Certifications\n\n`;

      certifications.forEach(cert => {
        markdown += `### ${cert.name || 'Certification'}\n`;
        if (cert.issuer) {
          markdown += `**${cert.issuer}**`;
        }
        if (cert.date) {
          markdown += cert.issuer ? ` • ${cert.date}\n\n` : `${cert.date}\n\n`;
        } else if (cert.issuer) {
          markdown += '\n\n';
        }
      });
    }

    // Languages
    const languages = userProfile.languages as any[];
    if (languages && Array.isArray(languages) && languages.length > 0) {
      markdown += `## Languages\n\n`;
      const langTexts = languages.map(
        lang =>
          `${lang.language}${lang.proficiency ? ` (${lang.proficiency})` : ''}`
      );
      markdown += `${langTexts.join(' • ')}\n\n`;
    }

    return markdown;
  }

  private getResumeCSS(): string {
    return `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          line-height: 1.5;
          color: #1f2937;
          background: white;
          font-size: 14px;
          max-width: 210mm;
          margin: 0 auto;
          padding: 15mm;
        }
        
        h1 {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin-bottom: 8px;
          letter-spacing: -0.025em;
        }
        
        h2 {
          font-size: 17px;
          font-weight: 600;
          color: #111827;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-top: 24px;
          margin-bottom: 12px;
          border-bottom: 2px solid #d1d5db;
          padding-bottom: 10px;
        }
        
        h3 {
          font-size: 15px;
          font-weight: 600;
          color: #374151;
          margin-top: 16px;
          margin-bottom: 4px;
        }
        
        p {
          margin-bottom: 8px;
          line-height: 1.6;
        }
        
        strong {
          font-weight: 500;
          color: #6b7280;
        }
        
        a {
          color: #3b82f6;
          text-decoration: none;
        }
        
        a:hover {
          text-decoration: underline;
        }
        
        hr {
          border: none;
          border-top: 1px solid #e5e7eb;
          margin: 16px 0;
        }
        
        /* Header styling */
        body > p:first-of-type {
          font-size: 16px;
          font-weight: 500;
          color: #374151;
          margin-bottom: 4px;
        }
        
        /* Contact info styling */
        body > p:nth-of-type(2),
        body > p:nth-of-type(3) {
          font-size: 13px;
          color: #6b7280;
          margin-bottom: 2px;
        }
        
        /* Section content spacing */
        h2 + p {
          margin-top: 4px;
        }
        
        h3 + p {
          margin-top: 2px;
        }
        
        /* Compact spacing for lists */
        h2 + p:last-child {
          margin-bottom: 12px;
        }
        
        /* Page break handling */
        h2 {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        h3 {
          page-break-after: avoid;
          break-after: avoid;
        }
        
        h2, h3 {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        
        /* Keep job/education entries together */
        h3 + p,
        h3 + p + p {
          page-break-before: avoid;
          break-before: avoid;
        }
        
        /* Avoid orphaned lines */
        p {
          orphans: 2;
          widows: 2;
        }

        /* Print optimizations */
        @media print {
          body {
            padding: 10mm;
            font-size: 13px;
          }
          
          h1 {
            font-size: 22px;
          }
          
          h2 {
            font-size: 16px;
            margin-top: 20px;
            margin-bottom: 10px;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          h3 {
            font-size: 14px;
            margin-top: 12px;
            page-break-after: avoid;
            break-after: avoid;
          }
          
          p {
            margin-bottom: 6px;
          }
        }
      </style>
    `;
  }

  public async generatePDF(data: ResumeData): Promise<void> {
    // Only run in browser environment
    if (typeof window === 'undefined') {
      throw new Error('PDF generation only works in the browser');
    }

    // Dynamically import html2pdf to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    const markdown = this.generateMarkdown(data);
    const htmlContent = this.md.render(markdown);
    const css = this.getResumeCSS();

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Resume - ${data.name}</title>
          ${css}
        </head>
        <body>
          ${htmlContent}
        </body>
      </html>
    `;

    const options = {
      margin: [12, 12, 12, 12], // top, right, bottom, left margins in mm
      filename: `${data.name.replace(/[^a-zA-Z0-9]/g, '_')}_Resume_${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    };

    try {
      await html2pdf().set(options).from(fullHtml).save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }
}

// Export function for easy use
export const generateMarkdownResume = async (
  userProfile: UserProfile,
  displayName: string
): Promise<void> => {
  const generator = new MarkdownResumePDFGenerator();
  await generator.generatePDF({ userProfile, name: displayName });
};
