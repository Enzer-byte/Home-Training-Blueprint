import React from 'react';
import { ProductItem } from '../types';

interface ProductBlockProps {
  item: ProductItem;
  idPrefix?: string;
}

export const ProductBlock: React.FC<ProductBlockProps> = ({ item, idPrefix = 'item' }) => {
  return (
    <div className="item" id={`${idPrefix}-${item.id}`}>
      {item.isBonus && item.bonusTag && (
        <span className="bonus-tag" id={`${idPrefix}-${item.id}-tag`}>
          {item.bonusTag}
        </span>
      )}
      <h3 id={`${idPrefix}-${item.id}-title`}>{item.name}</h3>

      {/* Per-Product Image Slot (hides gracefully until configured in CMS) */}
      {item.imageUrl && (
        <div className="product-item-image-wrapper" id={`${idPrefix}-${item.id}-img-box`}>
          <img
            src={item.imageUrl}
            alt={item.imageAlt || item.name}
            loading="lazy"
            id={`${idPrefix}-${item.id}-img`}
            referrerPolicy="no-referrer"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.triedFallback) {
                target.dataset.triedFallback = 'true';
                if (target.src.includes('/uploads/')) {
                  target.src = target.src.replace('/uploads/', '/images/');
                } else if (target.src.includes('/images/')) {
                  target.src = target.src.replace('/images/', '/uploads/');
                }
              }
            }}
          />
        </div>
      )}

      <p id={`${idPrefix}-${item.id}-desc`}>{item.description}</p>
    </div>
  );
};
