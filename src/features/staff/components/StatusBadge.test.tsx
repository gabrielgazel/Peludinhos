import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renderiza os filhos com a base de selo', () => {
    render(<StatusBadge tone="green">Disponível</StatusBadge>);

    const badge = screen.getByText('Disponível');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('rounded-full');
    expect(badge).toHaveClass('inline-flex');
    expect(badge).toHaveClass('shrink-0');
    expect(badge).toHaveClass('w-fit');
    expect(badge).toHaveClass('text-xs');
  });

  it('aplica o tom green com fundo success e texto tinta', () => {
    render(<StatusBadge tone="green">Disponível</StatusBadge>);
    expect(screen.getByText('Disponível')).toHaveClass('bg-staff-success/20');
    expect(screen.getByText('Disponível')).toHaveClass('text-staff-ink');
  });

  it('aplica o tom amber com fundo accent-soft e texto tinta', () => {
    render(<StatusBadge tone="amber">Em processo</StatusBadge>);
    expect(screen.getByText('Em processo')).toHaveClass('bg-staff-accent-soft');
    expect(screen.getByText('Em processo')).toHaveClass('text-staff-ink');
  });

  it('aplica o tom red com fundo danger e texto danger', () => {
    render(<StatusBadge tone="red">Rejeitada</StatusBadge>);
    expect(screen.getByText('Rejeitada')).toHaveClass('bg-staff-danger/10');
    expect(screen.getByText('Rejeitada')).toHaveClass('text-staff-danger');
  });

  it('aplica o tom gray com fundo line e texto muted', () => {
    render(<StatusBadge tone="gray">Falecido</StatusBadge>);
    expect(screen.getByText('Falecido')).toHaveClass('bg-staff-line/50');
    expect(screen.getByText('Falecido')).toHaveClass('text-staff-muted');
  });

  it('não usa hex hardcoded: cores vêm dos tokens staff', () => {
    // A implementação é verificada via classes; nenhum hex deve aparecer no CSS ao redor
    render(<StatusBadge tone="green">Disponível</StatusBadge>);
    const badge = screen.getByText('Disponível');
    expect(badge.className).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
