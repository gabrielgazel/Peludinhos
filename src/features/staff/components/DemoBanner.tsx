import { TriangleAlert } from 'lucide-react';

/**
 * Faixa âmbar de demonstração. Deve ficar no topo de qualquer tela que
 * mostre dados de exemplo, para que o aviso seja impossível de não ver.
 */
export function DemoBanner() {
  return (
    <div
      role="note"
      className="flex items-start gap-3 rounded-lg border border-amber-300 border-l-4 border-l-amber-500 bg-amber-50 p-4 text-amber-900"
    >
      <TriangleAlert size={20} aria-hidden="true" className="mt-0.5 shrink-0" />
      <p className="font-semibold">
        Dados de demonstração - esta área ainda não persiste no banco
      </p>
    </div>
  );
}
