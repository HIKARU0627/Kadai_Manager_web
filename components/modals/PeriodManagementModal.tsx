"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Plus, Trash2, Clock } from "lucide-react"
import {
  getPeriods,
  createPeriod,
  updatePeriod,
  deletePeriod,
  initializeDefaultPeriods,
} from "@/app/actions/periods"

interface PeriodManagementModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
}

interface Period {
  id: string
  periodNumber: number
  startTime: string
  endTime: string
}

export function PeriodManagementModal({
  open,
  onOpenChange,
  userId,
}: PeriodManagementModalProps) {
  const [periods, setPeriods] = useState<Period[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      loadPeriods()
    }
  }, [open])

  const loadPeriods = async () => {
    setIsLoading(true)
    try {
      const data = await getPeriods(userId)
      setPeriods(data)
    } catch (error) {
      console.error("Failed to load periods:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInitializeDefaults = async () => {
    if (
      !confirm(
        "デフォルトの時限設定（1限～5限）を作成しますか？\n既存の設定がある場合は作成されません。"
      )
    ) {
      return
    }

    setIsLoading(true)
    try {
      const result = await initializeDefaultPeriods(userId)
      if (result.success) {
        await loadPeriods()
        alert("デフォルトの時限設定を作成しました")
      } else {
        alert(result.error || result.message || "操作に失敗しました")
      }
    } catch (error) {
      console.error("Failed to initialize periods:", error)
      alert("デフォルト設定の作成に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddPeriod = async () => {
    const newPeriodNumber = periods.length > 0
      ? Math.max(...periods.map(p => p.periodNumber)) + 1
      : 1

    setIsLoading(true)
    try {
      const result = await createPeriod({
        userId,
        periodNumber: newPeriodNumber,
        startTime: "09:00",
        endTime: "10:30",
      })

      if (result.success) {
        await loadPeriods()
      } else {
        alert(result.error || "時限の追加に失敗しました")
      }
    } catch (error) {
      console.error("Failed to add period:", error)
      alert("時限の追加に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeChange = async (periodId: string, field: 'startTime' | 'endTime', value: string) => {
    // ローカルステートを即座に更新
    setPeriods(prevPeriods =>
      prevPeriods.map(p =>
        p.id === periodId ? { ...p, [field]: value } : p
      )
    )

    // サーバーに保存
    try {
      const period = periods.find(p => p.id === periodId)
      if (!period) return

      const result = await updatePeriod({
        id: periodId,
        startTime: field === 'startTime' ? value : period.startTime,
        endTime: field === 'endTime' ? value : period.endTime,
      })

      if (!result.success) {
        alert(result.error || "時限の更新に失敗しました")
        // エラーの場合は元の値に戻す
        await loadPeriods()
      }
    } catch (error) {
      console.error("Failed to update period:", error)
      alert("時限の更新に失敗しました")
      // エラーの場合は元の値に戻す
      await loadPeriods()
    }
  }

  const handleDeletePeriod = async (periodId: string, periodNumber: number) => {
    if (!confirm(`${periodNumber}限を削除しますか？`)) {
      return
    }

    setIsLoading(true)
    try {
      const result = await deletePeriod(periodId)
      if (result.success) {
        await loadPeriods()
      } else {
        alert(result.error || "時限の削除に失敗しました")
      }
    } catch (error) {
      console.error("Failed to delete period:", error)
      alert("時限の削除に失敗しました")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>時限設定</DialogTitle>
          <DialogDescription>
            授業の時限ごとの時刻を設定します。この設定は時間割表示で使用されます。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* アクションボタン */}
          <div className="flex gap-2">
            <Button
              onClick={handleInitializeDefaults}
              variant="outline"
              size="sm"
              disabled={isLoading || periods.length > 0}
            >
              <Clock className="w-4 h-4 mr-2" />
              デフォルト設定を作成
            </Button>
            <Button onClick={handleAddPeriod} size="sm" disabled={isLoading}>
              <Plus className="w-4 h-4 mr-2" />
              時限を追加
            </Button>
          </div>

          {/* 時限リスト */}
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">読み込み中...</div>
          ) : periods.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>時限設定がありません</p>
              <p className="text-sm mt-2">
                「デフォルト設定を作成」ボタンで標準的な時限設定を作成できます
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {periods.map((period) => (
                <Card key={period.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4">
                      <div className="font-semibold min-w-[60px]">
                        {period.periodNumber}限
                      </div>
                      <div className="flex-1 grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs text-gray-600">開始時刻</Label>
                          <Input
                            type="time"
                            value={period.startTime}
                            onChange={(e) =>
                              handleTimeChange(period.id, 'startTime', e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs text-gray-600">終了時刻</Label>
                          <Input
                            type="time"
                            value={period.endTime}
                            onChange={(e) =>
                              handleTimeChange(period.id, 'endTime', e.target.value)
                            }
                            className="h-9"
                          />
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          handleDeletePeriod(period.id, period.periodNumber)
                        }
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
