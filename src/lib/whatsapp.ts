export function whatsappLink(internationalNumber: string, message?: string): string {
  const digits = internationalNumber.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function wazeLink(address: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(address)}&navigate=yes`;
}

export function googleMapsLink(address: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

export function googleMapsEmbed(address: string): string {
  return `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed&hl=he`;
}
