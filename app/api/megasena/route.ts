import { NextResponse } from "next/server";

function withTimeout(ms: number) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(timer) };
}

type Normalized = {
  concurso: number | null;
  dataApuracao: string | null;
  dezenas: string[];
  fonte: string;
};

function pad2(n: string | number) {
  const x = String(n).trim();
  const num = Number(x);
  if (!Number.isFinite(num)) return x;
  return String(num).padStart(2, "0");
}

// 1) GUIDI: api.guidi.dev.br/loteria/megasena/ultimo
function normalizeGuidi(data: any) {
  const dezenas =
    (data?.dezenas ??
      data?.numeros ??
      data?.listaDezenas ??
      []).map((n: string | number) =>
        String(n).padStart(2, "0")
      );

  return {
    concurso: data?.concurso ?? data?.numero ?? null,
    dataApuracao: data?.data ?? data?.dataApuracao ?? null,
    dezenas,
    fonte: "guidi"
  };
}


// 2) Heroku loteriascaixa-api: /api/megasena/latest
function normalizeHeroku(data: any): Normalized {
  const dezenas = (data?.dezenas ?? data?.dezenasOrdemSorteio ?? []).map(pad2);
  return {
    concurso: data?.concurso ?? null,
    dataApuracao: data?.data ?? null,
    dezenas,
    fonte: "loteriascaixa-api",
  };
}

async function tryFetch(url: string, normalize: (d: any) => Normalized) {
  const t = withTimeout(6000);
  try {
    const res = await fetch(url, {
      signal: t.signal,
      headers: { accept: "application/json" },
      // cache leve
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();

    const norm = normalize(json);
    if (!norm.dezenas || norm.dezenas.length !== 6) return null;

    return norm;
  } catch {
    return null;
  } finally {
    t.clear();
  }
}

export async function GET() {
  // ordem: GUIDI -> Heroku
  const a = await tryFetch(
    "https://api.guidi.dev.br/loteria/megasena/ultimo",
    normalizeGuidi
  );
  if (a) return NextResponse.json(a);

  const b = await tryFetch(
    "https://loteriascaixa-api.herokuapp.com/api/megasena/latest",
    normalizeHeroku
  );
  if (b) return NextResponse.json(b);

  return NextResponse.json(
    {
      error:
        "Falha ao consultar provedores (guidi / loteriascaixa-api). Tente novamente em alguns instantes.",
    },
    { status: 502 }
  );
}
