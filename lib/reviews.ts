export type Review = {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  title: string;
  comment: string;
  verified: boolean;
  productName?: string;
  productId?: number;
};

// Authentische Kundenbewertungen auf Deutsch
export const reviewsData: Record<number, Review[]> = {};

export function getReviewsForProduct(productId: number): Review[] {
  return reviewsData[productId] ?? [];
}

export function getAverageRating(productId: number) {
  const reviews = getReviewsForProduct(productId) ?? [];
  const len = reviews?.length ?? 0;
  return {
    average: len ? Math.round((reviews.reduce((sum, r) => sum + (r?.rating ?? 0), 0) / len) * 10) / 10 : 0,
    count: len,
  };
}

export function getAllReviews(): Review[] {
  return Object.values(reviewsData ?? {}).flat().filter(Boolean);
}

export function getTotalReviewsSummary() {
  const all = getAllReviews() ?? [];
  const len = all?.length ?? 0;
  return {
    totalReviews: len,
    averageRating: len ? Math.round((all.reduce((sum, r) => sum + (r?.rating ?? 0), 0) / len) * 10) / 10 : 0,
  };
}
