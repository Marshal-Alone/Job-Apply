import { NextRequest, NextResponse } from 'next/server';
import { registerOrGetDevice } from '@/lib/db';
import { deviceInitSchema, createProblemResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = deviceInitSchema.safeParse(body);

    if (!result.success) {
      return createProblemResponse(
        400,
        'Validation Error',
        result.error.errors[0]?.message || 'Invalid deviceId'
      );
    }

    const deviceRecord = await registerOrGetDevice(result.data.deviceId);
    return NextResponse.json({ success: true, data: deviceRecord });
  } catch (error) {
    console.error('Error initializing device:', error);
    return createProblemResponse(500, 'Server Error', 'Failed to register or retrieve device');
  }
}
