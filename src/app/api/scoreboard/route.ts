import { NextRequest, NextResponse } from 'next/server';

// Mock data for demonstration - in production this would come from database
const mockQuizScores = [
  { teamId: 'team1', teamName: 'Innovators', score: 45 },
  { teamId: 'team2', teamName: 'Tech Pioneers', score: 38 },
  { teamId: 'team3', teamName: 'Future Builders', score: 52 },
  { teamId: 'team4', teamName: 'Digital Transformers', score: 41 }
];

const mockVotingScores = [
  { teamId: 'team1', teamName: 'Innovators', score: 8 },
  { teamId: 'team2', teamName: 'Tech Pioneers', score: 12 },
  { teamId: 'team3', teamName: 'Future Builders', score: 6 },
  { teamId: 'team4', teamName: 'Digital Transformers', score: 10 }
];

const mockOfflineScores = [
  { teamId: 'team1', teamName: 'Innovators', score: 85 },
  { teamId: 'team2', teamName: 'Tech Pioneers', score: 78 },
  { teamId: 'team3', teamName: 'Future Builders', score: 92 },
  { teamId: 'team4', teamName: 'Digital Transformers', score: 88 }
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'online'; // online, final, or all
  
  try {
    if (type === 'online') {
      // Return combined online scores (quiz + voting)
      const combinedScores = mockQuizScores.map(quizTeam => {
        const votingTeam = mockVotingScores.find(v => v.teamId === quizTeam.teamId);
        const onlineTotal = quizTeam.score + (votingTeam?.score || 0);
        
        return {
          rank: 0, // Will be calculated after sorting
          teamId: quizTeam.teamId,
          teamName: quizTeam.teamName,
          quizScore: quizTeam.score,
          votingScore: votingTeam?.score || 0,
          onlineTotal,
          status: onlineTotal >= 50 ? 'qualified' : 'eliminated' as const
        };
      });
      
      // Sort by online total and assign ranks
      combinedScores.sort((a, b) => b.onlineTotal - a.onlineTotal);
      combinedScores.forEach((team, index) => {
        team.rank = index + 1;
      });
      
      return NextResponse.json({
        success: true,
        type: 'online',
        scoreboard: combinedScores,
        qualificationThreshold: 50,
        maxQuizScore: 60, // 15 questions × 4 max points
        summary: {
          totalTeams: combinedScores.length,
          qualified: combinedScores.filter(t => t.status === 'qualified').length,
          averageQuizScore: Math.round(combinedScores.reduce((sum, t) => sum + t.quizScore, 0) / combinedScores.length),
          averageVotingScore: Math.round(combinedScores.reduce((sum, t) => sum + t.votingScore, 0) / combinedScores.length)
        }
      });
    }
    
    if (type === 'final') {
      // Return final scores including offline evaluation
      const finalScores = mockQuizScores.map(quizTeam => {
        const votingTeam = mockVotingScores.find(v => v.teamId === quizTeam.teamId);
        const offlineTeam = mockOfflineScores.find(o => o.teamId === quizTeam.teamId);
        
        const onlineTotal = quizTeam.score + (votingTeam?.score || 0);
        const offlineScore = offlineTeam?.score || 0;
        
        // Weighted final score: 40% online, 60% offline
        const finalScore = Math.round((onlineTotal * 0.4) + (offlineScore * 0.6));
        
        return {
          rank: 0, // Will be calculated after sorting
          teamId: quizTeam.teamId,
          teamName: quizTeam.teamName,
          quizScore: quizTeam.score,
          votingScore: votingTeam?.score || 0,
          onlineTotal,
          offlineScore,
          finalScore,
          status: 'completed' as const
        };
      });
      
      // Sort by final score and assign ranks
      finalScores.sort((a, b) => b.finalScore - a.finalScore);
      finalScores.forEach((team, index) => {
        team.rank = index + 1;
      });
      
      return NextResponse.json({
        success: true,
        type: 'final',
        scoreboard: finalScores,
        weights: {
          online: 0.4,
          offline: 0.6
        },
        summary: {
          totalTeams: finalScores.length,
          winner: finalScores[0],
          averageFinalScore: Math.round(finalScores.reduce((sum, t) => sum + t.finalScore, 0) / finalScores.length),
          scoreRange: {
            highest: finalScores[0].finalScore,
            lowest: finalScores[finalScores.length - 1].finalScore
          }
        }
      });
    }
    
    // Return all available data
    return NextResponse.json({
      success: true,
      type: 'all',
      quiz: mockQuizScores,
      voting: mockVotingScores,
      offline: mockOfflineScores,
      lastUpdated: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scoreboard error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch scoreboard data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, offlineScore, comments, evaluatedBy } = body;
    
    // Validate input
    if (!teamId || typeof offlineScore !== 'number' || !evaluatedBy) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (offlineScore < 0 || offlineScore > 100) {
      return NextResponse.json(
        { success: false, error: 'Offline score must be between 0 and 100' },
        { status: 400 }
      );
    }
    
    // Find and update team's offline score
    const teamIndex = mockOfflineScores.findIndex(t => t.teamId === teamId);
    if (teamIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Team not found' },
        { status: 404 }
      );
    }
    
    // Update offline score
    mockOfflineScores[teamIndex].score = offlineScore;
    
    // Calculate updated final score
    const quizTeam = mockQuizScores.find(q => q.teamId === teamId);
    const votingTeam = mockVotingScores.find(v => v.teamId === teamId);
    const onlineTotal = (quizTeam?.score || 0) + (votingTeam?.score || 0);
    const finalScore = Math.round((onlineTotal * 0.4) + (offlineScore * 0.6));
    
    const evaluation = {
      teamId,
      teamName: mockOfflineScores[teamIndex].teamName,
      onlineScore: onlineTotal,
      offlineScore,
      finalScore,
      comments,
      evaluatedBy,
      evaluatedAt: new Date()
    };
    
    return NextResponse.json({
      success: true,
      evaluation,
      message: 'Offline evaluation updated successfully'
    });
    
  } catch (error) {
    console.error('Evaluation update error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update evaluation' },
      { status: 500 }
    );
  }
}
