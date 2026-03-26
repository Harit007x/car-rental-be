export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export const getPaginationParams = (query: any): PaginationParams => {
  const rawPage = Number(query?.page);
  const rawLimit = Number(query?.limit);

  const page =
    Number.isFinite(rawPage) && rawPage > 0
      ? Math.floor(rawPage)
      : DEFAULT_PAGE;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0
      ? Math.floor(rawLimit)
      : DEFAULT_LIMIT;
  const cappedLimit = Math.min(limit, MAX_LIMIT);
  const skip = (page - 1) * cappedLimit;

  return {
    page,
    limit: cappedLimit,
    skip,
    take: cappedLimit,
  };
};
