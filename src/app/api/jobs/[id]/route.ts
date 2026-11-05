import { NextRequest, NextResponse } from 'next/server';
import { getJobById, deleteJob, updateJob } from '@/lib/db';
import { createProblemResponse, updateJobSchema, sanitizeUrl } from '@/lib/validation';

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
    if (!job) {
      return createProblemResponse(404, 'Job Not Found', `No job found with ID: ${params.id}`);
    }
    return NextResponse.json({ success: true, data: job });
  } catch (error) {
    console.error('Error fetching job by ID:', error);
    return createProblemResponse(500, 'Server Error', 'Failed to retrieve job details');
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const result = updateJobSchema.safeParse(body);
    if (!result.success) {
      return createProblemResponse(
        400,
        'Invalid Update',
        result.error.errors[0]?.message || 'Invalid data payload'
      );
    }

    const updates = {
      ...result.data,
      applyUrl: result.data.applyUrl ? sanitizeUrl(result.data.applyUrl) : undefined,
    };

    const updatedJob = await updateJob(params.id, updates);
    if (!updatedJob) {
      return createProblemResponse(404, 'Job Not Found', `Cannot update non-existent job: ${params.id}`);
    }

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error) {
    console.error('Error updating job:', error);
    return createProblemResponse(500, 'Server Error', 'Failed to update job');
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = await deleteJob(params.id);
    if (!success) {
      return createProblemResponse(404, 'Job Not Found', `Cannot delete non-existent job: ${params.id}`);
    }
    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (error) {
    console.error('Error deleting job:', error);
    return createProblemResponse(500, 'Server Error', 'Failed to delete job');
  }
}
