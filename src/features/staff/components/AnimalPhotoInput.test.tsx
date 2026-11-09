import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimalPhotoInput } from './AnimalPhotoInput';

describe('AnimalPhotoInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sem foto mostra "Sem foto" e "Escolher foto"', () => {
    const onChange = vi.fn();
    render(<AnimalPhotoInput currentUrl={null} onChange={onChange} />);

    expect(screen.getByText('Sem foto')).toBeInTheDocument();
    expect(screen.getByText('Escolher foto')).toBeInTheDocument();
    expect(screen.queryByText('Remover foto')).not.toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('com currentUrl mostra a imagem e "Remover foto"', () => {
    const onChange = vi.fn();
    render(
      <AnimalPhotoInput currentUrl="https://example.com/foto.jpg" onChange={onChange} />,
    );

    const img = screen.getByAltText('Pré-visualização da foto do animal');
    expect(img).toHaveAttribute('src', 'https://example.com/foto.jpg');
    expect(screen.getByRole('button', { name: /Remover foto/ })).toBeInTheDocument();
    expect(screen.getByText('Trocar foto')).toBeInTheDocument();
    expect(screen.queryByText('Sem foto')).not.toBeInTheDocument();
  });

  it('clicar em "Remover foto" chama onChange({file:null, remove:true}) e exibe "Desfazer remoção"', () => {
    const onChange = vi.fn();
    render(
      <AnimalPhotoInput currentUrl="https://example.com/foto.jpg" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Remover foto/ }));

    expect(onChange).toHaveBeenCalledWith({ file: null, remove: true });
    expect(screen.getByRole('button', { name: /Desfazer remoção/ })).toBeInTheDocument();
    expect(screen.getByText('Sem foto')).toBeInTheDocument();
  });

  it('clicar em "Desfazer remoção" chama onChange({file:null, remove:false})', () => {
    const onChange = vi.fn();
    render(
      <AnimalPhotoInput currentUrl="https://example.com/foto.jpg" onChange={onChange} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Remover foto/ }));
    expect(onChange).toHaveBeenCalledWith({ file: null, remove: true });

    fireEvent.click(screen.getByRole('button', { name: /Desfazer remoção/ }));

    expect(onChange).toHaveBeenLastCalledWith({ file: null, remove: false });
    const img = screen.getByAltText('Pré-visualização da foto do animal');
    expect(img).toHaveAttribute('src', 'https://example.com/foto.jpg');
  });

  it('sem classes legadas no DOM', () => {
    const onChange = vi.fn();
    const { container } = render(
      <AnimalPhotoInput currentUrl="https://example.com/foto.jpg" onChange={onChange} />,
    );

    expect(container.querySelector('.photo-field')).toBeNull();
    expect(container.querySelector('.btn')).toBeNull();
    expect(container.querySelector('[class*="photo-field"]')).toBeNull();
  });
});
