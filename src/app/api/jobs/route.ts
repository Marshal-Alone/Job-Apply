import { NextRequest, NextResponse } from 'next/server';
import { getJobs, createJob } from '@/lib/db';
import { createJobSchema, createProblemResponse, sanitizeUrl } from '@/lib/validation';

export async function GET() {
  try {
    const jobs = await getJobs();
    return NextResponse.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return createProblemResponse(500, 'Database Query Failed', 'Could not retrieve job listings');
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = createJobSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return createProblemResponse(
        400,
        'Invalid Job Data',
        issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation error'
      );
    }

    const primaryImageUrl =
      result.data.imageUrl || (result.data.imageUrls && result.data.imageUrls.length > 0 ? result.data.imageUrls[0] : undefined);

    const allImageUrls =
      result.data.imageUrls && result.data.imageUrls.length > 0
        ? result.data.imageUrls
        : primaryImageUrl
        ? [primaryImageUrl]
        : [];

    const sanitizedData = {
      ...result.data,
      applyUrl: sanitizeUrl(result.data.applyUrl),
      salary: result.data.salary || undefined,
      deadline: result.data.deadline || undefined,
      friendNote: result.data.friendNote || undefined,
      imageUrl: primaryImageUrl,
      imageUrls: allImageUrls,
    };

    const newJob = await createJob(sanitizedData);
    return NextResponse.json({ success: true, data: newJob }, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return createProblemResponse(500, 'Creation Failed', 'Failed to store job in database');
  }
}
