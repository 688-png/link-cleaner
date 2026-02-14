
import React from 'react';
import { CleanedResult } from '../types';

interface ComparisonViewProps {
  result: CleanedResult;
}

export const ComparisonView: React.FC<ComparisonViewProps> = ({ result }) => {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Original</h4>
        <div className="p-3 bg-red-50 text-red-700 rounded-lg break-all text-sm border border-red-100">
          {result.original}
        </div>
      </div>
      <div>
        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Cleaned</h4>
        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg break-all text-sm border border-emerald-100 font-medium">
          {result.cleaned}
        </div>
      </div>
      
      {result.removedParams.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Removed Parameters ({result.removedParams.length})</h4>
          <div className="flex flex-wrap gap-2">
            {result.removedParams.map((p, idx) => (
              <span key={idx} className="px-2 py-1 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md border border-slate-300 dark:border-slate-600 line-through decoration-red-400">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
