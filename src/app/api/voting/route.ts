import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Return a simplified response indicating voting is disabled
    // This prevents errors while the voting tables are being set up
    if (action === 'status') {
      return NextResponse.json({
        success: true,
        session: {
          id: 'temp-session',
          phase: 'disabled',
          teams: [],
          timeRemaining: 0,
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
      return NextResponse.json({
        success: true,
        results: [],
        session: null
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: 'temp-session',
        phase: 'disabled',
        teams: [],
        timeRemaining: 0
      }
    });

  } catch (error) {
    console.error('Error in GET voting:', error);
    return NextResponse.json(
      { success: false, error: 'Voting system temporarily disabled' },
      { status: 200 } // Return 200 to prevent frontend errors
    );
  }
}

export async function POST() {
  try {
    return NextResponse.json({
      success: false,
      error: 'Voting system temporarily disabled'
    }, { status: 200 }); // Return 200 to prevent frontend errors

  } catch (error) {
    console.error('Voting error:', error);
    return NextResponse.json(
      { success: false, error: 'Voting system temporarily disabled' },
      { status: 200 }
    );
  }
}
