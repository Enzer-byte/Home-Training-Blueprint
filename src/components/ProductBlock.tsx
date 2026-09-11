import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
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
          />
        </div>
      )}

      <p id={`${idPrefix}-${item.id}-desc`}>{item.description}</p>
    </div>
  );
};
