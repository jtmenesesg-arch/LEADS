export function formatMoney(cents: number, currency = "CLP") {
  const value = cents / 100;
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}
