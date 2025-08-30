import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const complaintData = await request.json();

    // Here you can add logic to save complaintData to a database or process it as needed.
    // For now, just log it and return success response.

    console.log('Received complaint sync:', complaintData);

    return NextResponse.json({ message: 'Complaint synced successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error processing complaint sync:', error);
    return NextResponse.json({ error: 'Failed to process complaint sync' }, { status: 500 });
  }
}
