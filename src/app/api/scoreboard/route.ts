import { NextRequest, NextResponse } from 'next/server';
import { getSql, isDatabaseConnected } from '@/lib/database';

interface DatabaseTeam {
  team_id: number;
  team_name: string;
  quiz_score: number;
  voting_score: number;
  offline_score: number;
  total_score: number;
  status: string;
  current_round: number;
  created_at: string;
  last_activity: string;
  online_score?: number;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'online'; // online, final, or all
  
  try {
    if (!isDatabaseConnected()) {
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    if (type === 'online') {
      // Return combined online scores (quiz + voting)
      const sql = getSql();
      const teamsData = await sql`
        SELECT 
          t.id as team_id,
          t.team_name,
          COALESCE(t.quiz_score, 0) as quiz_score,
          COALESCE(t.voting_score, 0) as voting_score,
          COALESCE(t.quiz_score, 0) + COALESCE(t.voting_score, 0) as online_score,
          t.status
        FROM teams t
        WHERE t.status != 'disqualified'
        ORDER BY online_score DESC, t.team_name ASC
      `;

      const onlineScoreboard = (teamsData as DatabaseTeam[]).map((team, index) => ({
        teamId: team.team_id,
        teamName: team.team_name,
        quizScore: team.quiz_score,
        votingScore: team.voting_score,
        onlineScore: (team.online_score || 0),
        rank: index + 1,
        status: team.status
      }));

      return NextResponse.json({
        success: true,
        type: 'online',
        scoreboard: onlineScoreboard,
        totalTeams: onlineScoreboard.length,
        lastUpdated: new Date().toISOString(),
        summary: {
          totalTeams: onlineScoreboard.length,
          qualified: onlineScoreboard.filter(t => t.onlineScore >= 50).length,
          averageQuizScore: onlineScoreboard.length > 0 ? Math.round(onlineScoreboard.reduce((sum, t) => sum + t.quizScore, 0) / onlineScoreboard.length) : 0,
          averageVotingScore: onlineScoreboard.length > 0 ? Math.round(onlineScoreboard.reduce((sum, t) => sum + t.votingScore, 0) / onlineScoreboard.length) : 0
        }
      });
    }

    if (type === 'final') {
      // Return final comprehensive scores (quiz + voting + offline)
      const sql = getSql();
      const teamsData = await sql`
        SELECT 
          t.id as team_id,
          t.team_name,
          COALESCE(t.quiz_score, 0) as quiz_score,
          COALESCE(t.voting_score, 0) as voting_score,
          COALESCE(t.offline_score, 0) as offline_score,
          COALESCE(t.total_score, 0) as total_score,
          t.status,
          t.current_round
        FROM teams t
        WHERE t.status != 'disqualified'
        ORDER BY total_score DESC, t.team_name ASC
      `;

      const finalScoreboard = (teamsData as DatabaseTeam[]).map((team, index) => ({
        teamId: team.team_id,
        teamName: team.team_name,
        quizScore: team.quiz_score,
        votingScore: team.voting_score,
        offlineScore: team.offline_score,
        totalScore: team.total_score,
        rank: index + 1,
        status: team.status,
        currentRound: team.current_round
      }));

      return NextResponse.json({
        success: true,
        type: 'final',
        scoreboard: finalScoreboard,
        totalTeams: finalScoreboard.length,
        lastUpdated: new Date().toISOString(),
        summary: {
          totalTeams: finalScoreboard.length,
          completed: finalScoreboard.filter(t => t.currentRound >= 3).length,
          averageQuizScore: finalScoreboard.length > 0 ? Math.round(finalScoreboard.reduce((sum, t) => sum + t.quizScore, 0) / finalScoreboard.length) : 0,
          averageVotingScore: finalScoreboard.length > 0 ? Math.round(finalScoreboard.reduce((sum, t) => sum + t.votingScore, 0) / finalScoreboard.length) : 0,
          averageOfflineScore: finalScoreboard.length > 0 ? Math.round(finalScoreboard.reduce((sum, t) => sum + t.offlineScore, 0) / finalScoreboard.length) : 0,
          averageTotalScore: finalScoreboard.length > 0 ? Math.round(finalScoreboard.reduce((sum, t) => sum + t.totalScore, 0) / finalScoreboard.length) : 0
        }
      });
    }

    if (type === 'quiz') {
      // Return only quiz scores
      const sql = getSql();
      const teamsData = await sql`
        SELECT 
          t.id as team_id,
          t.team_name,
          COALESCE(t.quiz_score, 0) as quiz_score,
          t.status
        FROM teams t
        WHERE t.status != 'disqualified'
        ORDER BY quiz_score DESC, t.team_name ASC
      `;

      const quizScoreboard = (teamsData as DatabaseTeam[]).map((team, index) => ({
        teamId: team.team_id,
        teamName: team.team_name,
        quizScore: team.quiz_score,
        rank: index + 1,
        status: team.status
      }));

      return NextResponse.json({
        success: true,
        type: 'quiz',
        scoreboard: quizScoreboard,
        totalTeams: quizScoreboard.length,
        lastUpdated: new Date().toISOString(),
        summary: {
          totalTeams: quizScoreboard.length,
          averageScore: quizScoreboard.length > 0 ? Math.round(quizScoreboard.reduce((sum, t) => sum + t.quizScore, 0) / quizScoreboard.length) : 0,
          highestScore: quizScoreboard.length > 0 ? Math.max(...quizScoreboard.map(t => t.quizScore)) : 0
        }
      });
    }

    if (type === 'voting') {
      // Return only voting scores
      const sql = getSql();
      const teamsData = await sql`
        SELECT 
          t.id as team_id,
          t.team_name,
          COALESCE(t.voting_score, 0) as voting_score,
          t.status
        FROM teams t
        WHERE t.status != 'disqualified'
        ORDER BY voting_score DESC, t.team_name ASC
      `;

      const votingScoreboard = (teamsData as DatabaseTeam[]).map((team, index) => ({
        teamId: team.team_id,
        teamName: team.team_name,
        votingScore: team.voting_score,
        rank: index + 1,
        status: team.status
      }));

      return NextResponse.json({
        success: true,
        type: 'voting',
        scoreboard: votingScoreboard,
        totalTeams: votingScoreboard.length,
        lastUpdated: new Date().toISOString(),
        summary: {
          totalTeams: votingScoreboard.length,
          averageScore: votingScoreboard.length > 0 ? Math.round(votingScoreboard.reduce((sum, t) => sum + t.votingScore, 0) / votingScoreboard.length) : 0,
          highestScore: votingScoreboard.length > 0 ? Math.max(...votingScoreboard.map(t => t.votingScore)) : 0
        }
      });
    }

    // Default: return all comprehensive data
    const sql = getSql();
    const teamsData = await sql`
      SELECT 
        t.id as team_id,
        t.team_name,
        COALESCE(t.quiz_score, 0) as quiz_score,
        COALESCE(t.voting_score, 0) as voting_score,
        COALESCE(t.offline_score, 0) as offline_score,
        COALESCE(t.total_score, 0) as total_score,
        t.status,
        t.current_round,
        t.created_at,
        t.last_activity
      FROM teams t
      WHERE t.status != 'disqualified'
      ORDER BY total_score DESC, quiz_score DESC, voting_score DESC, t.team_name ASC
    `;

    const completeScoreboard = (teamsData as DatabaseTeam[]).map((team, index) => ({
      teamId: team.team_id,
      teamName: team.team_name,
      quizScore: team.quiz_score,
      votingScore: team.voting_score,
      offlineScore: team.offline_score,
      totalScore: team.total_score,
      rank: index + 1,
      status: team.status,
      currentRound: team.current_round,
      registrationTime: team.created_at,
      lastActivity: team.last_activity
    }));

    return NextResponse.json({
      success: true,
      type: 'complete',
      scoreboard: completeScoreboard,
      totalTeams: completeScoreboard.length,
      lastUpdated: new Date().toISOString(),
      summary: {
        totalTeams: completeScoreboard.length,
        activeTeams: completeScoreboard.filter(t => t.status === 'active').length,
        completedTeams: completeScoreboard.filter(t => t.currentRound >= 3).length,
        averageQuizScore: completeScoreboard.length > 0 ? Math.round(completeScoreboard.reduce((sum, t) => sum + t.quizScore, 0) / completeScoreboard.length) : 0,
        averageVotingScore: completeScoreboard.length > 0 ? Math.round(completeScoreboard.reduce((sum, t) => sum + t.votingScore, 0) / completeScoreboard.length) : 0,
        averageOfflineScore: completeScoreboard.length > 0 ? Math.round(completeScoreboard.reduce((sum, t) => sum + t.offlineScore, 0) / completeScoreboard.length) : 0,
        averageTotalScore: completeScoreboard.length > 0 ? Math.round(completeScoreboard.reduce((sum, t) => sum + t.totalScore, 0) / completeScoreboard.length) : 0,
        highestQuizScore: completeScoreboard.length > 0 ? Math.max(...completeScoreboard.map(t => t.quizScore)) : 0,
        highestTotalScore: completeScoreboard.length > 0 ? Math.max(...completeScoreboard.map(t => t.totalScore)) : 0
      }
    });

  } catch (error) {
    console.error('Error fetching scoreboard:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch scoreboard data',
        type: type,
        scoreboard: [],
        totalTeams: 0
      },
      { status: 500 }
    );
  }
}
