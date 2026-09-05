import React from 'react';

const Select = React.forwardRef(({ className = '', options = [], error, ...props }, ref) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <select
        className={`flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? "border-destructive focus-visible:ring-destructive" : ""
        } ${className}`}
        ref={ref}
        {...props}
      >
        <option value="" disabled>Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <span className="text-sm font-medium text-destructive">{error.message || error}</span>}
    </div>
  );
});
Select.displayName = "Select";

export { Select };
