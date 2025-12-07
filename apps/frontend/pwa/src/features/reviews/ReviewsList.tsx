import React from 'react';
import { StarRating } from '../../components/StarRating';

interface Review {
  _id: string;
  orderId: string;
  reviewerId: string;
  targetId: string;
  targetType: 'seller' | 'courier';
  rating: number;
  comment?: string;
  response?: string;
  respondedAt?: string;
  createdAt: string;
}

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

interface ReviewsListProps {
  reviews: Review[];
  stats?: ReviewStats;
  isLoading?: boolean;
  showStats?: boolean;
}

/**
 * Displays a list of reviews with optional stats summary.
 */
export const ReviewsList: React.FC<ReviewsListProps> = ({
  reviews,
  stats,
  isLoading,
  showStats = true,
}) => {
  if (isLoading) {
    return (
      <div className="reviews-loading">
        <div className="spinner" />
        <p>Cargando reseñas...</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-VE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="reviews-list-container">
      {showStats && stats && (
        <div className="reviews-stats">
          <div className="stats-summary">
            <div className="average-rating">
              <span className="rating-number">{stats.averageRating.toFixed(1)}</span>
              <StarRating rating={stats.averageRating} size="md" />
              <span className="total-reviews">{stats.totalReviews} reseñas</span>
            </div>
            <div className="rating-distribution">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = stats.ratingDistribution[rating as 1 | 2 | 3 | 4 | 5];
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="distribution-row">
                    <span className="rating-label">{rating}★</span>
                    <div className="bar-container">
                      <div className="bar-fill" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="count">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {reviews.length === 0 ? (
        <div className="no-reviews">
          <p>Aún no hay reseñas</p>
        </div>
      ) : (
        <div className="reviews-list">
          {reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-header">
                <StarRating rating={review.rating} size="sm" />
                <span className="review-date">{formatDate(review.createdAt)}</span>
              </div>
              {review.comment && <p className="review-comment">{review.comment}</p>}
              {review.response && (
                <div className="review-response">
                  <span className="response-label">Respuesta:</span>
                  <p>{review.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .reviews-list-container {
          max-width: 600px;
        }
        .reviews-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem;
          color: #6b7280;
        }
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #e5e7eb;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .reviews-stats {
          background: #f9fafb;
          border-radius: 12px;
          padding: 1.25rem;
          margin-bottom: 1.5rem;
        }
        .stats-summary {
          display: flex;
          gap: 2rem;
          flex-wrap: wrap;
        }
        .average-rating {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
        }
        .rating-number {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1a1a2e;
        }
        .total-reviews {
          font-size: 0.875rem;
          color: #6b7280;
        }
        .rating-distribution {
          flex: 1;
          min-width: 200px;
        }
        .distribution-row {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }
        .rating-label {
          width: 28px;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .bar-container {
          flex: 1;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
        }
        .bar-fill {
          height: 100%;
          background: #fbbf24;
          transition: width 0.3s ease;
        }
        .count {
          width: 24px;
          text-align: right;
          font-size: 0.75rem;
          color: #6b7280;
        }
        .no-reviews {
          text-align: center;
          padding: 2rem;
          color: #9ca3af;
        }
        .reviews-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .review-item {
          padding: 1rem;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }
        .review-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }
        .review-date {
          font-size: 0.75rem;
          color: #9ca3af;
        }
        .review-comment {
          margin: 0;
          color: #374151;
          line-height: 1.5;
        }
        .review-response {
          margin-top: 0.75rem;
          padding: 0.75rem;
          background: #f3f4f6;
          border-radius: 6px;
        }
        .response-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
        }
        .review-response p {
          margin: 0.25rem 0 0;
          font-size: 0.875rem;
          color: #374151;
        }
      `}</style>
    </div>
  );
};

export default ReviewsList;
