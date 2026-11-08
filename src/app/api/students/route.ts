import { NextRequest, NextResponse } from 'next/server';
import { getStudents, createStudent, registerOrGetDevice } from '@/lib/db';
import { createProblemResponse, deviceInitSchema } from '@/lib/validation';
import { z } from 'zod';

const studentSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  avatar: z.string().optional(),
  college: z.string().optional(),
  branch: z.string().optional(),
  batch: z.string().optional(),
  skills: z.array(z.string()).default([]),
});

export async function GET(req: NextRequest) {
  try {
    const students = await getStudents();
    const { searchParams } = new URL(req.url);
    const queryDeviceId = searchParams.get('deviceId');
    const headerDeviceId = req.headers.get('x-device-id');
    const rawDeviceId = (queryDeviceId || headerDeviceId || '').trim();

    if (rawDeviceId) {
      const parsed = deviceInitSchema.safeParse({ deviceId: rawDeviceId });
      if (parsed.success) {
        const deviceRecord = await registerOrGetDevice(parsed.data.deviceId);
        return NextResponse.json({
          success: true,
          data: students,
          defaultStudentId: deviceRecord.defaultStudentId,
          isFirstDevice: deviceRecord.isFirstDevice,
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: students,
      defaultStudentId: 'marshal',
      isFirstDevice: false,
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return createProblemResponse(500, 'Database Error', 'Could not retrieve students');
  }
}


export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = studentSchema.safeParse(body);

    if (!result.success) {
      return createProblemResponse(400, 'Validation Error', 'Invalid student profile data');
    }

    const avatar =
      result.data.avatar ||
      `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(result.data.name)}`;

    const newStudent = await createStudent({
      ...result.data,
      avatar,
    });

    return NextResponse.json({ success: true, data: newStudent }, { status: 201 });
  } catch (error) {
    console.error('Error creating student:', error);
    return createProblemResponse(500, 'Creation Error', 'Could not register student');
  }
}
