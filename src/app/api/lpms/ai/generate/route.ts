import { NextRequest, NextResponse } from 'next/server';
import { getCurrentLpmsUser } from '@/lib/lpms-auth';
import { lpmsCan } from '@/lib/lpms-roles';

export async function POST(req: NextRequest) {
  const user = await getCurrentLpmsUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ctx = { roles: user.roles, permissionOverrides: user.permissionOverrides };
  if (!lpmsCan(ctx, 'GENERATE')) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { prompt, makerTypeId, templateId, fieldValues } = body;

  // Dynamic import so the route remains valid even before ai.ts is implemented
  try {
    const { generateLpmsDocument } = await import('@/lib/lpms/ai');
    const result = await generateLpmsDocument({
      prompt,
      makerTypeId,
      templateId,
      fieldValues,
      userId: user.id,
      companyId: user.lpmsRoles.length > 0 ? 'ctx' : '',
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'AI generation not yet configured' }, { status: 501 });
  }
}
