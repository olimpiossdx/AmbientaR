/** Extrai blocos gerados pela calculadora (contêm **Fórmula:**) para seção de memorial de cálculo. */
export function extractMemoriaisCalculoAutomaticos(
  ...textos: (string | undefined | null)[]
): string {
  const blocos: string[] = [];

  for (const texto of textos) {
    if (!texto?.trim()) continue;
    const partes = texto.split(/(?=### )/);
    for (const parte of partes) {
      const t = parte.trim();
      if (t.includes('**Fórmula:**')) {
        blocos.push(t);
      }
    }
  }

  return blocos.join('\n\n---\n\n');
}
