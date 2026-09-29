export const pipelineStages = [
  { id: "outline", label: "구성", description: "이야기 흐름과 장면을 설계합니다." },
  { id: "script", label: "대본", description: "나레이션과 인물 대사를 만듭니다." },
  { id: "voice", label: "음성", description: "인물별 목소리와 타이밍을 생성합니다." },
  { id: "image", label: "이미지", description: "장면과 인물에 맞는 이미지를 만듭니다." },
  { id: "compose", label: "영상", description: "자막과 음향을 합쳐 영상을 렌더합니다." },
] as const;

export type PipelineStage = (typeof pipelineStages)[number]["id"];

export type CreateProjectInput = {
  prompt: string;
  language: "ko" | "en" | "ja" | "es";
  targetDurationSec: number;
  visualStyle: string;
};

export const demoProjects = [
  {
    id: "demo-1",
    title: "환갑 이후 시작된 두 번째 인생",
    status: "대본 확인 필요",
    progress: 38,
    updatedAt: "방금 전",
  },
  {
    id: "demo-2",
    title: "30년 만에 도착한 편지",
    status: "완성",
    progress: 100,
    updatedAt: "어제",
  },
] as const;
