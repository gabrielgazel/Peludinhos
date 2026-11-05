import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';

describe('Button', () => {
  it('usa a variante primária por padrão', () => {
    render(<Button>Adotar</Button>);
    expect(screen.getByRole('button', { name: 'Adotar' })).toHaveClass('bg-primary');
  });

  it('renderiza como link com asChild', () => {
    render(
      <Button asChild variant="secondary">
        <a href="/adocao">Ver animais</a>
      </Button>,
    );
    expect(screen.getByRole('link', { name: 'Ver animais' })).toHaveAttribute('href', '/adocao');
  });

  it('respeita disabled', () => {
    render(<Button disabled>Enviar</Button>);
    expect(screen.getByRole('button', { name: 'Enviar' })).toBeDisabled();
  });
});

describe('Badge', () => {
  it('aplica a variante accent', () => {
    render(<Badge variant="accent">Dócil</Badge>);
    expect(screen.getByText('Dócil')).toHaveClass('bg-accent');
  });
});

describe('Card', () => {
  it('compõe título e conteúdo', () => {
    render(
      <Card>
        <CardHeader><CardTitle>Mel</CardTitle></CardHeader>
        <CardContent>2 anos</CardContent>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: 'Mel' })).toBeInTheDocument();
    expect(screen.getByText('2 anos')).toBeInTheDocument();
  });
});
