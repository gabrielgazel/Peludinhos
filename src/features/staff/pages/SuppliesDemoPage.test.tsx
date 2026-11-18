import { render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEMO_MEDICINES, DEMO_PRODUCTS } from '../data/demo';
import { SuppliesDemoPage } from './SuppliesDemoPage';

describe('SuppliesDemoPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('mostra o aviso de demonstração', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<SuppliesDemoPage />);

    expect(
      screen.getByText('Dados de demonstração - esta área ainda não persiste no banco'),
    ).toBeInTheDocument();
  });

  it('renderiza as duas tabelas com nome, tipo, quantidade, validade e ponto/uso', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<SuppliesDemoPage />);

    const medicines = screen.getByRole('region', { name: /Medicamentos/i });
    const products = screen.getByRole('region', { name: /Produtos/i });

    expect(within(medicines).getByRole('table')).toBeInTheDocument();
    expect(within(products).getByRole('table')).toBeInTheDocument();
    expect(within(medicines).getByText(DEMO_MEDICINES[0].name)).toBeInTheDocument();
    expect(within(products).getByText(DEMO_PRODUCTS[0].name)).toBeInTheDocument();

    for (const heading of ['Nome', 'Tipo', 'Quantidade', 'Validade', 'Ponto/uso']) {
      expect(within(medicines).getByRole('columnheader', { name: heading })).toBeInTheDocument();
      expect(within(products).getByRole('columnheader', { name: heading })).toBeInTheDocument();
    }
  });

  it('não oferece criação/edição e não faz nenhuma requisição', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<SuppliesDemoPage />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('identifica itens sem validade em vez de mostrar uma data inválida', () => {
    vi.stubGlobal('fetch', vi.fn());
    render(<SuppliesDemoPage />);

    const products = screen.getByRole('region', { name: /Produtos/i });
    expect(within(products).getAllByText('Sem validade').length).toBeGreaterThan(0);
  });
});
