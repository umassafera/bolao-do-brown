import { NextResponse } from "next/server";

export async function GET() {
  try {
    const url = "https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena"; // :contentReference[oaicite:2]{index=2}
    const res = await fetch(url, {
      next: { revalidate: 60 },
      headers: { accept: "application/json" },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao consultar API da CAIXA", status: res.status },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      concurso: data?.numero ?? null,
      dataApuracao: data?.dataApuracao ?? null,
      dezenas: (data?.listaDezenas ?? []) as string[],
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "Erro inesperado ao consultar a API", details: String(e?.message ?? e) },
      { status: 500 }
    );
  }
}
