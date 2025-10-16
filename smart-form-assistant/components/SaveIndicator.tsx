interface SaveIndicatorProps {
  isSaving: boolean;
}

export default function SaveIndicator({ isSaving }: SaveIndicatorProps) {
  return (
    <div className="fixed top-4 right-4 z-50">
      {isSaving ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Saving...</span>
        </div>
      ) : (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          <span className="text-sm font-medium">Saved</span>
        </div>
      )}
    </div>
  );
}

