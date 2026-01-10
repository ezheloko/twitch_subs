"use client"

import { useState, useEffect } from "react"

interface AvatarBase {
  id: string
  imageUrl: string
  createdAt: string
}

export default function AvatarBaseManager() {
  const [avatars, setAvatars] = useState<AvatarBase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchAvatars()
  }, [])

  const fetchAvatars = async () => {
    try {
      const response = await fetch("/api/avatar-base")
      if (response.ok) {
        const data = await response.json()
        setAvatars(data)
      }
    } catch (error) {
      console.error("Error fetching avatars:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // Загружаем изображение
      const formData = new FormData()
      formData.append("file", file)
      formData.append("type", "avatar")

      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Ошибка загрузки изображения")
      }

      const { url } = await uploadResponse.json()

      // Создаем запись в базе аватаров
      const createResponse = await fetch("/api/avatar-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url }),
      })

      if (createResponse.ok) {
        await fetchAvatars()
      }
    } catch (error) {
      console.error("Error uploading avatar:", error)
      alert("Ошибка при загрузке аватара")
    } finally {
      setUploading(false)
      // Сброс input
      e.target.value = ""
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Вы уверены, что хотите удалить этот аватар из базы?")) return

    try {
      const response = await fetch(`/api/avatar-base/${id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        await fetchAvatars()
      }
    } catch (error) {
      console.error("Error deleting avatar:", error)
      alert("Ошибка при удалении аватара")
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Загрузка аватаров...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-secondary">База аватаров</h2>
        <label className="btn btn-primary btn-base cursor-pointer inline-block">
          <span>{uploading ? "Загрузка..." : "+ Загрузить аватар"}</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {avatars.map((avatar) => (
          <div
            key={avatar.id}
            className="bg-background-1 border border-stroke-1 rounded-lg overflow-hidden group"
          >
            <div className="aspect-square relative">
              <img
                src={avatar.imageUrl}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => handleDelete(avatar.id)}
                className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      {avatars.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          База аватаров пуста. Загрузите первый аватар!
        </div>
      )}
    </div>
  )
}
