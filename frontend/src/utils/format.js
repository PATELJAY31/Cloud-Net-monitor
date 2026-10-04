export function formatTime(value) {
  if (!value) return 'Never';

  return new Date(value).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
