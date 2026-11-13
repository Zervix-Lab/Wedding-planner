import { requireUserPage } from "@/lib/auth";
import { parseGuestParams } from "@/lib/guest-query";
import { getGuestsPage } from "@/lib/guests-data";
import { GuestsManager } from "./GuestsManager";

export default async function GuestsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [user, sp] = await Promise.all([requireUserPage(), searchParams]);
  const p = parseGuestParams(sp);
  const data = await getGuestsPage(p.q, p.side, p.group, p.rsvp, p.page);

  return (
    <GuestsManager
      guests={data.guests}
      summary={data.summary}
      page={data.page}
      pages={data.pages}
      hasAny={data.hasAny}
      defaultSide={user.side}
      me={{ id: user.id, role: user.role }}
      query={{ q: p.q, side: p.side, group: p.group, rsvp: p.rsvp }}
    />
  );
}
