"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Image from "next/image"

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  file: {
    fileName: string
    fileUrl: string
    fileType: string | null
  } | null
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  file,
}: FilePreviewDialogProps) {
  if (!file) return null

  const isImage = file.fileType?.startsWith("image/")
  const isPDF = file.fileType === "application/pdf"
  const isText = file.fileType?.startsWith("text/")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{file.fileName}</DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {isImage && file.fileUrl && (
            <div className="relative w-full h-[70vh]">
              <Image
                src={file.fileUrl}
                alt={file.fileName}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {isPDF && file.fileUrl && (
            <iframe
              src={file.fileUrl}
              className="w-full h-[70vh] border-0"
              title={file.fileName}
            />
          )}

          {!isImage && !isPDF && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                このファイル形式のプレビューはサポートされていません
              </p>
              <a
                href={file.fileUrl}
                download={file.fileName}
                className="text-blue-600 hover:underline"
              >
                ファイルをダウンロード
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
