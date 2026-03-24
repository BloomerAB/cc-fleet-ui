import { useState } from "react"
import type { Question } from "@bloomerab/cc-fleet-types"

interface QuestionDialogProps {
  readonly questions: readonly Question[]
  readonly onAnswer: (answers: Record<string, string>) => void
}

const QuestionDialog = ({ questions, onAnswer }: QuestionDialogProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAnswer(answers)
  }

  const updateAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          Claude needs your input
        </h3>
        <form onSubmit={handleSubmit}>
          {questions.map((q) => (
            <div key={q.id} className="mb-4">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {q.question}
              </label>
              {q.options && q.options.length > 0 ? (
                <div className="space-y-2">
                  {q.options.map((opt) => (
                    <label
                      key={opt.value}
                      className="flex items-center gap-2 rounded-lg border p-3 hover:bg-gray-50"
                    >
                      <input
                        type="radio"
                        name={q.id}
                        value={opt.value}
                        checked={answers[q.id] === opt.value}
                        onChange={() => updateAnswer(q.id, opt.value)}
                        className="h-4 w-4 text-blue-600"
                      />
                      <span className="text-sm text-gray-900">{opt.label}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[q.id] ?? q.defaultAnswer ?? ""}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  placeholder="Type your answer..."
                />
              )}
            </div>
          ))}
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Submit Answer
          </button>
        </form>
      </div>
    </div>
  )
}

export { QuestionDialog }
