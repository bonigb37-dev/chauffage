export type Review = { id: string; author: string; location: string; rating: number; date: string; title: string; comment: string; verified: boolean; productName?: string; productId?: number };
// No genuine collected reviews are connected. Never synthesize customer evidence.
export const reviewsData: Record<number, Review[]> = {};
export function getReviewsForProduct(productId: number): Review[] { return reviewsData[productId] ?? []; }
export function getAverageRating(productId: number) {
 const reviews = getReviewsForProduct(productId);
 return { average: reviews.length ? Math.round(reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length * 10) / 10 : 0, count: reviews.length };
}
export function getAllReviews(): Review[] { return Object.values(reviewsData).flat(); }
export function getTotalReviewsSummary() {
 const all = getAllReviews();
 return { totalReviews: all.length, averageRating: all.length ? Math.round(all.reduce((sum, review) => sum + review.rating, 0) / all.length * 10) / 10 : 0 };
}
