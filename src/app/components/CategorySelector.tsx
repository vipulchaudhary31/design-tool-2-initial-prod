import { ChevronDown } from 'lucide-react';

interface CategorySelectorProps {
  primaryCategory: string;
  secondaryCategory: string;
  onPrimaryCategoryChange: (category: string) => void;
  onSecondaryCategoryChange: (category: string) => void;
}

const PRIMARY_CATEGORIES = ['Quotes', 'Wishes', 'Devotional', 'Festival', 'Events'];

const SECONDARY_CATEGORIES: Record<string, string[]> = {
  'Quotes': [
    'Motivational',
    'Inspirational',
    'Life',
    'Success',
    'Hard Work',
    'Positive Thinking',
    'Self-Love',
    'Confidence',
    'Leadership',
    'Discipline',
    'Happiness',
    'Relationship',
    'Love & Romance',
    'Heartbreak',
    'Friendship',
    'Family',
    'Karma',
    'Morning',
    'Night'
  ],
  'Wishes': ['Birthday', 'Anniversary', 'Wedding'],
  'Devotional': ['God'],
  'Festival': ['Diwali', 'Holi', 'Dussehra', 'Navratri', 'Ganesh Chaturthi'],
  'Events': []
};

export function CategorySelector({
  primaryCategory,
  secondaryCategory,
  onPrimaryCategoryChange,
  onSecondaryCategoryChange
}: CategorySelectorProps) {
  const secondaryOptions = primaryCategory ? SECONDARY_CATEGORIES[primaryCategory] || [] : [];

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPrimary = e.target.value;
    onPrimaryCategoryChange(newPrimary);
    // Reset secondary when primary changes
    onSecondaryCategoryChange('');
  };

  return (
    <div className="space-y-4">
      {/* Primary Category */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Primary Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={primaryCategory}
            onChange={handlePrimaryChange}
            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-lg appearance-none bg-white text-gray-900 font-medium focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-all cursor-pointer hover:border-gray-300"
          >
            <option value="">Select primary category</option>
            {PRIMARY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* Secondary Category */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 mb-2">
          Secondary Category <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <select
            value={secondaryCategory}
            onChange={(e) => onSecondaryCategoryChange(e.target.value)}
            disabled={!primaryCategory || secondaryOptions.length === 0}
            className={`w-full px-3 py-2.5 text-sm border-2 rounded-lg appearance-none bg-white text-gray-900 font-medium focus:outline-none transition-all ${
              !primaryCategory || secondaryOptions.length === 0
                ? 'border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed'
                : 'border-gray-200 cursor-pointer hover:border-gray-300 focus:border-amber-400 focus:ring-2 focus:ring-amber-100'
            }`}
          >
            <option value="">
              {!primaryCategory 
                ? 'Select primary category first' 
                : secondaryOptions.length === 0 
                ? 'No secondary categories available' 
                : 'Select secondary category'}
            </option>
            {secondaryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
            !primaryCategory || secondaryOptions.length === 0 ? 'text-gray-300' : 'text-gray-500'
          }`} />
        </div>
      </div>

      {primaryCategory && secondaryCategory && (
        <div className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-xs">
              <p className="font-semibold text-amber-900">Selected:</p>
              <p className="text-amber-800 mt-0.5">{primaryCategory} → {secondaryCategory}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
