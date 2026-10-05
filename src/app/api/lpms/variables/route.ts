import { NextResponse } from 'next/server';
import { getCurrentLpmsUser } from '@/lib/lpms-auth';
import { getViewer } from '@/lib/lpms/viewer';
import { buildVariableRegistry } from '@/lib/lpms/variables';

export async function GET() {
  const user = await getCurrentLpmsUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const variables = await buildVariableRegistry(viewer);
    return NextResponse.json({ variables });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to build variable registry' }, { status: 500 });
  }
}
