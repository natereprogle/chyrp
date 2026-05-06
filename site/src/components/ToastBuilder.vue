<script setup lang="ts">
import { computed, ref } from 'vue'
import CodeBlock from '@/components/CodeBlock.vue'
import { chyrp, type ToastAction, type ToastOptions, type ToastPosition, type ToastStyle } from 'chyrp'

type ToggleChoice = '' | 'true' | 'false'
type StyleChoice = '' | ToastStyle
type PositionChoice = '' | ToastPosition
type SoundChoice =
  | 'default'
  | 'true'
  | 'false'
  | 'gentle'
  | 'alert'
  | 'success'
  | 'error'
  | 'url'
  | 'notes'
type IconChoice = 'default' | 'hide' | 'text'

const builderTitle = ref('Saved')
const builderBody = ref('Your changes are live.')
const builderStyle = ref<StyleChoice>('info')
const builderTimeout = ref('4000')
const builderPersistent = ref<ToggleChoice>('')
const builderDebounce = ref('')
const builderSwipe = ref<ToggleChoice>('')
const builderPauseOnHover = ref<ToggleChoice>('')
const builderPosition = ref<PositionChoice>('')
const builderChannel = ref('')
const builderIconMode = ref<IconChoice>('default')
const builderIconText = ref('')
const builderSound = ref<SoundChoice>('default')
const builderSoundUrl = ref('')
const builderSoundNotes = ref('')
const builderResound = ref<ToggleChoice>('')
const builderMax = ref('')
const builderValue = ref('')
const builderActions = ref('')

const parseOptionalNumber = (
  value: string | number | null | undefined,
  field: string,
  errors: string[],
): number | undefined => {
  const trimmed = typeof value === 'string' ? value.trim() : value == null ? '' : String(value).trim()
  if (!trimmed) return undefined
  const n = Number(trimmed)
  if (!Number.isFinite(n)) {
    errors.push(`${field} must be a valid number`)
    return undefined
  }
  if (n < 0) {
    errors.push(`${field} must be zero or greater`)
    return undefined
  }
  return n
}

const parseToggle = (value: ToggleChoice): boolean | undefined => {
  if (value === '') return undefined
  return value === 'true'
}

const toCodeLiteral = (value: unknown): string => {
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (value === null) return 'null'
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => `  ${toCodeLiteral(v)}`)
    return `[
${items.join(',\n')}
]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    if (entries.length === 0) return '{}'
    const props = entries.map(([k, v]) => `  ${k}: ${toCodeLiteral(v)}`)
    return `{
${props.join(',\n')}
}`
  }
  return 'undefined'
}

const buildFromBuilder = (): { options: ToastOptions; code: string; errors: string[] } => {
  const errors: string[] = []
  const options: ToastOptions = {}

  if (builderTitle.value.trim()) options.title = builderTitle.value.trim()
  if (builderBody.value.trim()) options.body = builderBody.value.trim()
  if (builderStyle.value) options.style = builderStyle.value

  const timeout = parseOptionalNumber(builderTimeout.value, 'timeout', errors)
  if (timeout !== undefined) options.timeout = timeout

  const persistent = parseToggle(builderPersistent.value)
  if (persistent !== undefined) options.persistent = persistent

  const debounce = parseOptionalNumber(builderDebounce.value, 'debounce', errors)
  if (debounce !== undefined) options.debounce = debounce

  const swipe = parseToggle(builderSwipe.value)
  if (swipe !== undefined) options.swipe = swipe

  const pauseOnHover = parseToggle(builderPauseOnHover.value)
  if (pauseOnHover !== undefined) options.pauseOnHover = pauseOnHover

  if (builderPosition.value) options.position = builderPosition.value
  if (builderChannel.value.trim()) options.channel = builderChannel.value.trim()

  if (builderIconMode.value === 'hide') options.icon = false
  if (builderIconMode.value === 'text') options.icon = builderIconText.value

  if (builderSound.value === 'true') options.sound = true
  else if (builderSound.value === 'false') options.sound = false
  else if (
    builderSound.value === 'gentle' ||
    builderSound.value === 'alert' ||
    builderSound.value === 'success' ||
    builderSound.value === 'error'
  ) {
    options.sound = builderSound.value
  } else if (builderSound.value === 'url') {
    if (!builderSoundUrl.value.trim()) errors.push('sound URL must be provided when sound mode is URL')
    else options.sound = builderSoundUrl.value.trim()
  } else if (builderSound.value === 'notes') {
    if (!builderSoundNotes.value.trim()) {
      errors.push('sound notes JSON must be provided when sound mode is notes')
    } else {
      try {
        const parsed = JSON.parse(builderSoundNotes.value)
        if (!Array.isArray(parsed)) {
          errors.push('sound notes JSON must be an array of note objects')
        } else {
          options.sound = parsed as ToastOptions['sound']
        }
      } catch {
        errors.push('sound notes JSON is invalid')
      }
    }
  }

  const resound = parseToggle(builderResound.value)
  if (resound !== undefined) options.resound = resound

  const max = parseOptionalNumber(builderMax.value, 'max', errors)
  if (max !== undefined) options.max = max

  const value = parseOptionalNumber(builderValue.value, 'value', errors)
  if (value !== undefined) options.value = value

  if (builderActions.value.trim()) {
    try {
      const parsed = JSON.parse(builderActions.value)
      if (!Array.isArray(parsed)) {
        errors.push('actions JSON must be an array')
      } else {
        options.actions = parsed as ToastAction[]
      }
    } catch {
      errors.push('actions JSON is invalid')
    }
  }

  const entries = Object.entries(options)
  const code =
    entries.length === 0
      ? 'chyrp({});'
      : `chyrp({\n${entries.map(([k, v]) => `  ${k}: ${toCodeLiteral(v)},`).join('\n')}\n});`

  return { options, code, errors }
}

const builderCode = computed(() => buildFromBuilder().code)

const runBuilder = () => {
  const built = buildFromBuilder()
  if (built.errors.length > 0) {
    chyrp.error('Toast builder has invalid fields', {
      body: built.errors[0],
      title: 'Fix builder input',
    })
    return
  }
  chyrp(built.options)
}
</script>

<template>
  <div class="preview-builder">
    <div class="builder-grid">
      <label>
        Title
        <input v-model="builderTitle" type="text" placeholder="Saved" />
      </label>
      <label>
        Body
        <input v-model="builderBody" type="text" placeholder="Your changes are live." />
      </label>
      <label>
        Style
        <select v-model="builderStyle">
          <option value="">(omit)</option>
          <option value="info">info</option>
          <option value="warning">warning</option>
          <option value="error">error</option>
          <option value="loading">loading</option>
        </select>
      </label>
      <label>
        Timeout (ms)
        <input v-model="builderTimeout" type="number" placeholder="4000" />
      </label>
      <label>
        Persistent
        <select v-model="builderPersistent">
          <option value="">(omit)</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
      <label>
        Debounce (ms)
        <input v-model="builderDebounce" type="number" placeholder="100" />
      </label>
      <label>
        Swipe
        <select v-model="builderSwipe">
          <option value="">(omit)</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
      <label>
        Pause on hover
        <select v-model="builderPauseOnHover">
          <option value="">(omit)</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
      <label>
        Position
        <select v-model="builderPosition">
          <option value="">(omit)</option>
          <option value="top-right">top-right</option>
          <option value="top-left">top-left</option>
          <option value="top-center">top-center</option>
          <option value="bottom-right">bottom-right</option>
          <option value="bottom-left">bottom-left</option>
          <option value="bottom-center">bottom-center</option>
        </select>
      </label>
      <label>
        Channel
        <input v-model="builderChannel" type="text" placeholder="network" />
      </label>
      <label>
        Icon mode
        <select v-model="builderIconMode">
          <option value="default">default</option>
          <option value="hide">false (hide)</option>
          <option value="text">text/emoji</option>
        </select>
      </label>
      <label v-if="builderIconMode === 'text'">
        Icon text
        <input v-model="builderIconText" type="text" placeholder="🎉" />
      </label>
      <label>
        Sound
        <select v-model="builderSound">
          <option value="default">(omit)</option>
          <option value="true">true</option>
          <option value="false">false</option>
          <option value="gentle">gentle</option>
          <option value="alert">alert</option>
          <option value="success">success</option>
          <option value="error">error</option>
          <option value="url">custom URL</option>
          <option value="notes">custom notes JSON</option>
        </select>
      </label>
      <label v-if="builderSound === 'url'" class="builder-span-2">
        Sound URL
        <input v-model="builderSoundUrl" type="text" placeholder="/ding.mp3" />
      </label>
      <label v-if="builderSound === 'notes'" class="builder-span-2">
        Sound notes JSON (ChimeNote[])
        <textarea
          v-model="builderSoundNotes"
          rows="4"
          placeholder='[{"frequency":880,"startOffset":0,"duration":0.1,"amplitude":0.2}]'
        />
      </label>
      <label>
        Resound
        <select v-model="builderResound">
          <option value="">(omit)</option>
          <option value="true">true</option>
          <option value="false">false</option>
        </select>
      </label>
      <label>
        Max (loading)
        <input v-model="builderMax" type="number" placeholder="100" />
      </label>
      <label>
        Value (loading)
        <input v-model="builderValue" type="number" placeholder="0" />
      </label>
      <label class="builder-span-2">
        Actions JSON (ToastAction[])
        <textarea v-model="builderActions" rows="4" placeholder='[{"label":"Undo","style":"primary"}]' />
      </label>
    </div>
    <CodeBlock :code="builderCode" />
    <button type="button" class="btn btn-primary" @click="runBuilder">
      Run example ▶
    </button>
  </div>
</template>

<style scoped>
.preview-builder {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.preview-builder :deep(pre.code) {
  margin: 0;
}
.builder-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.builder-grid label {
  font-size: 13px;
  color: var(--muted);
  font-weight: 500;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.builder-grid input,
.builder-grid select,
.builder-grid textarea {
  font: inherit;
  font-size: 13px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: white;
  color: var(--text);
}
.builder-grid textarea {
  resize: vertical;
  min-height: 84px;
}
.builder-grid input:focus,
.builder-grid select:focus,
.builder-grid textarea:focus {
  outline: 2px solid var(--accent);
  outline-offset: 0;
  border-color: var(--accent);
}
.builder-span-2 {
  grid-column: 1 / -1;
}
@media (max-width: 900px) {
  .builder-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .builder-span-2 {
    grid-column: auto;
  }
}
@media (prefers-color-scheme: dark) {
  :global(html:not(.light)) .builder-grid input,
  :global(html:not(.light)) .builder-grid select,
  :global(html:not(.light)) .builder-grid textarea {
    background: var(--bg);
    color: var(--text);
  }
}
:global(html.dark) .builder-grid input,
:global(html.dark) .builder-grid select,
:global(html.dark) .builder-grid textarea {
  background: var(--bg);
  color: var(--text);
}
</style>
