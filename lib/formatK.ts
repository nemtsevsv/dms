export function formatThousandsRoundUp(n: number): string {
  if (!n || n <= 0) return "0";
  return `${Math.ceil(n / 1000)}K`;
}
