"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { demoProjects, pipelineStages, providers, type PipelineStage, type ProviderId } from "@/lib/pipeline";

type Project = {
  id: string; title: string; status: string; progress: number; updatedAt: string;
  provider: ProviderId; currentStage: PipelineStage; prompt?: string; result?: string;
};
const storageKey = "twodays-audio-projects-v2";

function nextStage(stage: PipelineStage) {
  const index = pipelineStages.findIndex((item) => item.id === stage);
  return pipelineStages[Math.min(index + 1, pipelineStages.length - 1)].id;
}

export function StudioDashboard() {
  const [projects, setProjects] = useState<Project[]>([...demoProjects]);
  const [selectedId, setSelectedId] = useState<string>(demoProjects[0].id);
  const [prompt, setPrompt] = useState("");
  const [duration, setDuration] = useState("480");
  const [language, setLanguage] = useState("ko");
  const [provider, setProvider] = useState<ProviderId>("demo");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as Project[];
        if (parsed.length) { setProjects(parsed); setSelectedId(parsed[0].id); }
      }
    } catch { window.localStorage.removeItem(storageKey); }
  }, []);

  const selected = useMemo(() => projects.find((project) => project.id === selectedId) ?? projects[0], [projects, selectedId]);

  function persist(next: Project[]) {
    setProjects(next);
    window.localStorage.setItem(storageKey, JSON.stringify(next));
  }

  function createProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    if (cleanPrompt.length < 10) { setNotice("이야기를 10자 이상 입력해 주세요."); return; }
    const project: Project = {
      id: crypto.randomUUID(),
      title: cleanPrompt.length > 34 ? cleanPrompt.slice(0, 34) + "…" : cleanPrompt,
      status: "구성 대기", progress: 0, updatedAt: "방금 전", provider, currentStage: "outline", prompt: cleanPrompt,
    };
    persist([project, ...projects]); setSelectedId(project.id); setPrompt("");
    setNotice("프로젝트를 만들었습니다 · " + providers.find((item) => item.id === provider)?.label);
  }

  async function runStage() {
    if (!selected || busy || selected.progress >= 100) return;
    setBusy(true); setNotice("서버리스 작업을 준비하는 중…");
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    const stageIndex = pipelineStages.findIndex((item) => item.id === selected.currentStage);
    const progress = Math.min(100, Math.round(((stageIndex + 1) / pipelineStages.length) * 100));
    const finished = progress >= 100;
    const updated: Project = {
      ...selected, progress, currentStage: finished ? "compose" : nextStage(selected.currentStage),
      status: finished ? "완성 · 다운로드 준비" : pipelineStages[stageIndex].label + " 완료 · 다음 단계 대기",
      updatedAt: "방금 전",
      result: selected.provider === "demo" ? "무료 미리보기 결과가 준비되었습니다. API 키를 연결하면 실제 대본·음성·이미지 작업으로 교체됩니다." : "제공자 작업 요청이 완료되었습니다. 다음 단계 산출물을 확인하세요.",
    };
    persist(projects.map((project) => (project.id === selected.id ? updated : project)));
    setNotice(finished ? "전체 흐름이 완료되었습니다." : pipelineStages[stageIndex].label + " 단계를 완료했습니다.");
    setBusy(false);
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f5f3ee] text-[#171713]">
      <header className="border-b border-black/10 bg-[#f5f3ee]/95 px-4 py-4 backdrop-blur sm:px-6 md:px-10"><div className="mx-auto flex max-w-6xl items-center justify-between gap-3"><div className="min-w-0"><p className="text-xs font-bold tracking-[0.22em] text-[#5c5b52]">TWODAYS</p><h1 className="text-lg font-black tracking-tight sm:text-xl">오디오 스튜디오</h1></div><span className="shrink-0 rounded-full border border-black/10 bg-white px-2.5 py-1.5 text-[11px] font-semibold sm:px-3 sm:text-xs">웹 전환판</span></div></header>

      <div className="mx-auto grid max-w-6xl gap-5 px-4 py-5 sm:px-6 md:grid-cols-[1.1fr_.9fr] md:gap-6 md:px-10 md:py-10">
        <section className="min-w-0 rounded-[24px] bg-[#151712] p-5 text-white shadow-[0_24px_70px_rgba(24,25,20,.18)] sm:p-6 md:rounded-[28px] md:p-9">
          <p className="mb-3 text-sm font-bold text-[#c9ff5c]">한 줄에서 완성 영상까지</p><h2 className="max-w-xl text-3xl font-black leading-tight tracking-[-0.04em] sm:text-4xl md:text-5xl">이야기를 쓰면 제작 흐름이 시작됩니다.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-white/65 md:text-base">무료 미리보기로 먼저 테스트하고, 필요할 때 본인 API 키를 선택해 품질과 비용을 직접 관리하세요.</p>
          <form onSubmit={createProject} className="mt-7 space-y-4"><label className="block"><span className="mb-2 block text-sm font-bold">이야기 소재</span><textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} placeholder="예: 30년 전 헤어진 친구가 어느 날 낡은 편지 한 장과 함께 찾아왔습니다." className="w-full resize-none rounded-2xl border border-white/15 bg-white/10 p-4 text-base leading-7 outline-none transition placeholder:text-white/35 focus:border-[#c9ff5c] focus:bg-white/15" /></label>
            <div className="grid grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-3"><label className="text-sm font-bold">언어<select value={language} onChange={(event) => setLanguage(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#292b25] px-3 py-3"><option value="ko">한국어</option><option value="en">English</option><option value="ja">日本語</option><option value="es">Español</option></select></label><label className="text-sm font-bold">목표 길이<select value={duration} onChange={(event) => setDuration(event.target.value)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#292b25] px-3 py-3"><option value="180">3분</option><option value="480">8분</option><option value="900">15분</option><option value="1800">30분</option></select></label><label className="text-sm font-bold xs:col-span-2 sm:col-span-1">생성 제공자<select value={provider} onChange={(event) => setProvider(event.target.value as ProviderId)} className="mt-2 w-full rounded-xl border border-white/15 bg-[#292b25] px-3 py-3">{providers.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
            <p className="text-xs leading-5 text-white/50">{providers.find((item) => item.id === provider)?.description} · 키는 브라우저에 저장하지 않습니다.</p><button className="w-full rounded-2xl bg-[#c9ff5c] px-5 py-4 text-base font-black text-[#161810] transition hover:bg-[#d7ff84] active:scale-[.99]">새 프로젝트 만들기</button>{notice && <p role="status" className="text-center text-sm text-[#c9ff5c]">{notice}</p>}</form>
        </section>

        <section className="min-w-0 rounded-[24px] border border-black/10 bg-white p-5 sm:p-6 md:rounded-[28px] md:p-8"><div className="flex items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-[#737268]">PIPELINE</p><h2 className="mt-1 text-2xl font-black">제작 단계</h2></div><span className="text-right text-xs text-[#737268]">단계별 재실행</span></div><ol className="mt-6 space-y-3">{pipelineStages.map((stage, index) => <li key={stage.id} className={"flex gap-3 rounded-2xl p-3.5 " + (selected?.currentStage === stage.id ? "bg-[#eaffc2] ring-1 ring-[#b5e25b]" : "bg-[#f5f3ee]")}><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#171713] text-sm font-black text-white">{index + 1}</span><div className="min-w-0"><h3 className="font-black">{stage.label}</h3><p className="mt-1 text-sm leading-5 text-[#6a6961]">{stage.description}</p></div></li>)}</ol></section>
      </div>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 sm:px-6 md:grid-cols-[.9fr_1.1fr] md:px-10"><div className="min-w-0"><div className="mb-4 flex items-center justify-between"><h2 className="text-2xl font-black">내 프로젝트</h2><span className="text-sm text-[#737268]">{projects.length}개</span></div><div className="grid gap-3">{projects.map((project) => <button key={project.id} type="button" onClick={() => setSelectedId(project.id)} className={"w-full rounded-2xl border p-5 text-left transition " + (project.id === selected?.id ? "border-[#171713] bg-white shadow-sm" : "border-black/10 bg-white/70 hover:bg-white")}><div className="flex items-start justify-between gap-4"><h3 className="min-w-0 break-words font-black leading-6">{project.title}</h3><span className="shrink-0 text-xs text-[#737268]">{project.updatedAt}</span></div><div className="mt-5 h-2 overflow-hidden rounded-full bg-[#e9e7e0]"><div className="h-full rounded-full bg-[#171713] transition-all duration-500" style={{ width: project.progress + "%" }} /></div><div className="mt-3 flex justify-between text-xs font-semibold"><span>{project.status}</span><span>{project.progress}%</span></div></button>)}</div></div>
        {selected && <aside className="min-w-0 rounded-[24px] bg-[#171713] p-5 text-white sm:p-7"><p className="text-xs font-bold tracking-[.16em] text-[#c9ff5c]">SELECTED PROJECT</p><h2 className="mt-2 break-words text-2xl font-black">{selected.title}</h2><p className="mt-2 text-sm text-white/60">{providers.find((item) => item.id === selected.provider)?.label} · {selected.progress}% 완료</p><div className="mt-6 rounded-2xl bg-white/10 p-4"><p className="text-sm font-bold">현재 단계</p><p className="mt-1 text-xl font-black">{pipelineStages.find((item) => item.id === selected.currentStage)?.label}</p><p className="mt-2 text-sm leading-6 text-white/65">{pipelineStages.find((item) => item.id === selected.currentStage)?.description}</p></div><button type="button" onClick={runStage} disabled={busy || selected.progress >= 100} className="mt-4 w-full rounded-2xl bg-[#c9ff5c] px-5 py-4 font-black text-[#161810] disabled:cursor-not-allowed disabled:opacity-50">{busy ? "작업 준비 중…" : selected.progress >= 100 ? "완성됨" : "현재 단계 실행"}</button>{selected.result && <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-white/75">{selected.result}</div>}</aside>}
      </section>
    </main>
  );
}
