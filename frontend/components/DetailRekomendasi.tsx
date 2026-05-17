"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { useUser } from "@/context/UserContext"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useQuery } from "@tanstack/react-query"
import { RotateCcw } from "lucide-react"

type SensorData = {
  temp: number | null
  moist: number | null
  ph: number | null
  ec: number | null
}

type Props = {
  open: boolean
  onClose: () => void
  sensorData?: SensorData
}

export default function DetailRekomendasi({ open, onClose, sensorData }: Props) {
  const router = useRouter()
  const { lat, lon, isLoading: isUserLoading } = useUser()

  const { data: insight, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['insight', lat, lon],
    queryFn: async () => {
      const res = await fetch("/api/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: `Berdasarkan data saat ini, berikan analisis singkat dan rekomendasi.`,
          lat,
          lon
        })
      })
      const data = await res.json()
      if (data.status === "ok") {
        return data.answer
      }
      throw new Error("Gagal memuat rekomendasi AI.")
    },
    enabled: open && !isUserLoading && lat !== null && lon !== null,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
  })

  if (!open) return null

  const handleTanyaAI = () => {
    if (insight && !isLoading && !isFetching) {
      localStorage.setItem("chatInsight", insight)
      router.push("/chat")
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-100 rounded-2xl p-4 w-full max-w-[500px] max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Image src="/images/rekomendasi.svg" alt="insight" width={24} height={24} />
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Insight & Rekomendasi AI
              <button 
                onClick={() => refetch()} 
                disabled={isFetching}
                className="p-1 rounded hover:bg-gray-200 text-gray-500 transition-colors disabled:opacity-50"
                title="Muat ulang insight"
              >
                <RotateCcw size={14} className={isFetching ? "animate-spin" : ""} />
              </button>
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-white rounded-md flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm font-bold shadow-sm"
          >
            ✕
          </button>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm min-h-[150px] flex flex-col justify-center">
          {isLoading || isFetching ? (
            <div className="flex flex-col items-center justify-center py-8 text-primary">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mb-3"></div>
              <p className="text-sm font-medium animate-pulse">Memuat Analisis AI...</p>
            </div>
          ) : !insight ? (
            <div className="flex flex-col items-center justify-center py-6">
              <p className="text-sm text-gray-500 mb-4 text-center">
                Gagal mendapatkan insight. Silakan coba lagi.
              </p>
              <button
                onClick={() => refetch()}
                className="bg-primary text-white py-2 px-6 rounded-lg text-sm font-semibold hover:bg-[#8A205F] transition-colors shadow-md"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="text-gray-700 text-sm leading-relaxed prose prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{insight}</ReactMarkdown>
            </div>
          )}
        </div>

        {insight && !isLoading && !isFetching && (
          <button
            onClick={handleTanyaAI}
            className="mt-4 w-full bg-primary text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#8A205F] transition-colors shadow-md"
          >
            Lanjutkan Diskusi di Chat
          </button>
        )}
      </div>
    </div>
  )
}
