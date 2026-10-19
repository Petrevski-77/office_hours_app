const API = process.env.API_URL ?? 'http://localhost:3001/api';
const HOST_KEY = process.env.HOST_KEY ?? 'coach';

let failures = 0;
function check(name: string, ok: boolean, extra = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? '  ' + extra : ''}`);
  if (!ok) failures++;
}

async function call(method: string, path: string, body?: unknown, host = false) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(host ? { 'x-host-key': HOST_KEY } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

async function main() {
  
  const start = new Date(Date.now() + (400 + Math.floor(Math.random() * 3000)) * 86_400_000);
  start.setUTCHours(9, 0, 0, 0);

  const noKey = await call('GET', '/host/overview');
  check('host endpoints reject a missing passcode', noKey.status === 401);

  const created = await call('POST', '/host/slots', {
    startsAt: start.toISOString(),
    durationMinutes: 30,
    count: 2,
  }, true);
  check('host creates 2 back-to-back slots', created.status === 201 && created.json.length === 2);
  const [slotA, slotB] = created.json;

  const overlap = await call('POST', '/host/slots', {
    startsAt: new Date(start.getTime() + 10 * 60_000).toISOString(),
    durationMinutes: 30,
  }, true);
  check('overlapping slot is rejected (409)', overlap.status === 409);

  const past = await call('POST', '/host/slots', {
    startsAt: '2020-01-01T09:00:00.000Z',
    durationMinutes: 30,
  }, true);
  check('slot in the past is rejected (400)', past.status === 400);

  const list = await call('GET', '/slots');
  check('public list contains the new slot, unbooked',
    list.json.some((s: any) => s.id === slotA.id && s.booked === false));

  const bad = await call('POST', `/slots/${slotA.id}/book`, { name: 'A', email: 'nope' });
  check('invalid booking is rejected (400)', bad.status === 400);

  
  const attempts = await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      call('POST', `/slots/${slotA.id}/book`, {
        name: `Person ${i}`,
        email: `person${i}@example.com`,
        team: 'Test team',
        topic: 'Automating weekly reports with AI',
        timeZone: 'Europe/Skopje',
      }),
    ),
  );
  const wins = attempts.filter((a) => a.status === 201);
  const conflicts = attempts.filter((a) => a.status === 409);
  check('10 simultaneous bookings: exactly 1 succeeds', wins.length === 1, `(got ${wins.length})`);
  check('...and the other 9 get 409', conflicts.length === 9, `(got ${conflicts.length})`);
  check('winner received a confirmation message',
    typeof wins[0]?.json?.confirmationMessage === 'string' && wins[0].json.prepQuestions?.length > 0);
  console.log(`      aiGenerated=${wins[0]?.json?.aiGenerated}`);

  const after = await call('GET', '/slots');
  check('booked slot is flagged as booked', after.json.find((s: any) => s.id === slotA.id)?.booked === true);
  check('public list leaks no attendee data', !JSON.stringify(after.json).includes('example.com'));

  const delBooked = await call('DELETE', `/host/slots/${slotA.id}`, undefined, true);
  check('booked slot cannot be deleted (409)', delBooked.status === 409);

  const delFree = await call('DELETE', `/host/slots/${slotB.id}`, undefined, true);
  check('free slot can be deleted', delFree.status === 200);

  const overview = await call('GET', '/host/overview', undefined, true);
  const mine = overview.json.find((s: any) => s.id === slotA.id);
  check('host overview shows who booked', mine?.booking?.team === 'Test team');

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
