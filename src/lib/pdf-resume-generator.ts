import jsPDF from 'jspdf';
import type { Schema } from '../../amplify/data/resource';

type UserProfile = Schema['UserProfile']['type'];

interface ResumeData {
  userProfile: UserProfile;
  name: string;
}

export class ResumePDFGenerator {
  private pdf: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number = 20;
  private currentY: number = 20;
  private lineHeight: number = 6;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  private addHeader(name: string, userProfile: UserProfile): void {
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(24);
    this.pdf.text(name, this.margin, this.currentY);
    this.currentY += 12;

    // Job title and company
    if (userProfile.jobRole || userProfile.companyName) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(14);
      this.pdf.setTextColor(60, 60, 60);

      let jobLine = '';
      if (userProfile.jobRole) jobLine += userProfile.jobRole;
      if (userProfile.companyName) {
        jobLine += jobLine
          ? ` at ${userProfile.companyName}`
          : userProfile.companyName;
      }

      this.pdf.text(jobLine, this.margin, this.currentY);
      this.currentY += 8;
    }

    // Contact information
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(100, 100, 100);
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
      this.pdf.text(contactInfo.join(' • '), this.margin, this.currentY);
      this.currentY += 6;
    }

    // Professional links
    const linksInfo = [];
    if (userProfile.linkedinUrl)
      linksInfo.push(`LinkedIn: ${userProfile.linkedinUrl}`);
    if (userProfile.githubUrl)
      linksInfo.push(`GitHub: ${userProfile.githubUrl}`);
    if (userProfile.portfolioUrl)
      linksInfo.push(`Portfolio: ${userProfile.portfolioUrl}`);

    if (linksInfo.length > 0) {
      this.pdf.text(linksInfo.join(' • '), this.margin, this.currentY);
      this.currentY += 6;
    }

    this.currentY += 8;
    this.addHorizontalLine();
  }

  private addHorizontalLine(): void {
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(
      this.margin,
      this.currentY - 2,
      this.pageWidth - this.margin,
      this.currentY - 2
    );
    this.currentY += 6;
  }

  private addSectionTitle(title: string): void {
    this.checkPageBreak(15);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(16);
    this.pdf.setTextColor(0, 0, 0);
    this.pdf.text(title.toUpperCase(), this.margin, this.currentY);
    this.currentY += 8;
    this.addHorizontalLine();
  }

  private checkPageBreak(spaceNeeded: number): void {
    if (this.currentY + spaceNeeded > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addProfessionalSummary(userProfile: UserProfile): void {
    if (!userProfile.about) return;

    this.addSectionTitle('Professional Summary');

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(60, 60, 60);

    const splitText = this.pdf.splitTextToSize(
      userProfile.about,
      this.pageWidth - 2 * this.margin
    );
    this.checkPageBreak(splitText.length * this.lineHeight);

    this.pdf.text(splitText, this.margin, this.currentY);
    this.currentY += splitText.length * this.lineHeight + 8;
  }

  private addWorkExperience(userProfile: UserProfile): void {
    const workExperience = userProfile.workExperience as any[];
    if (
      !workExperience ||
      !Array.isArray(workExperience) ||
      workExperience.length === 0
    )
      return;

    this.addSectionTitle('Work Experience');

    workExperience.forEach((job, index) => {
      this.checkPageBreak(20);

      // Job title and dates
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(job.position || 'Position', this.margin, this.currentY);

      if (job.startDate || job.endDate) {
        const dates = `${job.startDate || ''} - ${job.endDate || 'Present'}`;
        const dateWidth = this.pdf.getTextWidth(dates);
        this.pdf.text(
          dates,
          this.pageWidth - this.margin - dateWidth,
          this.currentY
        );
      }

      this.currentY += 6;

      // Company name
      if (job.company) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(11);
        this.pdf.setTextColor(80, 80, 80);
        this.pdf.text(job.company, this.margin, this.currentY);
        this.currentY += 6;
      }

      // Job description
      if (job.description) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(60, 60, 60);

        const splitText = this.pdf.splitTextToSize(
          job.description,
          this.pageWidth - 2 * this.margin
        );
        this.checkPageBreak(splitText.length * this.lineHeight);

        this.pdf.text(splitText, this.margin, this.currentY);
        this.currentY += splitText.length * this.lineHeight;
      }

      if (index < workExperience.length - 1) {
        this.currentY += 6;
      }
    });

    this.currentY += 8;
  }

  private addEducation(userProfile: UserProfile): void {
    const education = userProfile.educationHistory as any[];
    if (!education || !Array.isArray(education) || education.length === 0) {
      // Fallback to simple education field
      if (userProfile.education) {
        this.addSectionTitle('Education');
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(11);
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.text(userProfile.education, this.margin, this.currentY);
        this.currentY += 8;
      }
      return;
    }

    this.addSectionTitle('Education');

    education.forEach((edu, index) => {
      this.checkPageBreak(15);

      // Degree and dates
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(edu.degree || 'Degree', this.margin, this.currentY);

      if (edu.startYear || edu.endYear) {
        const dates = `${edu.startYear || ''} - ${edu.endYear || ''}`;
        const dateWidth = this.pdf.getTextWidth(dates);
        this.pdf.text(
          dates,
          this.pageWidth - this.margin - dateWidth,
          this.currentY
        );
      }

      this.currentY += 6;

      // Field of study
      if (edu.field) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(11);
        this.pdf.setTextColor(80, 80, 80);
        this.pdf.text(edu.field, this.margin, this.currentY);
        this.currentY += 6;
      }

      // Institution
      if (edu.institution) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.text(edu.institution, this.margin, this.currentY);
        this.currentY += 6;
      }

      if (index < education.length - 1) {
        this.currentY += 4;
      }
    });

    this.currentY += 8;
  }

  private addSkills(userProfile: UserProfile): void {
    if (
      !userProfile.skills ||
      !Array.isArray(userProfile.skills) ||
      userProfile.skills.length === 0
    )
      return;

    this.addSectionTitle('Skills');

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(60, 60, 60);

    const skillsText = userProfile.skills.join(' • ');
    const splitText = this.pdf.splitTextToSize(
      skillsText,
      this.pageWidth - 2 * this.margin
    );
    this.checkPageBreak(splitText.length * this.lineHeight);

    this.pdf.text(splitText, this.margin, this.currentY);
    this.currentY += splitText.length * this.lineHeight + 8;
  }

  private addProjects(userProfile: UserProfile): void {
    const projects = userProfile.projects as any[];
    if (!projects || !Array.isArray(projects) || projects.length === 0) return;

    this.addSectionTitle('Projects');

    projects.forEach((project, index) => {
      this.checkPageBreak(15);

      // Project title
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(project.title || 'Project', this.margin, this.currentY);
      this.currentY += 6;

      // Technologies
      if (project.technologies) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(100, 100, 100);
        this.pdf.text(
          `Technologies: ${project.technologies}`,
          this.margin,
          this.currentY
        );
        this.currentY += 5;
      }

      // Description
      if (project.description) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(60, 60, 60);

        const splitText = this.pdf.splitTextToSize(
          project.description,
          this.pageWidth - 2 * this.margin
        );
        this.checkPageBreak(splitText.length * this.lineHeight);

        this.pdf.text(splitText, this.margin, this.currentY);
        this.currentY += splitText.length * this.lineHeight;
      }

      if (index < projects.length - 1) {
        this.currentY += 6;
      }
    });

    this.currentY += 8;
  }

  private addCertifications(userProfile: UserProfile): void {
    const certifications = userProfile.certifications as any[];
    if (
      !certifications ||
      !Array.isArray(certifications) ||
      certifications.length === 0
    )
      return;

    this.addSectionTitle('Certifications');

    certifications.forEach((cert, index) => {
      this.checkPageBreak(10);

      // Certification name and date
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(11);
      this.pdf.setTextColor(0, 0, 0);
      this.pdf.text(cert.name || 'Certification', this.margin, this.currentY);

      if (cert.date) {
        const dateWidth = this.pdf.getTextWidth(cert.date);
        this.pdf.text(
          cert.date,
          this.pageWidth - this.margin - dateWidth,
          this.currentY
        );
      }

      this.currentY += 5;

      // Issuer
      if (cert.issuer) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(60, 60, 60);
        this.pdf.text(cert.issuer, this.margin, this.currentY);
        this.currentY += 5;
      }

      if (index < certifications.length - 1) {
        this.currentY += 3;
      }
    });

    this.currentY += 8;
  }

  private addLanguages(userProfile: UserProfile): void {
    const languages = userProfile.languages as any[];
    if (!languages || !Array.isArray(languages) || languages.length === 0)
      return;

    this.addSectionTitle('Languages');

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(11);
    this.pdf.setTextColor(60, 60, 60);

    languages.forEach((lang, index) => {
      const langText = `${lang.language}${lang.proficiency ? ` (${lang.proficiency})` : ''}`;
      this.pdf.text(langText, this.margin + (index % 2) * 90, this.currentY);

      if (index % 2 === 1 || index === languages.length - 1) {
        this.currentY += 6;
      }
    });

    this.currentY += 8;
  }

  public generateResume(data: ResumeData): void {
    const { userProfile, name } = data;

    // Add header with contact information
    this.addHeader(name, userProfile);

    // Add sections in order
    this.addProfessionalSummary(userProfile);
    this.addWorkExperience(userProfile);
    this.addEducation(userProfile);
    this.addSkills(userProfile);
    this.addProjects(userProfile);
    this.addCertifications(userProfile);
    this.addLanguages(userProfile);
  }

  public downloadPDF(filename: string): void {
    this.pdf.save(filename);
  }

  public getPDFBlob(): Blob {
    return this.pdf.output('blob');
  }
}

export const generateAndDownloadResume = (
  userProfile: UserProfile,
  displayName: string
): void => {
  try {
    const generator = new ResumePDFGenerator();
    generator.generateResume({ userProfile, name: displayName });

    // Create filename with user's name and current date
    const date = new Date().toISOString().split('T')[0];
    const cleanName = displayName.replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `${cleanName}_Resume_${date}.pdf`;

    generator.downloadPDF(filename);
  } catch (error) {
    console.error('Error generating resume PDF:', error);
    throw new Error('Failed to generate resume PDF');
  }
};
