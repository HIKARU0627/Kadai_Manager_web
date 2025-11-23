"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  saveTactCookie,
  getTactCookie,
  deleteTactCookie,
  syncTactData,
} from "@/app/actions/tact"
import {
  CheckCircle2,
  AlertCircle,
  Cloud,
  Trash2,
  RefreshCw,
  Info,
  ExternalLink,
} from "lucide-react"

interface TactSettingsProps {
  userId: string
}

export function TactSettings({ userId }: TactSettingsProps) {
  const [cookie, setCookie] = useState("")
  const [hasCookie, setHasCookie] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [syncResult, setSyncResult] = useState<{
    subjects: number
    tasks: number
    announcements: number
    courseMaterials: number
    scheduleParsed?: number
    errors: number
    totalFetched?: {
      subjects: number
      tasks: number
      announcements: number
      courseMaterials: number
    }
  } | null>(null)

  // Load cookie status on mount
  useEffect(() => {
    loadCookieStatus()
  }, [])

  const loadCookieStatus = async () => {
    const result = await getTactCookie(userId)
    if (result.success && result.data) {
      setHasCookie(result.data.hasCookie)
      setLastSyncAt(result.data.lastSyncAt ? new Date(result.data.lastSyncAt) : null)
    }
  }

  const handleSaveCookie = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await saveTactCookie(userId, cookie)
      if (result.success) {
        setSuccess("Cookieを保存しました。同期ボタンを押してデータを取得してください。")
        setHasCookie(true)
        setCookie("")
        await loadCookieStatus()
      } else {
        setError(result.error || "Cookieの保存に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCookie = async () => {
    if (!confirm("TACTのCookie設定を削除しますか？")) {
      return
    }

    setError(null)
    setSuccess(null)
    setLoading(true)

    try {
      const result = await deleteTactCookie(userId)
      if (result.success) {
        setSuccess("Cookie設定を削除しました")
        setHasCookie(false)
        setLastSyncAt(null)
        setSyncResult(null)
      } else {
        setError(result.error || "削除に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    setError(null)
    setSuccess(null)
    setSyncResult(null)
    setSyncing(true)

    try {
      const result = await syncTactData(userId)
      if (result.success && result.data) {
        setSuccess("データを同期しました")
        setSyncResult(result.data)
        await loadCookieStatus()
      } else {
        setError(result.error || "同期に失敗しました")
      }
    } catch (err) {
      setError("エラーが発生しました")
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cookie Input Section */}
      {!hasCookie && (
        <form onSubmit={handleSaveCookie} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="tactCookie" className="text-base font-medium flex items-center">
              <Cloud className="w-4 h-4 mr-2 text-teal-600" />
              TACT Cookie <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="tactCookie"
              value={cookie}
              onChange={(e) => setCookie(e.target.value)}
              placeholder="JSESSIONID=...; sakai.tabs=..."
              required
              disabled={loading}
              className="h-12 text-base border-2 focus:border-teal-500 transition-colors font-mono text-sm"
            />
            <p className="text-sm text-gray-600">
              TACTにログイン後、ブラウザの開発者ツールからCookieを取得してください
            </p>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg"
            disabled={loading}
          >
            {loading ? "保存中..." : "Cookieを保存"}
          </Button>
        </form>
      )}

      {/* Cookie Status Section */}
      {hasCookie && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center text-green-700">
              <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-medium">TACT連携が有効です</span>
            </div>
            {lastSyncAt && (
              <p className="text-sm text-green-600 mt-2 ml-7">
                最終同期: {lastSyncAt.toLocaleString("ja-JP")}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 h-12 text-base bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 shadow-lg"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "同期中..." : "今すぐ同期"}
            </Button>

            <Button
              onClick={handleDeleteCookie}
              disabled={loading}
              variant="outline"
              className="h-12 text-base border-2 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              削除
            </Button>
          </div>
        </div>
      )}

      {/* Sync Result */}
      {syncResult && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-900 mb-3 flex items-center">
            <CheckCircle2 className="w-5 h-5 mr-2" />
            同期結果
          </h4>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>科目:</span>
                <span className="font-semibold">
                  {syncResult.subjects}件
                  {syncResult.totalFetched && (
                    <span className="text-xs ml-2 text-blue-600">
                      （取得: {syncResult.totalFetched.subjects}件）
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>課題:</span>
                <span className="font-semibold">
                  {syncResult.tasks}件
                  {syncResult.totalFetched && (
                    <span className="text-xs ml-2 text-blue-600">
                      （取得: {syncResult.totalFetched.tasks}件）
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>お知らせ:</span>
                <span className="font-semibold">
                  {syncResult.announcements}件
                  {syncResult.totalFetched && (
                    <span className="text-xs ml-2 text-blue-600">
                      （取得: {syncResult.totalFetched.announcements}件）
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>授業資料:</span>
                <span className="font-semibold">
                  {syncResult.courseMaterials}件
                  {syncResult.totalFetched && (
                    <span className="text-xs ml-2 text-blue-600">
                      （取得: {syncResult.totalFetched.courseMaterials}件）
                    </span>
                  )}
                </span>
              </div>
            </div>
            {syncResult.errors > 0 && (
              <div className="pt-2 border-t border-blue-200">
                <div className="flex justify-between text-red-600">
                  <span>エラー:</span>
                  <span className="font-semibold">{syncResult.errors}件</span>
                </div>
              </div>
            )}
            {syncResult.scheduleParsed !== undefined && syncResult.scheduleParsed > 0 && (
              <div className="pt-2 border-t border-blue-200">
                <div className="flex justify-between text-green-700">
                  <span>時間割に追加:</span>
                  <span className="font-semibold">{syncResult.scheduleParsed}件</span>
                </div>
              </div>
            )}
            {syncResult.totalFetched && (
              <p className="text-xs text-blue-600 pt-2 border-t border-blue-200">
                ※ 「同期」は新規作成または更新した件数、「取得」はAPIから取得した件数です
                <br />
                提出済み課題は「完了」、締め切り過ぎの未提出課題は「時間切れ」に分類されます
                <br />
                授業名に曜日・時限の情報があれば自動的に時間割に追加されます（例: 数学A (月1)）
                <br />
                授業資料はポータルページで公開されているファイルがファイル管理に追加されます
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start text-sm text-red-600 bg-red-50 p-4 rounded-lg border border-red-200 animate-in slide-in-from-top">
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="flex items-start text-sm text-green-600 bg-green-50 p-4 rounded-lg border border-green-200 animate-in slide-in-from-top">
          <CheckCircle2 className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
          <span>{success}</span>
        </div>
      )}

      {/* How to Get Cookie Section */}
      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
        <h4 className="font-medium text-gray-800 mb-3 flex items-center">
          <Info className="w-5 h-5 mr-2 text-blue-600" />
          Cookieの取得方法
        </h4>
        <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
          <li>
            <a
              href="https://tact.ac.thers.ac.jp/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center"
            >
              TACT
              <ExternalLink className="w-3 h-3 ml-1" />
            </a>
            にログインします
          </li>
          <li>ブラウザの開発者ツールを開きます（F12キー）</li>
          <li>「Application」または「ストレージ」タブを選択</li>
          <li>「Cookies」から「https://tact.ac.thers.ac.jp」を選択</li>
          <li>
            表示されるCookieを「名前=値; 名前=値」の形式でコピー
            <br />
            <span className="text-xs text-gray-500 ml-5">
              （例: JSESSIONID=abc123; sakai.tabs=def456）
            </span>
          </li>
          <li>上記の入力欄に貼り付けて保存</li>
        </ol>
        <p className="text-xs text-gray-600 mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
          <strong>注意:</strong>{" "}
          Cookieには個人情報が含まれます。安全に管理してください。また、定期的にログアウト・ログインすることでCookieが無効になる場合があります。
        </p>
      </div>
    </div>
  )
}
