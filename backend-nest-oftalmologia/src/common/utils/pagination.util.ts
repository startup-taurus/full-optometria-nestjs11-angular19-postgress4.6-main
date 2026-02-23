export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface PaginationResult<T> {
  result: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export class PaginationUtil {
  static paginate<T>(
    data: T[],
    totalCount: number,
    options: PaginationOptions
  ): PaginationResult<T> {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);
    const totalPages = Math.ceil(totalCount / limit);

    return {
      result: data,
      totalCount,
      currentPage: page,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    };
  }

  static getSkipAndTake(options: PaginationOptions): {
    skip: number;
    take: number;
  } {
    const page = Math.max(1, options.page || 1);
    const limit = Math.max(1, options.limit || 10);

    return {
      skip: (page - 1) * limit,
      take: limit,
    };
  }
}
