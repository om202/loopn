'use client';

import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../../amplify/data/resource';

let client: ReturnType<typeof generateClient<Schema>> | null = null;

const getClient = () => {
  if (!client) {
    client = generateClient<Schema>();
  }
  return client;
};



export class BugReportService {
  static async submitBugReport(
    userId: string,
    title: string,
    description: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await getClient().models.BugReport.create({
        userId,
        title,
        description,
        reportedAt: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to submit bug report' 
      };
    }
  }
}
