import '@/index.css';
import { render } from 'vitest-browser-react';
import { MemoryRouter } from 'react-router-dom';
import Index from '@/pages/Index';
import { STORAGE_KEY, muscles } from '@/lib/workouts';
import { POSTER_STORAGE_KEY, emptyPosterProgress, parsePosterProgress } from '@/lib/poster-progress';

function AppAt({ path = '/' }: { path?: string }) {
  return <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}><Index /></MemoryRouter>;
}

beforeEach(() => { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(POSTER_STORAGE_KEY); });
afterEach(() => { vi.restoreAllMocks(); localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(POSTER_STORAGE_KEY); });

test('all supplied posters open their own interactive pages', async () => {
  const screen = await render(<AppAt />);
  await expect.element(screen.getByRole('link', { name: 'Faisal Rezai Unique Workout Routine home', exact: true })).toHaveTextContent('Faisal Rezai Unique Workout Routine');
  for (const muscle of muscles) {
    await expect.element(screen.getByRole('img', { name: `${muscle.name} 100 day challenge poster` })).toHaveAttribute('src', `/anatomy/${muscle.id}-interactive-v1.jpeg`);
    await screen.getByRole('link', { name: `Open ${muscle.name} poster` }).click();
    await expect.element(screen.getByRole('heading', { name: muscle.name, exact: true })).toBeVisible();
    await expect.element(screen.getByRole('button', { name: `${muscle.name} day 1`, exact: true })).toBeEnabled();
    await expect.element(screen.getByRole('button', { name: `${muscle.name} day 100`, exact: true })).toBeEnabled();
    await screen.getByRole('link', { name: 'All posters', exact: true }).click();
  }
  await expect.element(screen.getByRole('progressbar', { name: 'Overall progress', exact: true })).toHaveAttribute('max', '900');
});

test('checks multiple days, turns them green, saves, and allows one-tap undo', async () => {
  const screen = await render(<AppAt path="/poster/biceps" />);
  for (const day of [1, 2, 3, 4, 100]) {
    await screen.getByRole('button', { name: `Biceps day ${day}`, exact: true }).click();
  }
  await expect.element(screen.getByRole('button', { name: 'Biceps day 4', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.element(screen.getByRole('button', { name: 'Biceps day 4', exact: true })).toHaveClass('bg-primary');
  await expect.element(screen.getByRole('progressbar', { name: 'Biceps progress', exact: true })).toHaveAttribute('value', '5');
  await expect.element(screen.getByRole('button', { name: 'Biceps day 5', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(parsePosterProgress(localStorage.getItem(POSTER_STORAGE_KEY)).biceps).toEqual([1, 2, 3, 4, 100]);
  await screen.unmount();
  const reloaded = await render(<AppAt path="/poster/biceps" />);
  await expect.element(reloaded.getByRole('button', { name: 'Biceps day 100', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await reloaded.getByRole('button', { name: 'Biceps day 2', exact: true }).click();
  await expect.element(reloaded.getByRole('button', { name: 'Biceps day 2', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(parsePosterProgress(localStorage.getItem(POSTER_STORAGE_KEY)).biceps).toEqual([1, 3, 4, 100]);
  await expect.element(reloaded.getByRole('progressbar', { name: 'Overall progress', exact: true })).toHaveAttribute('value', '4');
});

test('rapid taps in one batch do not lose any selected days', async () => {
  const screen = await render(<AppAt path="/poster/shoulders" />);
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button[aria-pressed]'));
  for (const button of buttons.slice(0, 20)) button.click();
  expect(parsePosterProgress(localStorage.getItem(POSTER_STORAGE_KEY)).shoulders).toEqual(Array.from({ length: 20 }, (_, index) => index + 1));
  await expect.element(screen.getByRole('progressbar', { name: 'Shoulders progress', exact: true })).toHaveAttribute('value', '20');
});

test('keeps each poster independent while summing overall progress', async () => {
  const screen = await render(<AppAt path="/poster/biceps" />);
  await screen.getByRole('button', { name: 'Biceps day 1', exact: true }).click();
  await screen.getByRole('link', { name: 'All posters', exact: true }).click();
  await screen.getByRole('link', { name: 'Open Chest poster' }).click();
  await expect.element(screen.getByRole('button', { name: 'Chest day 1', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await screen.getByRole('button', { name: 'Chest day 1', exact: true }).click();
  await screen.getByRole('link', { name: 'All posters', exact: true }).click();
  await expect.element(screen.getByRole('progressbar', { name: 'Biceps progress', exact: true })).toHaveAttribute('value', '1');
  await expect.element(screen.getByRole('progressbar', { name: 'Chest progress', exact: true })).toHaveAttribute('value', '1');
  await expect.element(screen.getByRole('progressbar', { name: 'Overall progress', exact: true })).toHaveAttribute('value', '2');
});

test('preserves old workout counts and does not restore squares after undo', async () => {
  const oldData = JSON.stringify({ version: 1, entries: [{ id: 'old', muscleId: 'biceps', date: '2026-09-01' }] });
  localStorage.setItem(STORAGE_KEY, oldData);
  const screen = await render(<AppAt path="/poster/biceps" />);
  await expect.element(screen.getByRole('button', { name: 'Biceps day 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await screen.getByRole('button', { name: 'Biceps day 1', exact: true }).click();
  await screen.unmount();
  const reloaded = await render(<AppAt path="/poster/biceps" />);
  await expect.element(reloaded.getByRole('button', { name: 'Biceps day 1', exact: true })).toHaveAttribute('aria-pressed', 'false');
  expect(localStorage.getItem(STORAGE_KEY)).toBe(oldData);
});

test('blocks unsafe writes to corrupt storage and supports retry', async () => {
  localStorage.setItem(POSTER_STORAGE_KEY, '{broken');
  const screen = await render(<AppAt path="/poster/legs" />);
  await expect.element(screen.getByRole('alert')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Legs day 1', exact: true })).toBeDisabled();
  expect(localStorage.getItem(POSTER_STORAGE_KEY)).toBe('{broken');
  localStorage.setItem(POSTER_STORAGE_KEY, JSON.stringify({ version: 1, days: emptyPosterProgress() }));
  await screen.getByRole('button', { name: 'Retry loading progress' }).click();
  await expect.element(screen.getByRole('button', { name: 'Legs day 1', exact: true })).toBeEnabled();
});

test('a failed save never displays unsaved completion and can be retried', async () => {
  const screen = await render(<AppAt path="/poster/abs" />);
  const save = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage unavailable'); });
  await screen.getByRole('button', { name: 'Abs day 1', exact: true }).click();
  await expect.element(screen.getByRole('alert')).toBeVisible();
  await expect.element(screen.getByRole('button', { name: 'Abs day 1', exact: true })).toHaveAttribute('aria-pressed', 'false');
  save.mockRestore();
  await screen.getByRole('button', { name: 'Retry loading progress' }).click();
  await screen.getByRole('button', { name: 'Abs day 1', exact: true }).click();
  await expect.element(screen.getByRole('button', { name: 'Abs day 1', exact: true })).toHaveAttribute('aria-pressed', 'true');
});

test('refreshes progress changed in another tab', async () => {
  const screen = await render(<AppAt path="/poster/glutes" />);
  const data = JSON.stringify({ version: 1, days: { ...emptyPosterProgress(), glutes: [3, 4] } });
  localStorage.setItem(POSTER_STORAGE_KEY, data);
  window.dispatchEvent(new StorageEvent('storage', { key: POSTER_STORAGE_KEY, newValue: data }));
  await expect.element(screen.getByRole('button', { name: 'Glutes day 3', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect.element(screen.getByRole('progressbar', { name: 'Overall progress', exact: true })).toHaveAttribute('value', '2');
});
