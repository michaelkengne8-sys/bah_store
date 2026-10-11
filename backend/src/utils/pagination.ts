export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePaginationParams(query: Record<string, unknown>): PaginationParams {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '20'), 10)));
  const sortBy = String(query.sortBy || 'createdAt');
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return { page, limit, sortBy, sortOrder };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);

  return {
    data,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

export function buildPrismaOrderBy(sortBy: string, sortOrder: 'asc' | 'desc'): Record<string, 'asc' | 'desc'> {
  const allowedFields = ['createdAt', 'updatedAt', 'title', 'price', 'name', 'email', 'status', 'total'];
  const field = allowedFields.includes(sortBy) ? sortBy : 'createdAt';
  return { [field]: sortOrder };
}

export function buildPrismaWhere<T extends Record<string, unknown>>(
  query: Record<string, unknown>,
  searchFields: string[],
  customFilters: T = {} as T
): Record<string, unknown> {
  const where: Record<string, unknown> = { ...customFilters };

  // Handle search
  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    const searchTerm = query.search.trim();
    if (searchFields.length > 0) {
      where.OR = searchFields.map((field) => ({
        [field]: { contains: searchTerm, mode: 'insensitive' as const },
      }));
    }
  }

  return where;
}