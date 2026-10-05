import { NextRequest, NextResponse } from 'next/server';
import { getCurrentLpmsUser } from '@/lib/lpms-auth';
import { getViewer } from '@/lib/lpms/viewer';
import { discoverEntities, fetchEntityRecords } from '@/lib/lpms/entity-discovery';

export async function GET(req: NextRequest) {
  const user = await getCurrentLpmsUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityKey = searchParams.get('entity');
  const search = searchParams.get('search') ?? '';

  try {
    if (entityKey) {
      const records = await fetchEntityRecords(entityKey, { search, limit: 20 }, viewer);
      return NextResponse.json({ records });
    }
    const entities = await discoverEntities(viewer);
    return NextResponse.json({ entities });
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
