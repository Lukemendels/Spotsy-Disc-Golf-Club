import React from 'react';
import { MemberLeagueDemo } from '../components/MemberLeagueDemo';
export const LeagueCheckInPage = () => <div className="min-h-screen bg-slate-100 p-4"><div className="mx-auto max-w-2xl space-y-4"><a href={import.meta.env.BASE_URL} className="text-green-800 underline">Back to club demo</a><MemberLeagueDemo /></div></div>;
