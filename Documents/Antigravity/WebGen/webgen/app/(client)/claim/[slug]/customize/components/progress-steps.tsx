import { Check } from 'lucide-react'

interface ProgressStepsProps {
    currentStep: 1 | 2 | 3
}

const steps = [
    { label: 'Payment', number: 1 },
    { label: 'Customize', number: 2 },
    { label: 'Go Live', number: 3 },
]

export function ProgressSteps({ currentStep }: ProgressStepsProps) {
    return (
        <nav aria-label="Progress" className="w-full">
            <ol className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const isComplete = step.number < currentStep
                    const isActive = step.number === currentStep
                    const isUpcoming = step.number > currentStep
                    const isLastStep = index === steps.length - 1

                    return (
                        <li
                            key={step.number}
                            className={`flex items-center ${isLastStep ? '' : 'flex-1'}`}
                        >
                            <div className="flex flex-col items-center">
                                {/* Circle */}
                                <div
                                    className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                                    style={{
                                        backgroundColor: isComplete
                                            ? '#22C55E'
                                            : isActive
                                                ? '#2563EB'
                                                : '#E5E7EB',
                                        color: isUpcoming ? '#9CA3AF' : '#FFFFFF',
                                    }}
                                    aria-current={isActive ? 'step' : undefined}
                                >
                                    {isComplete ? (
                                        <Check className="h-4 w-4" strokeWidth={3} />
                                    ) : (
                                        step.number
                                    )}
                                </div>
                                {/* Label */}
                                <span
                                    className="mt-1.5 text-xs font-medium"
                                    style={{
                                        color: isComplete
                                            ? '#22C55E'
                                            : isActive
                                                ? '#2563EB'
                                                : '#9CA3AF',
                                    }}
                                >
                                    {step.label}
                                </span>
                            </div>

                            {/* Connecting line */}
                            {!isLastStep && (
                                <div
                                    className="mx-2 h-0.5 flex-1 self-start mt-4"
                                    style={{
                                        backgroundColor:
                                            step.number < currentStep
                                                ? '#22C55E'
                                                : '#E5E7EB',
                                    }}
                                    aria-hidden="true"
                                />
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
