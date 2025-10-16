interface FormNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit?: () => void;
  canGoNext: boolean;
  isLastStep: boolean;
}

export default function FormNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSubmit,
  canGoNext,
  isLastStep,
}: FormNavigationProps) {
  return (
    <div className="flex justify-between mt-8 pt-6 border-t">
      <button
        type="button"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>

      {!isLastStep ? (
        <button
          type="button"
          onClick={onNext}
          disabled={!canGoNext}
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canGoNext}
          className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Review & Submit
        </button>
      )}
    </div>
  );
}

