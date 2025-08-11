import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';

export async function GET() {
  try {
    const sql = getSql();
    
    // Get contest configuration
    const configResult = await sql`
      SELECT 
        registration_deadline,
        registration_open,
        contest_active
      FROM contest_config 
      LIMIT 1
    `;

    if (!configResult || (configResult as unknown[]).length === 0) {
      return NextResponse.json({
        success: false,
        registrationOpen: true, // Default to open if no config
        message: 'Contest configuration not found'
      });
    }

    const config = (configResult as unknown[])[0] as {
      registration_deadline: string | null;
      registration_open: boolean;
      contest_active: boolean;
    };

    const now = new Date();
    let registrationOpen = config.registration_open;
    let message = '';

    // Check if registration deadline has passed
    if (config.registration_deadline) {
      const deadline = new Date(config.registration_deadline);
      if (now > deadline) {
        registrationOpen = false;
        message = `Registration closed. Deadline was ${deadline.toLocaleString()}`;
      }
    }

    // Check if contest is already active
    if (config.contest_active) {
      registrationOpen = false;
      message = 'Registration closed. Contest is already active.';
    }

    // Override with manual setting
    if (!config.registration_open) {
      registrationOpen = false;
      message = 'Registration has been manually disabled by administrators.';
    }

    return NextResponse.json({
      success: true,
      registrationOpen,
      registrationDeadline: config.registration_deadline,
      contestActive: config.contest_active,
      message: message || 'Registration is open'
    });

  } catch (error) {
    console.error('Error checking registration status:', error);
    return NextResponse.json({
      success: false,
      registrationOpen: false,
      message: 'Error checking registration status'
    }, { status: 500 });
  }
}
