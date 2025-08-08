import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

type VotingPhase = 'waiting' | 'pitching' | 'voting' | 'break' | 'completed';
type VoteType = 'upvote' | 'downvote';

interface VoteRecord {
  id: string;
  fromTeamId: string;
  toTeamId: string;
  voteType: VoteType;
  timestamp: Date;
  sessionId: string;
}

interface TeamVoteCount {
  upvotes: number;
  downvotes: number;
  totalScore: number;
}

interface VotingTeamStatus {
  teamId: string;
  teamName: string;
  hasPresented: boolean;
  presentationOrder: number;
  votesReceived: TeamVoteCount;
  votingHistory: VoteRecord[];
  downvotesUsed: number;
  isCurrentlyPresenting: boolean;
  canVote: boolean;
}

interface VotingSession {
  id: string;
  roundId: string;
  currentPresentingTeam: string;
  phase: VotingPhase;
  phaseStartTime: Date;
  phaseEndTime: Date;
  pitchDuration: number;
  votingDuration: number;
  teams: VotingTeamStatus[];
  createdAt: Date;
}

// Enhanced voting session with phases and constraints
// eslint-disable-next-line prefer-const
let votingSession: VotingSession = {
  id: 'voting_session_1',
  roundId: 'round2',
  currentPresentingTeam: '',
  phase: 'waiting' as const,
  phaseStartTime: new Date(),
  phaseEndTime: new Date(),
  pitchDuration: 90, // seconds
  votingDuration: 30, // seconds
  teams: [
    {
      teamId: 'team1',
      teamName: 'Innovators',
      hasPresented: false,
      presentationOrder: 1,
      votesReceived: { upvotes: 0, downvotes: 0, totalScore: 0 },
      votingHistory: [],
      downvotesUsed: 0,
      isCurrentlyPresenting: false,
      canVote: true
    },
    {
      teamId: 'team2',
      teamName: 'Tech Pioneers',
      hasPresented: false,
      presentationOrder: 2,
      votesReceived: { upvotes: 0, downvotes: 0, totalScore: 0 },
      votingHistory: [],
      downvotesUsed: 0,
      isCurrentlyPresenting: false,
      canVote: true
    },
    {
      teamId: 'team3',
      teamName: 'Future Builders',
      hasPresented: false,
      presentationOrder: 3,
      votesReceived: { upvotes: 0, downvotes: 0, totalScore: 0 },
      votingHistory: [],
      downvotesUsed: 0,
      isCurrentlyPresenting: false,
      canVote: true
    },
    {
      teamId: 'team4',
      teamName: 'Digital Transformers',
      hasPresented: false,
      presentationOrder: 4,
      votesReceived: { upvotes: 0, downvotes: 0, totalScore: 0 },
      votingHistory: [],
      downvotesUsed: 0,
      isCurrentlyPresenting: false,
      canVote: true
    }
  ],
  createdAt: new Date()
};

const voteSchema = z.object({
  fromTeamId: z.string(),
  toTeamId: z.string(),
  voteType: z.enum(['upvote', 'downvote'])
});

const phaseControlSchema = z.object({
  action: z.enum(['start_pitch', 'start_voting', 'next_team', 'end_session']),
  teamId: z.string().optional()
});

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  
  if (action === 'status') {
    // Calculate time remaining in current phase
    const now = new Date();
    const timeRemaining = Math.max(0, Math.floor((votingSession.phaseEndTime.getTime() - now.getTime()) / 1000));
    
    return NextResponse.json({
      success: true,
      session: {
        ...votingSession,
        timeRemaining,
        constraints: {
          maxDownvotes: 3,
          pitchDuration: 90,
          votingDuration: 30,
          canVoteForSelf: false
        }
      }
    });
  }
  
  if (action === 'results') {
    // Return final voting results
    const results = votingSession.teams
      .map(team => ({
        teamId: team.teamId,
        teamName: team.teamName,
        votingScore: team.votesReceived.totalScore,
        upvotes: team.votesReceived.upvotes,
        downvotes: team.votesReceived.downvotes,
        hasPresented: team.hasPresented
      }))
      .sort((a, b) => b.votingScore - a.votingScore)
      .map((team, index) => ({ ...team, rank: index + 1 }));
    
    return NextResponse.json({
      success: true,
      results,
      session: votingSession
    });
  }
  
  return NextResponse.json({
    success: true,
    session: votingSession
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'vote') {
      const { fromTeamId, toTeamId, voteType } = voteSchema.parse(body);
      
      // Validate voting constraints
      if (votingSession.phase !== 'voting') {
        return NextResponse.json(
          { success: false, error: 'Voting is not currently active' },
          { status: 400 }
        );
      }
      
      if (fromTeamId === toTeamId) {
        return NextResponse.json(
          { success: false, error: 'Cannot vote for your own team' },
          { status: 400 }
        );
      }
      
      const votingTeam = votingSession.teams.find(t => t.teamId === fromTeamId);
      const receivingTeam = votingSession.teams.find(t => t.teamId === toTeamId);
      
      if (!votingTeam || !receivingTeam) {
        return NextResponse.json(
          { success: false, error: 'Team not found' },
          { status: 404 }
        );
      }
      
      if (!votingTeam.canVote) {
        return NextResponse.json(
          { success: false, error: 'Team cannot vote at this time' },
          { status: 400 }
        );
      }
      
      // Check downvote limit
      if (voteType === 'downvote' && votingTeam.downvotesUsed >= 3) {
        return NextResponse.json(
          { success: false, error: 'Maximum downvotes (3) already used. You must upvote.' },
          { status: 400 }
        );
      }
      
      // Check if team already voted for this team in this round
      const existingVote = votingTeam.votingHistory.find(vote => 
        vote.toTeamId === toTeamId && vote.sessionId === votingSession.id
      );
      
      if (existingVote) {
        return NextResponse.json(
          { success: false, error: 'Already voted for this team' },
          { status: 400 }
        );
      }
      
      // Record the vote
      const voteRecord = {
        id: `vote_${Date.now()}_${Math.random().toString(36).substring(2)}`,
        fromTeamId,
        toTeamId,
        voteType,
        timestamp: new Date(),
        sessionId: votingSession.id
      };
      
      // Update voting team's history and downvote count
      votingTeam.votingHistory.push(voteRecord);
      if (voteType === 'downvote') {
        votingTeam.downvotesUsed++;
      }
      
      // Update receiving team's vote count
      if (voteType === 'upvote') {
        receivingTeam.votesReceived.upvotes++;
        receivingTeam.votesReceived.totalScore++;
      } else {
        receivingTeam.votesReceived.downvotes++;
        receivingTeam.votesReceived.totalScore--;
      }
      
      return NextResponse.json({
        success: true,
        vote: voteRecord,
        updatedTeam: {
          teamId: receivingTeam.teamId,
          votesReceived: receivingTeam.votesReceived
        },
        votingTeam: {
          teamId: votingTeam.teamId,
          downvotesUsed: votingTeam.downvotesUsed,
          canOnlyUpvote: votingTeam.downvotesUsed >= 3
        }
      });
    }
    
    if (action === 'control') {
      // Admin controls for managing phases
      const { action: controlAction, teamId } = phaseControlSchema.parse(body);
      const now = new Date();
      
      switch (controlAction) {
        case 'start_pitch':
          if (!teamId) {
            return NextResponse.json(
              { success: false, error: 'Team ID required for starting pitch' },
              { status: 400 }
            );
          }
          
          // Set presenting team and start pitch phase
          votingSession.currentPresentingTeam = teamId;
          votingSession.phase = 'pitching';
          votingSession.phaseStartTime = now;
          votingSession.phaseEndTime = new Date(now.getTime() + 90000); // 90 seconds
          
          // Update team statuses
          votingSession.teams.forEach(team => {
            team.isCurrentlyPresenting = team.teamId === teamId;
            team.canVote = team.teamId !== teamId; // Presenting team cannot vote
          });
          
          break;
          
        case 'start_voting':
          if (votingSession.phase !== 'pitching') {
            return NextResponse.json(
              { success: false, error: 'Must be in pitching phase to start voting' },
              { status: 400 }
            );
          }
          
          votingSession.phase = 'voting';
          votingSession.phaseStartTime = now;
          votingSession.phaseEndTime = new Date(now.getTime() + 30000); // 30 seconds
          
          break;
          
        case 'next_team':
          // Mark current team as presented and move to next
          const currentTeam = votingSession.teams.find(t => t.teamId === votingSession.currentPresentingTeam);
          if (currentTeam) {
            currentTeam.hasPresented = true;
            currentTeam.isCurrentlyPresenting = false;
          }
          
          votingSession.phase = 'break';
          votingSession.currentPresentingTeam = '';
          
          // Reset vote permissions
          votingSession.teams.forEach(team => {
            team.canVote = true;
          });
          
          break;
          
        case 'end_session':
          votingSession.phase = 'completed';
          votingSession.currentPresentingTeam = '';
          
          break;
      }
      
      return NextResponse.json({
        success: true,
        session: votingSession,
        message: `${controlAction} executed successfully`
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Voting error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process voting request' },
      { status: 500 }
    );
  }
}
