"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const MDEditor = dynamic(
  () => import('@uiw/react-md-editor').then((mod) => mod.default),
  { ssr: false }
)

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  height?: number
  preview?: 'edit' | 'live' | 'preview'
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = 'マークダウンで記入してください...',
  height = 400,
  preview = 'live',
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview={preview}
        height={height}
        textareaProps={{
          placeholder,
        }}
        previewOptions={{
          rehypePlugins: [],
        }}
      />
    </div>
  )
}
