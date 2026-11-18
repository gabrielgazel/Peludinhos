import { DemoBanner } from '../components/DemoBanner';
import { PageHead } from '../components/PageHead';
import { Panel } from '../components/Panel';
import { DEMO_MEDICINES, DEMO_PRODUCTS, type DemoSupply } from '../data/demo';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table';
import { formatDate } from '../../../shared/utils/format';

type SupplySectionProps = {
  id: string;
  title: string;
  items: DemoSupply[];
};

function SupplySection({ id, title, items }: SupplySectionProps) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-3">
      <h2 id={id} className="font-display text-xl font-semibold text-staff-ink">
        {title}
      </h2>
      <Panel className="p-0">
        {/* O primitivo compartilhado já envolve a tabela em um container
            com overflow-x-auto: a página inteira nunca rola na horizontal. */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Ponto/uso</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.name}>
                <TableCell className="font-semibold">{item.name}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>
                  {item.quantity} {item.unit}
                </TableCell>
                <TableCell>
                  {item.validity ? formatDate(item.validity) : 'Sem validade'}
                </TableCell>
                <TableCell>{item.location}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </section>
  );
}

/**
 * Leitura de medicamentos e produtos em modo demonstração (D4.4).
 * Não há service, fetch ou botão de criar/editar: os dados vêm apenas de
 * `data/demo.ts`, rotulados pela `DemoBanner` no topo.
 */
export function SuppliesDemoPage() {
  return (
    <div className="flex flex-col gap-6">
      <PageHead
        title="Insumos"
        subtitle="Medicamentos e produtos da operação em modo demonstração."
      />
      <DemoBanner />
      <SupplySection id="insumos-medicamentos" title="Medicamentos" items={DEMO_MEDICINES} />
      <SupplySection id="insumos-produtos" title="Produtos" items={DEMO_PRODUCTS} />
    </div>
  );
}
