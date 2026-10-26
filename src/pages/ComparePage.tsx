import { useState } from 'react';
import { GitCompare } from 'lucide-react';
import { PageHeader } from '@/components/UI';
import { RowsSkeleton, ErrorBox } from '@/components/Status';
import { useFd } from '@/lib/useFd';
import { COMPETITIONS, type FdTeam } from '@/lib/footballApi';

interface ScorersResponse {
  scorers: {
    player: {
      id: number;
      name: string;
      dateOfBirth?: string | null;
      nationality?: string | null;
      position?: string | null;
    };
    team: FdTeam;
    playedMatches: number | null;
    goals: number | null;
    assists?: number | null;
  }[];
}
type Entry = ScorersResponse['scorers'][number];

function ageOf(dob?: string | null): number | null {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const n = new Date();
  let a = n.getFullYear() - d.getFullYear();
  const m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

const selectCls =
  'w-full rounded-lg border border-[#1f262e] bg-[#14181d] px-3 py-2.5 text-sm text-white outline-none focus:border-[#16c98d]/50';

function Row({
  label,
  a,
  b,
  decimals = 0,
  plain,
}: {
  label: string;
  a: number | null;
  b: number | null;
  decimals?: number;
  plain?: boolean;
}) {
  const better = (x: number | null, y: number | null) => !plain && x !== null && y !== null && x > y;
  const show = (n: number | null) => (n === null ? '-' : n.toFixed(decimals));
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 py-3">
      <span className={`text-right font-display text-xl font-bold ${better(a, b) ? 'text-[#16c98d]' : 'text-white'}`}>
        {show(a)}
      </span>
      <span className="w-24 text-center text-xs text-gray-400">{label}</span>
      <span className={`font-display text-xl font-bold ${better(b, a) ? 'text-[#16c98d]' : 'text-white'}`}>
        {show(b)}
      </span>
    </div>
  );
}

function Head({ p }: { p?: Entry }) {
  if (!p) return <div className="text-center text-sm text-gray-500">No player</div>;
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <img src={p.team.crest} alt="" className="h-14 w-14 object-contain" />
      <div className="font-display text-base font-bold text-white sm:text-lg">{p.player.name}</div>
      <div className="text-xs text-gray-500">{p.team.shortName}</div>
    </div>
  );
}

export function ComparePage() {
  const [codeA, setCodeA] = useState('PL');
  const [codeB, setCodeB] = useState('PD');
  const [idA, setIdA] = useState('');
  const [idB, setIdB] = useState('');

  const A = useFd<ScorersResponse>(`/competitions/${codeA}/scorers?limit=30`, 600_000);
  const B = useFd<ScorersResponse>(`/competitions/${codeB}/scorers?limit=30`, 600_000);
  const listA = A.data?.scorers ?? [];
  const listB = B.data?.scorers ?? [];

  const pa = listA.find((s) => String(s.player.id) === idA) ?? listA[0];
  const pb = listB.find((s) => String(s.player.id) === idB) ?? listB[codeA === codeB ? 1 : 0];

  const gpg = (p?: Entry) =>
    p && p.playedMatches ? (p.goals ?? 0) / p.playedMatches : null;

  const picker = (
    code: string,
    setCode: (c: string) => void,
    id: string,
    setId: (i: string) => void,
    list: Entry[],
    selected?: Entry,
  ) => (
    <div className="space-y-2">
      <select
        value={code}
        onChange={(e) => {
          setCode(e.target.value);
          setId('');
        }}
        className={selectCls}
      >
        {COMPETITIONS.map((c) => (
          <option key={c.code} value={c.code}>{c.name}</option>
        ))}
      </select>
      <select
        value={selected ? String(selected.player.id) : ''}
        onChange={(e) => setId(e.target.value)}
        className={selectCls}
      >
        {list.map((s) => (
          <option key={s.player.id} value={String(s.player.id)}>
            {s.player.name} ({s.team.shortName})
          </option>
        ))}
      </select>
    </div>
  );

  const loading = (A.loading && !A.data) || (B.loading && !B.data);
  const error = A.error || B.error;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compare Players"
        subtitle="Pick two scorers, from any league, and compare them"
        icon={<GitCompare size={22} />}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {picker(codeA, setCodeA, idA, setIdA, listA, pa)}
        {picker(codeB, setCodeB, idB, setIdB, listB, pb)}
      </div>

      {loading && !error && <RowsSkeleton rows={5} />}
      {error && !(pa && pb) && (
        <ErrorBox
          message={error}
          onRetry={() => {
            A.reload();
            B.reload();
          }}
        />
      )}

      {pa && pb && (
        <div className="rounded-xl border border-[#1f262e] bg-[#14181d] p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-4 border-b border-[#1f262e] pb-5">
            <Head p={pa} />
            <Head p={pb} />
          </div>
          <div className="divide-y divide-[#1f262e]">
            <Row label="Goals" a={pa.goals ?? 0} b={pb.goals ?? 0} />
            <Row label="Games" a={pa.playedMatches} b={pb.playedMatches} plain />
            <Row label="Assists" a={pa.assists ?? null} b={pb.assists ?? null} />
            <Row label="Goals per game" a={gpg(pa)} b={gpg(pb)} decimals={2} />
            <Row label="Age" a={ageOf(pa.player.dateOfBirth)} b={ageOf(pb.player.dateOfBirth)} plain />
          </div>
          <p className="mt-3 text-center text-[11px] text-gray-500">
            Green marks the higher number. Games and age are only shown for reference.
          </p>
        </div>
      )}
    </div>
  );
}