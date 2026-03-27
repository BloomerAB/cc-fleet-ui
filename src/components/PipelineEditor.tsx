import { useEffect, useState, useCallback } from "react"
import { api } from "../lib/api-client.js"
import type { PipelineDefinition, StageDefinition } from "../types/index.js"

interface EditableStage {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly systemPromptAppend: string
  readonly permissionMode: string
  readonly transition: "auto" | "manual"
  readonly maxTurns: string
}

interface EditablePipeline {
  readonly id: string
  readonly name: string
  readonly description: string
  readonly stages: readonly EditableStage[]
}

const emptyStage: EditableStage = {
  id: "",
  name: "",
  description: "",
  systemPromptAppend: "",
  permissionMode: "acceptEdits",
  transition: "auto",
  maxTurns: "",
}

const emptyPipeline: EditablePipeline = {
  id: "",
  name: "",
  description: "",
  stages: [{ ...emptyStage }],
}

const toEditable = (p: PipelineDefinition): EditablePipeline => ({
  id: p.id,
  name: p.name,
  description: p.description,
  stages: p.stages.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    systemPromptAppend: s.systemPromptAppend ?? "",
    permissionMode: s.permissionMode,
    transition: s.transition,
    maxTurns: s.maxTurns ? String(s.maxTurns) : "",
  })),
})

const toDefinition = (p: EditablePipeline): PipelineDefinition => ({
  id: p.id,
  name: p.name,
  description: p.description,
  stages: p.stages.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    systemPromptAppend: s.systemPromptAppend,
    permissionMode: s.permissionMode,
    transition: s.transition,
    ...(s.maxTurns ? { maxTurns: parseInt(s.maxTurns, 10) } : {}),
  })),
})

const updateStage = (
  pipeline: EditablePipeline,
  stageIndex: number,
  field: keyof EditableStage,
  value: string,
): EditablePipeline => ({
  ...pipeline,
  stages: pipeline.stages.map((s, i) =>
    i === stageIndex ? { ...s, [field]: value } : s,
  ),
})

const addStage = (pipeline: EditablePipeline): EditablePipeline => ({
  ...pipeline,
  stages: [...pipeline.stages, { ...emptyStage }],
})

const removeStage = (pipeline: EditablePipeline, index: number): EditablePipeline => ({
  ...pipeline,
  stages: pipeline.stages.filter((_, i) => i !== index),
})

const moveStage = (pipeline: EditablePipeline, from: number, to: number): EditablePipeline => {
  if (to < 0 || to >= pipeline.stages.length) return pipeline
  const stages = [...pipeline.stages]
  const [moved] = stages.splice(from, 1)
  stages.splice(to, 0, moved)
  return { ...pipeline, stages }
}

interface PipelineEditorProps {
  readonly onMessage: (msg: { type: "success" | "error"; text: string }) => void
}

const inputClass = "w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-claude focus:outline-none"
const selectClass = "rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 focus:border-claude focus:outline-none"
const btnPrimary = "rounded-lg bg-claude px-4 py-2 text-sm font-medium text-white hover:bg-claude-dark disabled:bg-gray-700 disabled:text-gray-500"
const btnSecondary = "rounded-lg border border-gray-700 px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
const btnDanger = "text-xs text-red-400 hover:text-red-300"

const PipelineEditor = ({ onMessage }: PipelineEditorProps) => {
  const [customPipelines, setCustomPipelines] = useState<readonly PipelineDefinition[]>([])
  const [editing, setEditing] = useState<EditablePipeline | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadingPipelines, setLoadingPipelines] = useState(true)

  const loadPipelines = useCallback(async () => {
    try {
      const res = await api.listPipelines()
      if (res.success && res.data) {
        // Default pipelines have IDs like "default", "simple" — they come from JSON files.
        // Custom pipelines are user-created. We identify them by checking if they appear
        // after the defaults. The API returns defaults first, then custom.
        // We store the full list and let the user manage only their custom ones.
        // For now, we fetch all and mark those not in the known defaults.
        const knownDefaults = new Set(["default", "simple"])
        const custom = res.data.filter((p) => !knownDefaults.has(p.id))
        setCustomPipelines(custom)
      }
    } catch {
      // Best effort
    } finally {
      setLoadingPipelines(false)
    }
  }, [])

  useEffect(() => {
    loadPipelines()
  }, [loadPipelines])

  const handleNew = () => {
    setEditing({ ...emptyPipeline })
    setIsNew(true)
  }

  const handleEdit = (pipeline: PipelineDefinition) => {
    setEditing(toEditable(pipeline))
    setIsNew(false)
  }

  const handleCancel = () => {
    setEditing(null)
    setIsNew(false)
  }

  const handleSave = async () => {
    if (!editing) return
    if (!editing.id.trim() || !editing.name.trim() || editing.stages.length === 0) {
      onMessage({ type: "error", text: "Pipeline requires an ID, name, and at least one stage." })
      return
    }

    for (const stage of editing.stages) {
      if (!stage.id.trim() || !stage.name.trim()) {
        onMessage({ type: "error", text: "Each stage requires an ID and name." })
        return
      }
    }

    setSaving(true)
    try {
      const definition = toDefinition(editing)
      await api.createPipeline(definition)
      onMessage({ type: "success", text: `Pipeline "${definition.name}" saved.` })
      setEditing(null)
      setIsNew(false)
      await loadPipelines()
    } catch (err) {
      onMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to save pipeline" })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    setSaving(true)
    try {
      await api.deletePipeline(id)
      onMessage({ type: "success", text: "Pipeline deleted." })
      if (editing?.id === id) {
        setEditing(null)
        setIsNew(false)
      }
      await loadPipelines()
    } catch (err) {
      onMessage({ type: "error", text: err instanceof Error ? err.message : "Failed to delete pipeline" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-1 text-sm font-semibold text-gray-100">Custom Pipelines</h2>
      <p className="mb-4 text-xs text-gray-500">
        Create pipelines with custom stages. They appear alongside the defaults in the task form.
      </p>

      {/* List existing custom pipelines */}
      {loadingPipelines ? (
        <p className="text-xs text-gray-500">Loading pipelines...</p>
      ) : (
        <>
          {customPipelines.length > 0 && (
            <div className="mb-4 space-y-2">
              {customPipelines.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-gray-700 bg-gray-800 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-100">{p.name}</p>
                    <p className="text-xs text-gray-500">
                      {p.stages.length} stage{p.stages.length !== 1 ? "s" : ""} &middot; {p.id}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => handleEdit(p)} className={btnSecondary}>
                      Edit
                    </button>
                    <button onClick={() => handleDelete(p.id)} disabled={saving} className={btnDanger}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {customPipelines.length === 0 && !editing && (
            <p className="mb-4 text-xs text-gray-500">No custom pipelines yet.</p>
          )}
        </>
      )}

      {/* New Pipeline button */}
      {!editing && (
        <button onClick={handleNew} className={btnSecondary}>
          + New Pipeline
        </button>
      )}

      {/* Pipeline editor form */}
      {editing && (
        <div className="mt-4 space-y-4 rounded-lg border border-gray-700 bg-gray-800/50 p-4">
          <h3 className="text-sm font-medium text-gray-200">
            {isNew ? "New Pipeline" : `Edit: ${editing.name || "Untitled"}`}
          </h3>

          {/* Pipeline fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">ID</label>
              <input
                type="text"
                value={editing.id}
                onChange={(e) => setEditing({ ...editing, id: e.target.value })}
                placeholder="my-pipeline"
                disabled={!isNew}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Name</label>
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                placeholder="My Pipeline"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Description</label>
            <input
              type="text"
              value={editing.description}
              onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              placeholder="What this pipeline does"
              className={inputClass}
            />
          </div>

          {/* Stages */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-medium text-gray-300">Stages</label>
              <button
                onClick={() => setEditing(addStage(editing))}
                className={btnSecondary}
              >
                + Add Stage
              </button>
            </div>

            <div className="space-y-3">
              {editing.stages.map((stage, idx) => (
                <div key={idx} className="rounded-lg border border-gray-700 bg-gray-800 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">Stage {idx + 1}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditing(moveStage(editing, idx, idx - 1))}
                        disabled={idx === 0}
                        className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-30"
                        title="Move up"
                      >
                        &#9650;
                      </button>
                      <button
                        onClick={() => setEditing(moveStage(editing, idx, idx + 1))}
                        disabled={idx === editing.stages.length - 1}
                        className="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-30"
                        title="Move down"
                      >
                        &#9660;
                      </button>
                      {editing.stages.length > 1 && (
                        <button
                          onClick={() => setEditing(removeStage(editing, idx))}
                          className={btnDanger}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">ID</label>
                      <input
                        type="text"
                        value={stage.id}
                        onChange={(e) => setEditing(updateStage(editing, idx, "id", e.target.value))}
                        placeholder="stage-id"
                        className={inputClass}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Name</label>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => setEditing(updateStage(editing, idx, "name", e.target.value))}
                        placeholder="Stage Name"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">Description</label>
                    <input
                      type="text"
                      value={stage.description}
                      onChange={(e) => setEditing(updateStage(editing, idx, "description", e.target.value))}
                      placeholder="What this stage does"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs text-gray-500">System Prompt Append</label>
                    <textarea
                      value={stage.systemPromptAppend}
                      onChange={(e) => setEditing(updateStage(editing, idx, "systemPromptAppend", e.target.value))}
                      placeholder="Additional instructions for this stage..."
                      rows={3}
                      className={`${inputClass} font-mono`}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Permission Mode</label>
                      <select
                        value={stage.permissionMode}
                        onChange={(e) => setEditing(updateStage(editing, idx, "permissionMode", e.target.value))}
                        className={selectClass}
                      >
                        <option value="plan">Plan</option>
                        <option value="acceptEdits">Accept Edits</option>
                        <option value="bypassPermissions">Bypass</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Transition</label>
                      <select
                        value={stage.transition}
                        onChange={(e) => setEditing(updateStage(editing, idx, "transition", e.target.value as "auto" | "manual"))}
                        className={selectClass}
                      >
                        <option value="auto">Auto</option>
                        <option value="manual">Manual</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-gray-500">Max Turns</label>
                      <input
                        type="number"
                        value={stage.maxTurns}
                        onChange={(e) => setEditing(updateStage(editing, idx, "maxTurns", e.target.value))}
                        placeholder="(optional)"
                        min={1}
                        max={500}
                        className={inputClass}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save / Cancel */}
          <div className="flex items-center gap-3">
            <button onClick={handleSave} disabled={saving} className={btnPrimary}>
              {saving ? "Saving..." : "Save Pipeline"}
            </button>
            <button onClick={handleCancel} className={btnSecondary}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export { PipelineEditor }
