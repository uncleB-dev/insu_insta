const SERIES_LABEL: Record<string, string> = {
  A: '시리즈 A · 잘못된 보험 정리',
  B: '시리즈 B · 가족 보험 정리',
  C: '시리즈 C · 생애 이벤트',
};

const PERSONA_LABEL: Record<string, string> = {
  '30s_office': '30대 직장인',
  newbie: '사회 초년생',
  parent: '부모 세대',
  newlywed: '신혼 부부',
};

export function seriesLabel(series: string): string {
  return SERIES_LABEL[series] ?? series;
}

export function seriesShort(series: string): string {
  return seriesLabel(series).split(' · ')[0];
}

export function personaLabel(persona: string): string {
  return PERSONA_LABEL[persona] ?? persona;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const ms = Date.now() - date.getTime();
  if (ms < 0) return '방금';

  const sec = Math.floor(ms / 1000);
  if (sec < 60) return '방금';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;

  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}주 전`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month}달 전`;

  const yr = Math.floor(day / 365);
  return `${yr}년 전`;
}
