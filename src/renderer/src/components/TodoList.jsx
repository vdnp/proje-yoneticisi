import { useState } from 'react'
import { Plus, Check, Trash, Edit, ChevronUp, ChevronDown } from './Icons.jsx'
import { cn, todoProgress } from '../lib/utils.js'
import { useI18n } from '../lib/i18n.js'
import useStore from '../store/useStore.js'

function TodoItem({ projectId, todo, isFirst, isLast }) {
  const toggleTodo = useStore((s) => s.toggleTodo)
  const removeTodo = useStore((s) => s.removeTodo)
  const updateTodo = useStore((s) => s.updateTodo)
  const moveTodo = useStore((s) => s.moveTodo)
  const { t } = useI18n()
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(todo.text)

  const commit = () => {
    const value = text.trim()
    if (value) updateTodo(projectId, todo.id, value)
    else setText(todo.text)
    setEditing(false)
  }

  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-surface-border bg-surface-bg px-3 py-2">
      <button
        onClick={() => toggleTodo(projectId, todo.id)}
        role="checkbox"
        aria-checked={todo.done}
        aria-label={todo.text}
        className={cn(
          'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition',
          todo.done
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-surface-border hover:border-brand'
        )}
      >
        {todo.done && <Check size={13} />}
      </button>

      {editing ? (
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setText(todo.text)
              setEditing(false)
            }
          }}
          className="flex-1 rounded-md border border-brand/40 bg-surface-card px-2 py-0.5 text-sm text-content-primary focus:outline-none"
        />
      ) : (
        <span
          onDoubleClick={() => setEditing(true)}
          className={cn(
            'flex-1 text-sm',
            todo.done ? 'text-content-faint line-through' : 'text-content-primary'
          )}
        >
          {todo.text}
        </span>
      )}

      <div className="flex items-center gap-0.5 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
        <button
          disabled={isFirst}
          onClick={() => moveTodo(projectId, todo.id, -1)}
          className="grid h-6 w-6 place-items-center rounded text-content-faint hover:text-content-primary disabled:opacity-20"
          title={t('todo.moveUp')}
          aria-label={t('todo.moveUp')}
        >
          <ChevronUp size={14} />
        </button>
        <button
          disabled={isLast}
          onClick={() => moveTodo(projectId, todo.id, 1)}
          className="grid h-6 w-6 place-items-center rounded text-content-faint hover:text-content-primary disabled:opacity-20"
          title={t('todo.moveDown')}
          aria-label={t('todo.moveDown')}
        >
          <ChevronDown size={14} />
        </button>
        <button
          onClick={() => setEditing(true)}
          className="grid h-6 w-6 place-items-center rounded text-content-faint hover:text-content-primary"
          title={t('common.edit')}
          aria-label={t('common.edit')}
        >
          <Edit size={13} />
        </button>
        <button
          onClick={() => removeTodo(projectId, todo.id)}
          className="grid h-6 w-6 place-items-center rounded text-content-faint hover:text-rose-400"
          title={t('common.delete')}
          aria-label={t('common.delete')}
        >
          <Trash size={13} />
        </button>
      </div>
    </div>
  )
}

export default function TodoList({ project }) {
  const addTodo = useStore((s) => s.addTodo)
  const { t } = useI18n()
  const [text, setText] = useState('')
  const todos = project.todos || []
  const { done, total } = todoProgress(project)

  const submit = (e) => {
    e.preventDefault()
    addTodo(project.id, text)
    setText('')
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-content-primary">{t('todo.title')}</h3>
        {total > 0 && (
          <span className="text-xs text-content-faint">{t('todo.progress', { done, total })}</span>
        )}
      </div>

      {total > 0 && (
        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${(done / total) * 100}%` }}
          />
        </div>
      )}

      <form onSubmit={submit} className="mb-3 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('todo.placeholder')}
          className="flex-1 rounded-xl border border-surface-border bg-surface-bg px-3 py-2 text-sm text-content-primary placeholder:text-content-faint focus:border-brand/50 focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          title={t('todo.add')}
          aria-label={t('todo.add')}
          className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-onbrand transition hover:brightness-110"
        >
          <Plus size={18} />
        </button>
      </form>

      {todos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-surface-border py-6 text-center text-xs text-content-faint">
          {t('todo.empty')}
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {todos.map((todo, i) => (
            <TodoItem
              key={todo.id}
              projectId={project.id}
              todo={todo}
              isFirst={i === 0}
              isLast={i === todos.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
