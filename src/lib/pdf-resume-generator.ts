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
  private margin: number = 15;
  private currentY: number = 15;
  private lineHeight: number = 5;

  // Standard resume colors (hierarchical grays)
  private colors = {
    primary: [0, 0, 0] as [number, number, number], // Black for main content
    secondary: [60, 60, 60] as [number, number, number], // Dark gray for job titles, degrees
    tertiary: [100, 100, 100] as [number, number, number], // Medium gray for companies, dates
    quaternary: [130, 130, 130] as [number, number, number], // Light gray for supporting info
    divider: [180, 180, 180] as [number, number, number], // Very light gray for lines
  };

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageWidth = this.pdf.internal.pageSize.getWidth();
    this.pageHeight = this.pdf.internal.pageSize.getHeight();
  }

  private addHeader(name: string, userProfile: UserProfile): void {
    // Name - largest, bold, black
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(18);
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.text(name, this.margin, this.currentY);
    this.currentY += 8;

    // Job title and company - 14pt, dark gray
    if (userProfile.jobRole || userProfile.companyName) {
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...this.colors.secondary);

      let jobLine = '';
      if (userProfile.jobRole) jobLine += userProfile.jobRole;
      if (userProfile.companyName) {
        jobLine += jobLine
          ? ` at ${userProfile.companyName}`
          : userProfile.companyName;
      }

      this.pdf.text(jobLine, this.margin, this.currentY);
      this.currentY += 6;
    }

    // Contact information - 10pt, light gray
    this.pdf.setFontSize(10);
    this.pdf.setTextColor(...this.colors.quaternary);
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
      this.currentY += 4;
    }

    // Professional links - 10pt, light gray
    const linksInfo = [];
    if (userProfile.linkedinUrl)
      linksInfo.push(userProfile.linkedinUrl.replace('https://', ''));
    if (userProfile.githubUrl)
      linksInfo.push(userProfile.githubUrl.replace('https://', ''));
    if (userProfile.portfolioUrl)
      linksInfo.push(userProfile.portfolioUrl.replace('https://', ''));

    if (linksInfo.length > 0) {
      this.pdf.text(linksInfo.join(' • '), this.margin, this.currentY);
      this.currentY += 4;
    }

    this.currentY += 10;
  }

  private addSectionTitle(title: string): void {
    this.checkPageBreak(15);
    // Add extra space before section titles (except for the first section)
    if (this.currentY > 40) {
      this.currentY += 8;
    }

    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(14);
    this.pdf.setTextColor(...this.colors.primary);
    this.pdf.text(title.toUpperCase(), this.margin, this.currentY);
    this.currentY += 10;
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
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...this.colors.primary);

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
      this.checkPageBreak(15);

      // Job title - 14pt, dark gray, bold
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...this.colors.secondary);
      this.pdf.text(job.position || 'Position', this.margin, this.currentY);

      // Dates - 10pt, light gray, right aligned
      if (job.startDate || job.endDate) {
        const dates = `${job.startDate || ''} - ${job.endDate || 'Present'}`;
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.quaternary);
        const dateWidth = this.pdf.getTextWidth(dates);
        this.pdf.text(
          dates,
          this.pageWidth - this.margin - dateWidth,
          this.currentY
        );
      }

      this.currentY += 5;

      // Company name - 10pt, medium gray
      if (job.company) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.tertiary);
        this.pdf.text(job.company, this.margin, this.currentY);
        this.currentY += 5;
      }

      // Job description - 12pt, black
      if (job.description) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.colors.primary);

        const splitText = this.pdf.splitTextToSize(
          job.description,
          this.pageWidth - 2 * this.margin
        );
        this.checkPageBreak(splitText.length * this.lineHeight);

        this.pdf.text(splitText, this.margin, this.currentY);
        this.currentY += splitText.length * this.lineHeight + 2;
      }

      if (index < workExperience.length - 1) {
        this.currentY += 8;
      }
    });

    this.currentY += 0;
  }

  private addEducation(userProfile: UserProfile): void {
    const education = userProfile.educationHistory as any[];
    if (!education || !Array.isArray(education) || education.length === 0) {
      // Fallback to simple education field
      if (userProfile.education) {
        this.addSectionTitle('Education');
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.colors.primary);
        this.pdf.text(userProfile.education, this.margin, this.currentY);
        this.currentY += 6;
      }
      return;
    }

    this.addSectionTitle('Education');

    education.forEach((edu, index) => {
      this.checkPageBreak(12);

      // Degree - 12pt, dark gray, bold
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...this.colors.secondary);
      this.pdf.text(edu.degree || 'Degree', this.margin, this.currentY);

      // Dates - 10pt, light gray, right aligned
      if (edu.startYear || edu.endYear) {
        const dates = `${edu.startYear || ''} - ${edu.endYear || ''}`;
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.quaternary);
        const dateWidth = this.pdf.getTextWidth(dates);
        this.pdf.text(
          dates,
          this.pageWidth - this.margin - dateWidth,
          this.currentY
        );
      }

      this.currentY += 4;

      // Field of study - 10pt, medium gray
      if (edu.field) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.tertiary);
        this.pdf.text(edu.field, this.margin, this.currentY);
        this.currentY += 4;
      }

      // Institution - 10pt, light gray
      if (edu.institution) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.quaternary);
        this.pdf.text(edu.institution, this.margin, this.currentY);
        this.currentY += 4;
      }

      if (index < education.length - 1) {
        this.currentY += 6;
      }
    });

    this.currentY += 0;
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
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...this.colors.primary);

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
      this.checkPageBreak(12);

      // Project title - 12pt, dark gray, bold
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...this.colors.secondary);
      this.pdf.text(project.title || 'Project', this.margin, this.currentY);
      this.currentY += 4;

      // Technologies - 10pt, light gray
      if (project.technologies) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.quaternary);
        this.pdf.text(
          `Technologies: ${project.technologies}`,
          this.margin,
          this.currentY
        );
        this.currentY += 4;
      }

      // Description - 12pt, black
      if (project.description) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(12);
        this.pdf.setTextColor(...this.colors.primary);

        const splitText = this.pdf.splitTextToSize(
          project.description,
          this.pageWidth - 2 * this.margin
        );
        this.checkPageBreak(splitText.length * this.lineHeight);

        this.pdf.text(splitText, this.margin, this.currentY);
        this.currentY += splitText.length * this.lineHeight + 2;
      }

      if (index < projects.length - 1) {
        this.currentY += 6;
      }
    });

    this.currentY += 0;
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
      this.checkPageBreak(8);

      // Certification name - 12pt, dark gray, bold
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.setFontSize(12);
      this.pdf.setTextColor(...this.colors.secondary);
      this.pdf.text(cert.name || 'Certification', this.margin, this.currentY);

      // Date - 10pt, light gray, right aligned
      if (cert.date) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.quaternary);
        const dateWidth = this.pdf.getTextWidth(cert.date);
        this.pdf.text(
          cert.date,
          this.pageWidth - this.margin - dateWidth,
          this.currentY
        );
      }

      this.currentY += 4;

      // Issuer - 10pt, medium gray
      if (cert.issuer) {
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(10);
        this.pdf.setTextColor(...this.colors.tertiary);
        this.pdf.text(cert.issuer, this.margin, this.currentY);
        this.currentY += 4;
      }

      if (index < certifications.length - 1) {
        this.currentY += 5;
      }
    });

    this.currentY += 0;
  }

  private addLanguages(userProfile: UserProfile): void {
    const languages = userProfile.languages as any[];
    if (!languages || !Array.isArray(languages) || languages.length === 0)
      return;

    this.addSectionTitle('Languages');

    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(12);
    this.pdf.setTextColor(...this.colors.primary);

    languages.forEach((lang, index) => {
      const langText = `${lang.language}${lang.proficiency ? ` (${lang.proficiency})` : ''}`;
      this.pdf.text(langText, this.margin + (index % 2) * 90, this.currentY);

      if (index % 2 === 1 || index === languages.length - 1) {
        this.currentY += 6;
      }
    });

    this.currentY += 0;
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
