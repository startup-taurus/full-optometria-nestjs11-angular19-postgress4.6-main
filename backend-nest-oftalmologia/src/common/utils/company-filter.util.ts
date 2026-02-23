import { SelectQueryBuilder } from 'typeorm';


export class CompanyFilterUtil {
  /**
   * Aplica filtro por companyId a un QueryBuilder
   * @param queryBuilder - El QueryBuilder de TypeORM
   * @param alias - El alias de la entidad principal
   * @param companyId - ID de la empresa del usuario (null para SUPER_ADMIN)
   */
  static applyCompanyFilter<T>(
    queryBuilder: SelectQueryBuilder<T>,
    alias: string,
    companyId: string | null
  ): SelectQueryBuilder<T> {
    if (companyId !== null && companyId !== undefined) {
      queryBuilder.andWhere(`${alias}.companyId = :companyId`, { companyId });
    }
    return queryBuilder;
  }

  /**
   * Crea condición WHERE para Repository.find()
   * @param baseCondition - Condiciones base existentes
   * @param companyId - ID de la empresa del usuario (null para SUPER_ADMIN)
   */
  static buildWhereCondition(
    baseCondition: any,
    companyId: string | null
  ): any {
    const whereCondition = { ...baseCondition };
    
    if (companyId !== null && companyId !== undefined) {
      whereCondition.companyId = companyId;
    }
    
    return whereCondition;
  }
}