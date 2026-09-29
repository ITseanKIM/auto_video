"use client";

import { FormEvent, useEffect, useState } from "react";
import { demoProjects, pipelineStages } from "@/lib/pipeline";

type Project = { id: string; title: string; status: string; progress: number; updatedAt: string };
const storageKey = "twodays-audio-projects-v1";

export function StudioDashboard() {
  const [projects, setProjects] = useState<Project[]>([...demoProjects]);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("480");
  const [language, setLanguage] = useState("ko");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (saved) setProjects(JSON.parse(saved) as Project[]);
  }, []);

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 10) {
      setNotice("이야기를 10자 이상 입력해 주세요.");
      return;
    }
    const project: Project = {
      id: crypto.randomUUID(),
      title: cleanPrompt.length > 34 ? `${cleanPrompt.slice(0, 34)}…` : cleanPrompt,
      status: "구성 대기",
      progress: 4,
      updatedAt: "방금 전",
    };
    const next = [project, ...projects];
    setProjects(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
    setPrompt("");
    setNotice(`새 프로젝트를 만들었습니다 · ${language.toUpperCase()} · ${Math.round(Number(duration) / 60)}분`);
  }

  return (
    <main className="min-h-screen bg-[#f5f3ee] text-[#171713]">
      <header className="border-b border-black/10 bg-[#f5f3ee]/95 px-5 py-4 backdrop-blur md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div><p className="text-xs font-bold tracking-[0.22em] text-[#5c5b52]">TWODAYS</p><h1 className="text-xl font-black tracking-tight">오디오 스튜디오</h1></div>
          <span className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-semibold">웹 전환판 · 개발 중</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-[1.15fr_.85fr] md:px-10 md:py-10">
        <section className="rounded-[28px] bg-[#151712] p-6 text-white shadow-[0_24px_70px_rgba(24,25,20,.18)] md:p-9">
          <p className="mb-3 text-sm font-bold text-[#c9ff5c]">한 줄에서 완성 영상까지</p>
          <h2 className="max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] md:text-5xl">이야기를 쓰면 제작 흐름이 시작됩니다.</h2>
          <p className="mt-4 max-w-xl text-sm leading-6 text-white/65 md:text-base">장면별 대본과 목소리, 관련 이미지, 자막을 확인하고 필요한 부분만 다시 만들 수 있습니다.</p>

          <form onSubmit={createProject} className="mt-8 space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-bold">이야기 소재</span>
              <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={5} placeholder="예: 30년 전 헤어진 친구가 어느 날 낡은 편지 한 장과 함께 찾아왔습니다." className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 p-4 text-base leading-7 outline-none transition placeholder:text-white/35 focus:border-[#c9ff5c] focus:bg-white/15" />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-bold">언어<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#292b25] px-3 py-3"><option value="ko">한국어</option><option value="en">English</option><option value="ja">日本語</option><option value="es">Español</option></select></label>
              <label className="text-sm font-bold">목표 길이<select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#292b25] px-3 py-3"><option value="180">3분</option><option value="480">8분</option><option value="900">15분</option><option value="1800">30분</option></select></label>
            </div>
            <button className="w-full rounded-2xl bg-[#c9ff5c] px-5 py-4 text-base font-black text-[#161810] transition hover:bg-[#d7ff84] active:scale-[.99]">새 프로젝트 만들기</button>
            {notice && <p role="status" className="text-center text-sm text-[#c9ff5c]">{notice}</p>}
          </form>
        </section>

        <section className="rounded-[28px] border border-black/10 bg-white p-6 md:p-8">
          <div className="flex items-end justify-between"><div><p className="text-xs font-bold tracking-[.16em] text-[#737268]">PIPELINE</p><h2 className="mt-1 text-2xl font-black">제작 단계</h2></div><span className="text-xs text-[#737268]">부분 재생성 지원</span></div>
          <ol className="mt-7 space-y-3">
            {pipelineStages.map((stage, index) => <li key={stage.id} className="flex gap-4 rounded-2xl bg-[#f5f3ee] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171713] text-sm font-black text-white">{index + 1}</span><div><h3 className="font-black">{stage.label}</h3><p className="mt-1 text-sm leading-5 text-[#6a6961]">{stage.description}</p></div></li>)}
          </ol>
        </section>
      </div>

      <section className="mx-auto max-w-6xl px-4 pb-12 md:px-10">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black">내 프로젝트</h2><span className="text-sm text-[#737268]">{projects.length}개</span></div>
        <div className="grid gap-3 md:grid-cols-2">
          {projects.map((project) => <article key={project.id} className="rounded-2xl border border-black/10 bg-white p-5"><div className="flex items-start justify-between gap-4"><h3 className="font-black leading-6">{project.title}</h3><span className="shrink-0 text-xs text-[#737268]">{project.updatedAt}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9e7e0]"><div className="h-full rounded-full bg-[#171713]" style={{ width: `${project.progress}%` }} /></div><div className="mt-3 flex justify-between text-xs font-semibold"><span>{project.status}</span><span>{project.progress}%</span></div></article>)}
        </div>
      </section>
    </main>
  );
}
