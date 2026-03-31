//Diccionario de empresas permitidas en el sistema, añadir las que están en la base de datos
//tal cual como está en la columna de slug, Ojito ponerla exactamente igual xd
export const ALLOWED_COMPANIES: Record<string, boolean> = {
  sorti: true,
  'optica-sie': true,
  'startup': true,
  'visionary': true,
};

export function getAllowedCompanyNames(): string[] {
  return Object.keys(ALLOWED_COMPANIES).map((key) => key.toLowerCase());
}

export function isCompanyAllowed(companySlug: string): boolean {
  const normalizedSlug = (companySlug || '').toLowerCase();
  return Object.keys(ALLOWED_COMPANIES).some(
    (key) => key.toLowerCase() === normalizedSlug
  );
}
