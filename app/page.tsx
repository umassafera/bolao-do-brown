"use client";

import { useMemo, useState } from "react";

type ApiResp = {
  concurso: number | null;
  dataApuracao: string | null;
  dezenas: string[];
  error?: string;
};

const DEFAULT_BOLAO = `02 05 10 17 21 28 33 36 43 53
02 19 32 40 42 53 55
05 10 27 48 52 56 57
05 21 25 28 30 34 43
04 07 19 35 46 53 60
14 25 40 41 42 50 51
05 06 12 13 14 58
07 16 36 39 45 54
01 08 27 41 51 55
01 31 33 34 50 60
05 10 13 39 47 54
02 11 12 21 28 39
03 16 29 37 38 52
02 04 13 24 33 59
15 22 35 37 55 56
06 33 37 43 58 60
01 03 04 11 13 35
07 11 42 47 57 59
27 29 41 49 57 58
05 12 20 26 29 45
15 21 39 48 56 58
06 32 35 47 50 58
02 05 28 29 36 44
08 20 23 36 37 50
01 07 39 50 54 58
09 12 13 19 26 36`;

function normNum(x: string) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 1 || n > 60) return null;
  return String(n).padStart(2, "0");
}

function parseBets(text: string): string[][] {
  return text
    .split("\n")
    .map((line) =>
      line
        .trim()
        .split(/[,\s;]+/g)
        .map((p) => normNum(p))
        .filter((v): v is string => Boolean(v))
    )
    .filter((arr) => arr.length >= 6)
    .map((arr) => Array.from(new Set(arr))); // remove duplicados na mesma linha
}

type BetResult = {
  idx: number;
  nums: string[];
  hits: number;
  hitNums: string[];
  category: "Sena" | "Quina" | "Quadra" | "Nada";
  isRich: boolean; // Sena
};

export default function Home() {
  const [text, setText] = useState(DEFAULT_BOLAO);
  const [api, setApi] = useState<ApiResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const bets = useMemo(() => parseBets(text), [text]);

  const results = useMemo<BetResult[]>(() => {
    if (!api?.dezenas?.length) return [];
    const drawn = new Set(api.dezenas);

    return bets.map((nums, i) => {
      const hitNums = nums.filter((n) => drawn.has(n));
      const hits = hitNums.length;

      // Regra importante p/ jogos com >6 números:
      // - Se todas as 6 dezenas sorteadas estiverem dentro do seu conjunto, você tem SENA (pelo menos uma).
      const isSena = api.dezenas.every((d) => nums.includes(d));
      const category: BetResult["category"] =
        isSena ? "Sena" : hits >= 5 ? "Quina" : hits >= 4 ? "Quadra" : "Nada";

      return {
        idx: i + 1,
        nums,
        hits,
        hitNums,
        category,
        isRich: isSena,
      };
    });
  }, [api, bets]);

  const richCount = results.filter((r) => r.isRich).length;
  const quinaCount = results.filter((r) => r.category === "Quina").length;
  const quadraCount = results.filter((r) => r.category === "Quadra").length;

  async function check() {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch("/api/megasena", { cache: "no-store" });
      const data = (await res.json()) as ApiResp;
      if (!res.ok || (data as any).error) {
        setApi(data);
        setErr((data as any).error ?? "Falha ao buscar resultado.");
      } else {
        setApi(data);
      }
    } catch (e: any) {
      setErr(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 980, margin: "40px auto", padding: 20, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 34, marginBottom: 6 }}>Bolão do Brown 💸🍀</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Cole os jogos (1 linha = 1 aposta, mínimo 6 números). Eu comparo com o último resultado.
      </p>

      <section style={{ display: "grid", gap: 10, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid #d1d5db",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 14,
            lineHeight: 1.4,
          }}
        />

        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <button
            onClick={check}
            disabled={loading}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #111827",
              background: loading ? "#9ca3af" : "#111827",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 700,
            }}
          >
            {loading ? "Consultando..." : "Verificar resultado"}
          </button>

          <div style={{ opacity: 0.8 }}>
            Apostas válidas detectadas: <b>{bets.length}</b>
          </div>

          {api?.dezenas?.length ? (
            <div style={{ opacity: 0.8 }}>
              Sorteio: <b>{api.concurso ?? "—"}</b> ({api.dataApuracao ?? "—"}) — Dezenas:{" "}
              <b>{api.dezenas.join(" ")}</b>
            </div>
          ) : null}
        </div>

        {err && (
          <div style={{ padding: 10, borderRadius: 10, background: "#fee2e2", border: "1px solid #fecaca" }}>
            {err}
          </div>
        )}
      </section>

      <section style={{ marginTop: 16, padding: 16, border: "1px solid #e5e7eb", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Resultado do Bolão</h2>

        {!api ? (
          <p style={{ opacity: 0.8 }}>Clique em “Verificar resultado”.</p>
        ) : (
          <>
            <div style={{ display: "flex", gap: 18, flexWrap: "wrap", marginBottom: 10 }}>
              <div><span style={{ opacity: 0.7 }}>Sena:</span> <b>{richCount}</b></div>
              <div><span style={{ opacity: 0.7 }}>Quina:</span> <b>{quinaCount}</b></div>
              <div><span style={{ opacity: 0.7 }}>Quadra:</span> <b>{quadraCount}</b></div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
                <thead>
                  <tr style={{ textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>
                    <th style={{ padding: "10px 8px" }}>#</th>
                    <th style={{ padding: "10px 8px" }}>Números</th>
                    <th style={{ padding: "10px 8px" }}>Acertos</th>
                    <th style={{ padding: "10px 8px" }}>Acertou</th>
                    <th style={{ padding: "10px 8px" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => (
                    <tr key={r.idx} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "10px 8px", whiteSpace: "nowrap" }}>{r.idx}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                          {r.nums.join(" ")}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}><b>{r.hits}</b></td>
                      <td style={{ padding: "10px 8px" }}>
                        {r.hitNums.length ? (
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>
                            {r.hitNums.join(" ")}
                          </span>
                        ) : (
                          <span style={{ opacity: 0.6 }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <b>
                          {r.category === "Sena" ? "🚀 SENA (ricos!)" :
                           r.category === "Quina" ? "🔥 Quina" :
                           r.category === "Quadra" ? "✨ Quadra" : "😅 Nada"}
                        </b>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p style={{ opacity: 0.65, marginTop: 10 }}>
              Nota: para apostas com mais de 6 números, “SENA” aqui significa que as 6 dezenas sorteadas estão dentro da sua linha (pelo menos 1 combinação vencedora).
            </p>
          </>
        )}
      </section>
    </main>
  );
}
