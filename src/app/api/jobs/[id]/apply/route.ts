import { NextRequest, NextResponse } from 'next/server';
import { updateStudentApplication, getJobById } from '@/lib/db';
import { updateApplicationStatusSchema, createProblemResponse } from '@/lib/validation';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const job = await getJobById(params.id);
    if (!job) {
      return createProblemResponse(404, 'Job Not Found', `No job found with ID: ${params.id}`);
    }

    const body = await req.json();
    const result = updateApplicationStatusSchema.safeParse(body);

    if (!result.success) {
      const issue = result.error.issues[0];
      return createProblemResponse(
        400,
        'Invalid Application Update',
        issue ? `${issue.path.join('.')}: ${issue.message}` : 'Validation failed'
      );
    }

    const updatedJob = await updateStudentApplication(params.id, {
      studentId: result.data.studentId,
      studentName: result.data.studentName,
      studentAvatar: result.data.studentAvatar,
      status: result.data.status,
      notes: result.data.notes,
      interviewDate: result.data.interviewDate,
      updatedAt: new Date().toISOString(),
      appliedAt: result.data.status === 'APPLIED' ? new Date().toISOString() : undefined,
    });

    if (!updatedJob) {
      return createProblemResponse(500, 'Update Failed', 'Failed to update student application status');
    }

    return NextResponse.json({ success: true, data: updatedJob });
  } catch (error) {
    console.error('Error updating application status:', error);
    return createProblemResponse(500, 'Server Error', 'Could not record application status');
  }
}
