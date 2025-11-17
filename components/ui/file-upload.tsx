"use client"

import * as React from "react"
import { Upload, X, File } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface FileUploadProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  onFilesChange?: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
}

const FileUpload = React.forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      onFilesChange,
      maxFiles = 5,
      maxSize = 10,
      accept,
      ...props
    },
    ref
  ) => {
    const [files, setFiles] = React.useState<File[]>([])
    const [error, setError] = React.useState<string | null>(null)
    const inputRef = React.useRef<HTMLInputElement>(null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null)
      const selectedFiles = Array.from(e.target.files || [])

      // ファイル数チェック
      if (selectedFiles.length + files.length > maxFiles) {
        setError(`最大${maxFiles}個までファイルをアップロードできます`)
        return
      }

      // ファイルサイズチェック
      const oversizedFiles = selectedFiles.filter(
        (file) => file.size > maxSize * 1024 * 1024
      )
      if (oversizedFiles.length > 0) {
        setError(`ファイルサイズは${maxSize}MB以下にしてください`)
        return
      }

      const newFiles = [...files, ...selectedFiles]
      setFiles(newFiles)
      onFilesChange?.(newFiles)
    }

    const removeFile = (index: number) => {
      const newFiles = files.filter((_, i) => i !== index)
      setFiles(newFiles)
      onFilesChange?.(newFiles)
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
    }

    return (
      <div className={cn("space-y-4", className)}>
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition cursor-pointer"
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept={accept}
            multiple={maxFiles > 1}
            {...props}
          />
          <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-sm text-gray-600 mb-1">
            クリックしてファイルを選択、またはドラッグ&ドロップ
          </p>
          <p className="text-xs text-gray-500">
            最大{maxFiles}ファイル、各{maxSize}MBまで
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
            {error}
          </div>
        )}

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              選択されたファイル ({files.length})
            </p>
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <File className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
)

FileUpload.displayName = "FileUpload"

export { FileUpload }
