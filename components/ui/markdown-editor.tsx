"use client"

import React from 'react'
import dynamic from 'next/dynamic'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import 'katex/dist/katex.min.css'

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
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (let i = 0; i < items.length; i++) {
      const item = items[i]

      // 画像がペーストされた場合
      if (item.type.indexOf('image') !== -1) {
        event.preventDefault()
        const file = item.getAsFile()
        if (!file) continue

        // 画像をBase64に変換
        const reader = new FileReader()
        reader.onload = (e) => {
          const base64 = e.target?.result as string
          const imageMarkdown = `\n![画像](${base64})\n`
          onChange(value + imageMarkdown)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  return (
    <div data-color-mode="light" onPaste={handlePaste}>
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || '')}
        preview={preview}
        height={height}
        textareaProps={{
          placeholder,
        }}
        previewOptions={{
          remarkPlugins: [remarkMath],
          rehypePlugins: [rehypeKatex],
        }}
      />
    </div>
  )
}
