import React, { useState, useCallback } from 'react';
import { StarRating } from '../../components/StarRating';

export type ReviewTargetType = 'seller' | 'courier';

interface ReviewFormProps {
  orderId: string;
  targetId: string;
  targetType: ReviewTargetType;
  targetName?: string;
  onSubmit: (data: ReviewFormData) => Promise<void>;
  onCancel?: () => void;
}

export interface ReviewFormData {
  orderId: string;
  targetId: string;
  targetType: ReviewTargetType;
  rating: number;
  comment?: string;
}

/**
 * Review form component for rating sellers/couriers.
 */
export const ReviewForm: React.FC<ReviewFormProps> = ({
  orderId,
  targetId,
  targetType,
  targetName,
  onSubmit,
  onCancel,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetLabel = targetType === 'seller' ? 'vendedor' : 'courier';

  const handleSubmit = useCallback(async () => {
    if (rating === 0) {
      setError('Por favor selecciona una calificación');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        orderId,
        targetId,
        targetType,
        rating,
        comment: comment.trim() || undefined,
      });
    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Error al enviar la reseña. Intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  }, [orderId, targetId, targetType, rating, comment, onSubmit]);

  return (
    <div className="review-form">
      <div className="review-form-header">
        <h3>Califica al {targetLabel}</h3>
        {targetName && <p className="target-name">{targetName}</p>}
      </div>

      {error && <div className="review-form-error">{error}</div>}

      <div className="rating-section">
        <label>Tu calificación</label>
        <StarRating rating={rating} size="lg" interactive onChange={setRating} />
        <span className="rating-text">
          {rating === 0 && 'Toca una estrella'}
          {rating === 1 && 'Muy malo'}
          {rating === 2 && 'Malo'}
          {rating === 3 && 'Regular'}
          {rating === 4 && 'Bueno'}
          {rating === 5 && 'Excelente'}
        </span>
      </div>

      <div className="comment-section">
        <label htmlFor="review-comment">Comentario (opcional)</label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={`Cuéntanos tu experiencia con el ${targetLabel}...`}
          maxLength={1000}
          rows={4}
        />
        <span className="char-count">{comment.length}/1000</span>
      </div>

      <div className="review-form-actions">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="cancel-button"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          className="submit-button"
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Enviar reseña'}
        </button>
      </div>

      <style>{`
        .review-form {
          max-width: 480px;
          padding: 1.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        .review-form-header {
          text-align: center;
          margin-bottom: 1.5rem;
        }
        .review-form-header h3 {
          margin: 0;
          color: #1a1a2e;
          font-size: 1.25rem;
        }
        .target-name {
          margin: 0.25rem 0 0;
          color: #666;
          font-size: 0.875rem;
        }
        .review-form-error {
          background: #fee2e2;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }
        .rating-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .rating-section label {
          font-weight: 600;
          color: #374151;
        }
        .rating-text {
          font-size: 0.875rem;
          color: #6b7280;
          height: 1.2rem;
        }
        .comment-section {
          margin-bottom: 1.5rem;
        }
        .comment-section label {
          display: block;
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.5rem;
        }
        .comment-section textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 1rem;
          font-family: inherit;
          resize: vertical;
        }
        .comment-section textarea:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .char-count {
          display: block;
          text-align: right;
          font-size: 0.75rem;
          color: #9ca3af;
          margin-top: 0.25rem;
        }
        .review-form-actions {
          display: flex;
          gap: 1rem;
        }
        .cancel-button {
          flex: 1;
          padding: 0.875rem;
          background: #f3f4f6;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
        }
        .submit-button {
          flex: 2;
          padding: 0.875rem;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
        }
        .submit-button:disabled {
          background: #d1d5db;
          cursor: not-allowed;
        }
        .submit-button:not(:disabled):hover {
          background: linear-gradient(135deg, #f59e0b, #d97706);
        }
      `}</style>
    </div>
  );
};

export default ReviewForm;
