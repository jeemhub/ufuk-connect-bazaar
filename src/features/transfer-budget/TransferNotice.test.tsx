import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
vi.mock('@/i18n/LanguageContext', () => ({ useLanguage: () => ({ lang: 'ar' }) }));
import { TransferNotice } from './TransferNotice';
afterEach(cleanup);
it('shows a shared saving notice and clears it when server accounting returns to normal', () => {
  render(<TransferNotice />); expect(screen.queryByRole('status')).not.toBeInTheDocument();
  act(() => window.dispatchEvent(new CustomEvent('ufuk-transfer-mode', { detail: { mode: 'limited' } })));
  expect(screen.getByRole('status')).toHaveTextContent('بعض الصور');
  act(() => window.dispatchEvent(new CustomEvent('ufuk-transfer-mode', { detail: { mode: 'normal' } })));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
it('never claims normal or zero usage when accounting is unavailable', () => {
  render(<TransferNotice />);
  act(() => window.dispatchEvent(new CustomEvent('ufuk-transfer-mode', { detail: { mode: 'unavailable' } })));
  expect(screen.queryByRole('status')).not.toBeInTheDocument();
});
