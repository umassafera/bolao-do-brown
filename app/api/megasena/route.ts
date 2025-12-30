import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch(
      "https://brasilapi.com.br/api/loterias/v1/megasena",
      {
        next: { revalidate: 60 }
      }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Falha ao consultar BrasilAPI" },
        { status: 502 }
      );
    }

    const data = await res.json();

    return NextResponse.json({
      concurso: data.concurso,
      dataApuracao: data.data,
      dezenas: data.dezenas
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Erro ao consultar resultado da Mega-Sena",
        details: err?.message ?? String(err)
      },
      { status: 500 }
    );
  }
}
