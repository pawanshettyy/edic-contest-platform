// Timer management system for voting sessions
import { getSql } from './database';

class VotingTimer {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Start a timer for a voting session
   */
  startTimer(sessionId: string, duration: number): void {
    // Clear existing timer if any
    this.stopTimer(sessionId);

    // Start new timer
    const interval = setInterval(async () => {
      await this.decrementTimer(sessionId);
    }, 1000);

    this.intervals.set(sessionId, interval);
    console.log(`🕒 Timer started for session ${sessionId} with ${duration} seconds`);
  }

  /**
   * Stop a timer for a session
   */
  stopTimer(sessionId: string): void {
    const interval = this.intervals.get(sessionId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(sessionId);
      console.log(`⏹️ Timer stopped for session ${sessionId}`);
    }
  }

  /**
   * Stop all timers
   */
  stopAllTimers(): void {
    for (const [sessionId] of this.intervals) {
      this.stopTimer(sessionId);
    }
  }

  /**
   * Decrement timer and handle expiration
   */
  private async decrementTimer(sessionId: string): Promise<void> {
    try {
      const sql = getSql();

      // Decrement time_remaining by 1 second
      const result = await sql`
        UPDATE voting_sessions 
        SET time_remaining = GREATEST(time_remaining - 1, 0),
            updated_at = NOW()
        WHERE id = ${sessionId} AND is_active = true
        RETURNING time_remaining, phase
      ` as Array<{ time_remaining: number; phase: string }>;

      if (result.length === 0) {
        // Session not found or not active, stop timer
        this.stopTimer(sessionId);
        return;
      }

      const { time_remaining, phase } = result[0];

      // Handle timer expiration
      if (time_remaining <= 0) {
        console.log(`⏰ Timer expired for session ${sessionId} in phase ${phase}`);
        await this.handleTimerExpiration(sessionId, phase);
      }
    } catch (error) {
      console.error(`Error decrementing timer for session ${sessionId}:`, error);
      // Don't stop timer on error, just log it
    }
  }

  /**
   * Handle what happens when timer expires
   */
  private async handleTimerExpiration(sessionId: string, phase: string): Promise<void> {
    try {
      const sql = getSql();
      
      switch (phase) {
        case 'pitching':
          // Move from pitching to voting phase
          await sql`
            UPDATE voting_sessions 
            SET phase = 'voting',
                time_remaining = 120,
                updated_at = NOW()
            WHERE id = ${sessionId}
          `;
          console.log(`🔄 Session ${sessionId} moved from pitching to voting`);
          // Keep timer running for voting phase
          break;

        case 'voting':
          // Move to break phase before next team
          await this.moveToBreakPhase(sessionId);
          break;

        case 'break':
          // Move from break to next team's pitching phase
          await this.moveToNextTeam(sessionId);
          break;

        default:
          // Stop timer for other phases
          this.stopTimer(sessionId);
          break;
      }
    } catch (error) {
      console.error(`Error handling timer expiration for session ${sessionId}:`, error);
      this.stopTimer(sessionId);
    }
  }

  /**
   * Move to break phase (2 minutes between teams)
   */
  private async moveToBreakPhase(sessionId: string): Promise<void> {
    try {
      const sql = getSql();

      // Get current presenting team info
      const currentSession = await sql`
        SELECT current_presenting_team FROM voting_sessions
        WHERE id = ${sessionId}
      ` as Array<{ current_presenting_team: string | null }>;

      if (!currentSession.length) {
        this.stopTimer(sessionId);
        return;
      }

      const currentTeamId = currentSession[0].current_presenting_team;

      if (currentTeamId) {
        // Mark current team as presented
        await sql`
          UPDATE team_presentations 
          SET has_presented = true 
          WHERE team_id = ${currentTeamId} AND session_id = ${sessionId}
        `;
      }

      // Check if there are more teams to present
      const nextTeam = await sql`
        SELECT tp.team_id, tp.presentation_order
        FROM team_presentations tp
        JOIN teams t ON tp.team_id = t.id
        WHERE tp.session_id = ${sessionId} 
          AND tp.has_presented = false
          AND t.status = 'active'
        ORDER BY tp.presentation_order
        LIMIT 1
      ` as Array<{ team_id: string; presentation_order: number }>;

      if (nextTeam.length > 0) {
        // Move to break phase for 2 minutes (120 seconds)
        await sql`
          UPDATE voting_sessions 
          SET phase = 'break',
              time_remaining = 120,
              updated_at = NOW()
          WHERE id = ${sessionId}
        `;
        console.log(`⏸️ Session ${sessionId} moved to break phase for 2 minutes`);
        // Timer continues running for break phase
      } else {
        // All teams have presented, finalize voting session
        await this.finalizeVotingSession(sessionId);
      }
    } catch (error) {
      console.error(`Error moving to break phase for session ${sessionId}:`, error);
      this.stopTimer(sessionId);
    }
  }

  /**
   * Finalize voting session - save final results and lock voting
   */
  private async finalizeVotingSession(sessionId: string): Promise<void> {
    try {
      const sql = getSql();

      // Mark session as completed and save completion timestamp
      await sql`
        UPDATE voting_sessions 
        SET phase = 'completed',
            current_presenting_team = NULL,
            time_remaining = 0,
            is_active = false,
            phase_end_time = NOW(),
            updated_at = NOW()
        WHERE id = ${sessionId}
      `;

      // Calculate and log final voting results
      const finalResults = await sql`
        SELECT 
          t.id as team_id,
          t.team_name,
          COALESCE(upvotes.count, 0) as upvotes,
          COALESCE(downvotes.count, 0) as downvotes,
          (COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0)) as total_score
        FROM teams t
        LEFT JOIN (
          SELECT to_team_id, COUNT(*) as count 
          FROM votes 
          WHERE session_id = ${sessionId} AND vote_type = 'upvote'
          GROUP BY to_team_id
        ) upvotes ON t.id = upvotes.to_team_id
        LEFT JOIN (
          SELECT to_team_id, COUNT(*) as count 
          FROM votes 
          WHERE session_id = ${sessionId} AND vote_type = 'downvote'
          GROUP BY to_team_id
        ) downvotes ON t.id = downvotes.to_team_id
        WHERE t.status = 'active'
        ORDER BY total_score DESC, t.team_name
      ` as Array<{
        team_id: string;
        team_name: string;
        upvotes: number;
        downvotes: number;
        total_score: number;
      }>;

      // Count total votes cast
      const voteCount = await sql`
        SELECT COUNT(*) as total_votes FROM votes WHERE session_id = ${sessionId}
      ` as Array<{ total_votes: string }>;

      console.log(`🏁 Session ${sessionId} FINALIZED!`);
      console.log(`📊 Final Results:`);
      finalResults.forEach((result, index) => {
        console.log(`   ${index + 1}. ${result.team_name}: ${result.total_score} points (${result.upvotes}↑ ${result.downvotes}↓)`);
      });
      console.log(`📝 Total votes cast: ${voteCount[0]?.total_votes || 0}`);
      console.log(`🔒 Voting is now LOCKED for this session`);
      
      this.stopTimer(sessionId);
    } catch (error) {
      console.error(`Error finalizing session ${sessionId}:`, error);
      this.stopTimer(sessionId);
    }
  }

  /**
   * Move to next team or end session
   */
  /**
   * Move to next team or end session
   */
  private async moveToNextTeam(sessionId: string): Promise<void> {
    try {
      const sql = getSql();

      // Find next team
      const nextTeam = await sql`
        SELECT tp.team_id, tp.presentation_order
        FROM team_presentations tp
        JOIN teams t ON tp.team_id = t.id
        WHERE tp.session_id = ${sessionId} 
          AND tp.has_presented = false
          AND t.status = 'active'
        ORDER BY tp.presentation_order
        LIMIT 1
      ` as Array<{ team_id: string; presentation_order: number }>;

      if (nextTeam.length > 0) {
        // Move to next team's pitching phase
        await sql`
          UPDATE voting_sessions 
          SET phase = 'pitching',
              current_presenting_team = ${nextTeam[0].team_id},
              time_remaining = 90,
              updated_at = NOW()
          WHERE id = ${sessionId}
        `;
        console.log(`▶️ Session ${sessionId} moved to next team: ${nextTeam[0].team_id}`);
        // Timer continues running
      } else {
        // All teams have presented, finalize voting session
        await this.finalizeVotingSession(sessionId);
      }
    } catch (error) {
      console.error(`Error moving to next team for session ${sessionId}:`, error);
      this.stopTimer(sessionId);
    }
  }

  /**
   * Update timer for a session
   */
  async updateTimer(sessionId: string, newTime: number): Promise<void> {
    try {
      const sql = getSql();
      
      await sql`
        UPDATE voting_sessions 
        SET time_remaining = ${newTime},
            updated_at = NOW()
        WHERE id = ${sessionId}
      `;
      
      console.log(`⏱️ Timer updated for session ${sessionId} to ${newTime} seconds`);
    } catch (error) {
      console.error(`Error updating timer for session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get active timers info
   */
  getActiveTimers(): string[] {
    return Array.from(this.intervals.keys());
  }

  /**
   * Resume timers on server restart
   */
  async resumeTimersOnStartup(): Promise<void> {
    try {
      const sql = getSql();
      
      // Find all active sessions with time remaining
      const activeSessions = await sql`
        SELECT id, time_remaining, phase
        FROM voting_sessions
        WHERE is_active = true AND time_remaining > 0
      ` as Array<{ id: string; time_remaining: number; phase: string }>;

      for (const session of activeSessions) {
        this.startTimer(session.id, session.time_remaining);
        console.log(`🔄 Resumed timer for session ${session.id} (${session.time_remaining}s remaining in ${session.phase} phase)`);
      }
    } catch (error) {
      console.error('Error resuming timers on startup:', error);
    }
  }
}

// Export singleton instance
export const votingTimer = new VotingTimer();

// Resume timers on module load (server startup)
if (typeof window === 'undefined') {
  // Only run on server-side
  votingTimer.resumeTimersOnStartup();
}
