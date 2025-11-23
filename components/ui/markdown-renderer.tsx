"use client"

import React from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize from 'rehype-sanitize'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeRaw, rehypeKatex, rehypeSanitize]}
        components={{
          // カスタムスタイリング
          h1: ({ node, ...props }) => (
            <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-xl font-bold mt-5 mb-3" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-lg font-bold mt-4 mb-2" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-base font-bold mt-3 mb-2" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="my-3 leading-7" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc list-inside my-3 space-y-1" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal list-inside my-3 space-y-1" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-7" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              className="border-l-4 border-gray-300 pl-4 py-2 my-4 italic text-gray-700 bg-gray-50"
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            return inline ? (
              <code
                className="bg-gray-100 text-red-600 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            ) : (
              <code
                className="block bg-gray-900 text-gray-100 p-4 rounded-lg my-4 overflow-x-auto text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            )
          },
          pre: ({ node, ...props }) => (
            <pre className="my-4" {...props} />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-blue-600 hover:text-blue-800 underline"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-200 border" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50" {...props} />
          ),
          tbody: ({ node, ...props }) => (
            <tbody className="bg-white divide-y divide-gray-200" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr {...props} />
          ),
          th: ({ node, ...props }) => (
            <th
              className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td className="px-4 py-2 text-sm text-gray-900" {...props} />
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-6 border-t border-gray-300" {...props} />
          ),
          img: ({ node, ...props }) => (
            <img className="max-w-full h-auto rounded-lg my-4" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
