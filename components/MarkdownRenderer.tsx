import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Split by double newline to handle paragraphs
  const paragraphs = content.split(/\n\n+/);

  return (
    <div className="space-y-4 text-ancient-100 font-serif leading-relaxed text-lg">
      {paragraphs.map((block, index) => {
        // Headers
        if (block.startsWith('### ')) {
          return <h3 key={index} className="text-xl font-display font-bold text-amber-500 mt-6 mb-2">{parseInline(block.replace('### ', ''))}</h3>;
        }
        if (block.startsWith('## ')) {
          return <h2 key={index} className="text-2xl font-display font-bold text-amber-400 mt-8 mb-3 border-b border-amber-900/30 pb-2">{parseInline(block.replace('## ', ''))}</h2>;
        }
        if (block.startsWith('# ')) {
          return <h1 key={index} className="text-3xl font-display font-bold text-amber-300 mt-8 mb-4">{parseInline(block.replace('# ', ''))}</h1>;
        }

        // List items
        if (block.trim().startsWith('- ') || block.trim().startsWith('* ')) {
          const items = block.split('\n').map(line => line.replace(/^[-*] /, '').trim());
          return (
            <ul key={index} className="list-disc pl-6 space-y-2 text-ancient-200">
              {items.map((item, i) => <li key={i}>{parseInline(item)}</li>)}
            </ul>
          );
        }

        // Numbered lists
        if (/^\d+\./.test(block.trim())) {
             const items = block.split('\n');
             return (
                 <ol key={index} className="list-decimal pl-6 space-y-2 text-ancient-200">
                     {items.map((item, i) => <li key={i}>{parseInline(item.replace(/^\d+\.\s*/, ''))}</li>)}
                 </ol>
             )
        }

        // Standard Paragraph
        return <p key={index} className="opacity-90">{parseInline(block)}</p>;
      })}
    </div>
  );
};

// Simple inline parser for bold and italic
const parseInline = (text: string): React.ReactNode => {
  if (!text) return null;
  
  // Split by bold (**text**)
  const parts = text.split(/(\*\*.*?\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-amber-200 font-semibold">{part.slice(2, -2)}</strong>;
    }
    // Simple italic handling inside non-bold parts
    const italicParts = part.split(/(\*.*?\*)/g);
    return italicParts.map((subPart, j) => {
        if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2) {
            return <em key={`${i}-${j}`} className="italic text-ancient-300">{subPart.slice(1, -1)}</em>;
        }
        return subPart;
    })
  });
};

export default MarkdownRenderer;