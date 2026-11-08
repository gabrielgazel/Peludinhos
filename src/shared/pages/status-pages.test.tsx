import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { NotAuthorizedPage } from './NotAuthorizedPage';
import { NotFoundPage } from './NotFoundPage';

/*
 * Estas páginas são renderizadas dentro do <main className="pub-main"> do
 * PublicLayout: nenhuma delas pode declarar seu próprio <main>.
 */
const pages = [
  ['NotFoundPage', NotFoundPage],
  ['NotAuthorizedPage', NotAuthorizedPage],
] as const;

describe('páginas de status', () => {
  it.each(pages)('%s não renderiza um <main> próprio', (_name, Page) => {
    render(
      <MemoryRouter>
        <Page />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('main')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });
});
