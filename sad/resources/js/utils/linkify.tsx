import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * Utility function to detect URLs in text and convert them to clickable links
 */
export const linkifyText = (text: string): React.ReactNode[] => {
  if (!text) return [text];

  // Enhanced regex to detect URLs - matches http(s), www, and basic domain patterns
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.(?:com|org|net|edu|gov|mil|int|co|uk|ca|de|fr|it|jp|au|in|br|cn|ru|za|es|mx|nl|se|no|dk|fi|pl|cz|gr|tr|ar|cl|pe|ve|uy|py|bo|ec|cr|gt|hn|sv|ni|pa|do|cu|jm|tt|bb|lc|gd|vc|ag|kn|dm|pr|vi|ky|tc|ms|ai|bm|bs|vg|aw|an|cw|sx|bq|mf|gp|mq|bl|pm|wf|pf|nc|fm|pw|mh|mp|gu|as|tv|tk|to|ws|nu|ck|ki|nr|np|sb|vu|fj|pg|mn|mm|la|kh|vn|th|my|sg|bn|ph|id|tl|nz|fk|pn|gg|je|im|gi|va|sm|ad|li|mc|lu|mt|cy|hr|si|sk|cz|hu|ro|bg|ee|lv|lt|by|ua|md|rs|me|mk|al|ba|xk|am|az|ge|tj|uz|tm|kg|kz|af|pk|bd|bt|mv|lk|np|cn|jp|kr|kp|mn|hk|mo|tw|ph|th|mm|la|kh|vn|my|sg|bn|id|tl|au|nz|fj|pg|sb|vu|nc|pf|wf|as|gu|mp|mh|fm|pw|ki|nr|tv|to|ws|nu|ck|tk)(?:\/[^\s]*)?)/gi;

  const parts = text.split(urlRegex);
  
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      // Reset regex lastIndex for proper testing
      urlRegex.lastIndex = 0;
      
      let url = part;
      // Add https:// if the URL doesn't start with a protocol
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-red-600 hover:text-red-700 underline decoration-red-300 hover:decoration-red-500 transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          <span>{part}</span>
          <ExternalLink className="w-3 h-3 flex-shrink-0" />
        </a>
      );
    }
    return part;
  });
};

/**
 * React component that renders text with clickable links
 */
interface LinkifiedTextProps {
  text: string;
  className?: string;
}

export const LinkifiedText: React.FC<LinkifiedTextProps> = ({ text, className = '' }) => {
  const linkedText = linkifyText(text);
  
  return (
    <span className={className}>
      {linkedText}
    </span>
  );
};

export default LinkifiedText;