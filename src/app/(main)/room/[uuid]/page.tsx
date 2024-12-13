import { notFound } from 'next/navigation';

import { db } from '@/server/db';

import { RoomClient } from './room-client';

interface PageProps {
  readonly params: {
    uuid: string;
  };
}

export default async function RoomPage({ params }: PageProps) {
  const room = await db.room.findUnique({
    where: { id: params.uuid },
  });

  if (!room) {
    notFound();
  }

  return <RoomClient room={room} />;
}
