import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { ReviewFormData } from './ReviewForm';

/**
 * RTK Query API for reviews operations.
 */
export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Reviews', 'ReviewStats'],
  endpoints: (builder) => ({
    /**
     * Create a new review.
     */
    createReview: builder.mutation<Review, ReviewFormData>({
      query: (data) => ({
        url: '/products/reviews',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Reviews', 'ReviewStats'],
    }),

    /**
     * Get reviews for a seller.
     */
    getSellerReviews: builder.query<
      Review[],
      { sellerId: string; limit?: number; offset?: number }
    >({
      query: ({ sellerId, limit, offset }) => ({
        url: `/products/reviews/seller/${sellerId}`,
        params: { limit, offset },
      }),
      providesTags: ['Reviews'],
    }),

    /**
     * Get reviews for a courier.
     */
    getCourierReviews: builder.query<
      Review[],
      { courierId: string; limit?: number; offset?: number }
    >({
      query: ({ courierId, limit, offset }) => ({
        url: `/products/reviews/courier/${courierId}`,
        params: { limit, offset },
      }),
      providesTags: ['Reviews'],
    }),

    /**
     * Get review stats for a seller.
     */
    getSellerStats: builder.query<ReviewStats, string>({
      query: (sellerId) => `/products/reviews/seller/${sellerId}/stats`,
      providesTags: ['ReviewStats'],
    }),

    /**
     * Get review stats for a courier.
     */
    getCourierStats: builder.query<ReviewStats, string>({
      query: (courierId) => `/products/reviews/courier/${courierId}/stats`,
      providesTags: ['ReviewStats'],
    }),

    /**
     * Get current user's reviews.
     */
    getMyReviews: builder.query<Review[], void>({
      query: () => '/products/reviews/my-reviews',
      providesTags: ['Reviews'],
    }),

    /**
     * Respond to a review (seller/courier).
     */
    respondToReview: builder.mutation<Review, { reviewId: string; response: string }>({
      query: ({ reviewId, response }) => ({
        url: `/products/reviews/${reviewId}/respond`,
        method: 'PATCH',
        body: { response },
      }),
      invalidatesTags: ['Reviews'],
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useGetSellerReviewsQuery,
  useGetCourierReviewsQuery,
  useGetSellerStatsQuery,
  useGetCourierStatsQuery,
  useGetMyReviewsQuery,
  useRespondToReviewMutation,
} = reviewsApi;

/**
 * Review interface matching the backend schema.
 */
interface Review {
  _id: string;
  orderId: string;
  reviewerId: string;
  targetId: string;
  targetType: 'seller' | 'courier';
  rating: number;
  comment?: string;
  isVisible: boolean;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Review statistics interface.
 */
interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}
