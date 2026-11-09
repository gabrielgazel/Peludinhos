import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Alert } from './Alert';
import { EmptyState } from './EmptyState';
import { PageHead } from './PageHead';
import { Panel } from './Panel';
import { StatCard } from './StatCard';

describe('PageHead', () => {
  it('renderiza o título como heading nível 1, com subtítulo e ações', () => {
    render(
      <PageHead
        title="Visão geral"
        subtitle="Resumo da equipe"
        actions={<button type="button">Novo animal</button>}
      />,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Visão geral' })).toBeInTheDocument();
    expect(screen.getByText('Resumo da equipe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Novo animal' })).toBeInTheDocument();
  });

  it('não quebra sem subtítulo e sem ações', () => {
    render(<PageHead title="Animais" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Animais' })).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('StatCard', () => {
  it('é um link para `to` e mostra rótulo, valor e ícone', () => {
    render(
      <MemoryRouter>
        <StatCard
          to="/painel/animais"
          label="Animais cadastrados"
          value={12}
          icon={<span data-testid="icone-card">i</span>}
        />
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: /animais cadastrados/i });
    expect(link).toHaveAttribute('href', '/painel/animais');
    expect(screen.getByText('Animais cadastrados')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByTestId('icone-card')).toBeInTheDocument();
  });

  it('renderiza sem ícone', () => {
    render(
      <MemoryRouter>
        <StatCard to="/painel/intencoes" label="Intenções pendentes" value="3" />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /intenções pendentes/i })).toHaveAttribute(
      'href',
      '/painel/intencoes',
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('Panel', () => {
  it('renderiza os filhos e aplica className extra', () => {
    render(
      <Panel className="extra-classe">
        <p>Conteúdo do painel</p>
      </Panel>,
    );

    expect(screen.getByText('Conteúdo do painel')).toBeInTheDocument();
    expect(screen.getByText('Conteúdo do painel').parentElement).toHaveClass('extra-classe');
  });
});

describe('EmptyState', () => {
  it('expõe role="status" e renderiza os filhos', () => {
    render(<EmptyState>Nenhum animal encontrado</EmptyState>);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Nenhum animal encontrado')).toBeInTheDocument();
  });
});

describe('Alert', () => {
  it('expõe role="alert" e usa a variante info por padrão', () => {
    render(<Alert>Algo saiu do esperado</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Algo saiu do esperado');
    expect(alert).toHaveClass('border-l-staff-accent');
  });

  it('aplica a variante danger com borda de perigo', () => {
    render(<Alert variant="danger">Erro ao salvar</Alert>);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-l-staff-danger');
    expect(alert).toHaveTextContent('Erro ao salvar');
  });
});
