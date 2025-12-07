import React from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

/**
 * Reusable star rating component.
 * Supports display mode and interactive mode.
 */
export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onChange,
}) => {
  const sizeMap = {
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
  };

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleKeyDown = (value: number, event: React.KeyboardEvent) => {
    if (interactive && onChange && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      onChange(value);
    }
  };

  return (
    <div
      className="star-rating"
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={`Rating: ${rating} out of ${maxRating} stars`}
    >
      {Array.from({ length: maxRating }, (_, i) => {
        const value = i + 1;
        const isFilled = value <= rating;
        const isHalf = !isFilled && value - 0.5 <= rating;

        return (
          <span
            key={value}
            className={`star ${isFilled ? 'filled' : isHalf ? 'half' : 'empty'} ${interactive ? 'interactive' : ''}`}
            onClick={() => handleClick(value)}
            onKeyDown={(e) => handleKeyDown(value, e)}
            role={interactive ? 'radio' : undefined}
            aria-checked={interactive ? value === rating : undefined}
            tabIndex={interactive ? 0 : undefined}
            style={{ fontSize: sizeMap[size] }}
          >
            {isFilled ? '★' : isHalf ? '⯪' : '☆'}
          </span>
        );
      })}
      <style>{`
        .star-rating {
          display: inline-flex;
          gap: 2px;
        }
        .star {
          color: #d1d5db;
          transition: color 0.15s ease, transform 0.1s ease;
        }
        .star.filled {
          color: #fbbf24;
        }
        .star.half {
          color: #fbbf24;
        }
        .star.interactive {
          cursor: pointer;
        }
        .star.interactive:hover {
          transform: scale(1.1);
          color: #f59e0b;
        }
        .star.interactive:focus {
          outline: 2px solid #6366f1;
          outline-offset: 2px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export default StarRating;
