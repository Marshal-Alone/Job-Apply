import { NextRequest, NextResponse } from 'next/server';
import { parseJobWithAI } from '@/lib/ai';
import { parseJobWithAISchema, createProblemResponse } from '@/lib/validation';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = parseJobWithAISchema.safeParse(body);

    if (!result.success) {
      return createProblemResponse(400, 'Invalid Request', 'Provide either text or image to extract job details');
    }

    const { rawText, imageUrl } = result.data;

    if (!rawText && !imageUrl) {
      return createProblemResponse(400, 'Missing Input', 'Please provide job description text or upload a flyer image');
    }

    const parsedData = await parseJobWithAI(rawText, imageUrl);
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    console.error('Error in AI parse endpoint:', error);
    return createProblemResponse(500, 'AI Extraction Error', 'Failed to parse job information with AI');
  }
}
