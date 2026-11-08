import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

describe('Table', () => {
  it('renderiza cabeçalho com duas colunas e uma linha de dados', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Idade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Mel</TableCell>
            <TableCell>2 anos</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Nome' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Idade' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Mel' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '2 anos' })).toBeInTheDocument();
    // thead + tbody expõem role rowgroup
    expect(screen.getAllByRole('rowgroup')).toHaveLength(2);
  });

  it('usa scope="col" no cabeçalho e não o torna focável', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>Mel</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    const header = screen.getByRole('columnheader', { name: 'Nome' });
    expect(header).toHaveAttribute('scope', 'col');
    expect(header).not.toHaveAttribute('tabindex');
  });

  it('aplica hover com o token staff e mescla className via cn', () => {
    render(
      <Table className="min-w-full">
        <TableBody>
          <TableRow className="custom-row">
            <TableCell>Mel</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByRole('table')).toHaveClass('min-w-full');
    const row = screen.getByRole('row');
    expect(row).toHaveClass('hover:bg-staff-bg');
    expect(row).toHaveClass('custom-row');
  });

  it('renderiza a legenda com TableCaption', () => {
    render(
      <Table>
        <TableCaption>Animais cadastrados</TableCaption>
        <TableBody>
          <TableRow>
            <TableCell>Mel</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );

    expect(screen.getByText('Animais cadastrados')).toBeInTheDocument();
  });

  it('não usa hex hardcoded: cores vêm dos tokens staff', () => {
    const source = readFileSync('src/shared/ui/table.tsx', 'utf-8');
    expect(source).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(source).toContain('hover:bg-staff-bg');
    expect(source).toContain('border-staff-line');
    expect(source).toContain('text-staff-muted');
  });
});
