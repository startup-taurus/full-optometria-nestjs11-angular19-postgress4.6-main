import { Select } from '@core/interfaces/ui/ui.interface'
import { TranslateService } from '@ngx-translate/core'

/**
 * Elimina las entradas de un objeto de filtros que son `undefined`, `null`, o coinciden con un valor específico.
 *
 * @param {Object<string, string>} filters - Un objeto donde las claves representan nombres de filtros y los valores son los valores de dichos filtros.
 * @param {string} [value] - Un valor opcional. Si algún filtro tiene este valor, se eliminará del objeto de filtros.
 * @return {Object<string, string>} El objeto de filtros limpio, con las entradas eliminadas si eran `undefined`, `null` o coincidían con el valor especificado.
 */
export function removeEmptyOrSpecificFilters(
  filters: { [key: string]: string },
  value?: string
): { [key: string]: string } {
  Object.keys(filters).forEach((key) => {
    if (
      filters[key] === undefined ||
      filters[key] === null ||
      filters[key] === value
    ) {
      delete filters[key]
    }
  })
  return filters
}

/**
 * Compara dos objetos del mismo tipo y devuelve un nuevo objeto que contiene las propiedades de `obj1` cuyos valores son diferentes en `obj2`.
 *
 * @param {T} obj1 - El primer objeto a comparar.
 * @param {T} obj2 - El segundo objeto a comparar.
 * @return {Partial<T>} Un nuevo objeto que contiene las propiedades de `obj1` con los valores correspondientes de `obj2` para aquellas propiedades que son diferentes entre los dos objetos.
 */
export function getDifferingProperties<T extends object>(
  obj1: T,
  obj2: T
): Partial<T> {
  const differingProperties: Partial<T> = Object.keys(obj1).reduce(
    (result, key) => {
      if (obj1[key as keyof T] !== obj2[key as keyof T]) {
        result[key as keyof T] = obj2[key as keyof T]
      }
      return result
    },
    {} as Partial<T>
  )

  return differingProperties
}

export function calculateSum(cells: any[]): string {
  const totalNetGain = cells.reduce((acc, cell) => acc + parseFloat(cell), 0)
  return totalNetGain.toFixed(2)
}

export function mapAndTranslateLabels(
  parametters?: Select[],
  translate?: TranslateService
): Select[] {
  return parametters!.map((item) => ({
    ...item,
    label: translate!.instant(item.label),
  }))
}
export function getDifferingPropertiesArray<T extends object>(
  obj1: T,
  obj2: T
): Partial<T> {
  const isObject = (obj: any) => obj !== null && typeof obj === 'object'

  function deepDiff(o1: any, o2: any): any {
    if (Array.isArray(o1) && Array.isArray(o2)) {
      return arrayDiffering(o1, o2, deepDiff)
    } else if (isObject(o1) && isObject(o2)) {
      return objectDiffering(o1, o2, deepDiff)
    } else if (o1 !== o2) {
      // Comparamos valores simples (strings, numbers, booleans, etc.)
      return o2
    }
    return undefined
  }

  return deepDiff(obj1, obj2) || ({} as Partial<T>)
}

function arrayDiffering(
  o1: any[],
  o2: any[],
  deepDiff: (o1: any, o2: any) => any
): any {
  if (o1.length !== o2.length) {
    return o2 // Si los arrays tienen diferente longitud, los consideramos diferentes
  }
  const arrayDiff = o1.map((item, index) => deepDiff(item, o2[index]))
  return arrayDiff.some((diff) => diff !== undefined) ? o2 : undefined
}

function objectDiffering<T extends Record<string, any>>(
  o1: T,
  o2: T,
  deepDiff: (o1: any, o2: any) => any
): Partial<T> {
  const isDate = (obj: any) => obj instanceof Date

  if (isDate(o1) && isDate(o2)) {
    // Comparación específica para fechas
    return o1['getTime']() !== o2['getTime']() ? (o2 as any) : undefined
  }

  // Comparamos otros objetos
  const differingProperties: Partial<T> = {}
  const allKeys = new Set([...Object.keys(o1), ...Object.keys(o2)])
  allKeys.forEach((key) => {
    const diff = deepDiff(o1[key as keyof T], o2[key as keyof T])
    if (diff !== undefined) {
      differingProperties[key as keyof T] = o2[key as keyof T] // Siempre guardamos la propiedad del segundo objeto si hay diferencia
    }
  })

  return Object.keys(differingProperties).length > 0
    ? (differingProperties as any)
    : undefined
}
