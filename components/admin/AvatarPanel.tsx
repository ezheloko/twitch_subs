"use client"

import { useState, useEffect } from "react"
import { createPortal } from "react-dom"

interface AvatarBase {
  id: string
  imageUrl: string
}

interface Avatar {
  id: string
  username: string
  imageUrl: string
  x: number
  y: number
  width: number
  height: number
  layerIndex: number
  isLocked: boolean
  isActive: boolean
  subscriptionDate?: string | Date
  reactivationCount?: number
  createdAt?: string | Date
  userpicUrl?: string | null
}

export default function AvatarPanel({
  roomId,
  onAvatarAdded,
  existingAvatars,
  onAvatarLayerChange,
}: {
  roomId: string
  onAvatarAdded: () => void
  existingAvatars: Avatar[]
  onAvatarLayerChange?: (id: string, newLayer: number) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingAvatar, setEditingAvatar] = useState<Avatar | null>(null)
  const [avatarBases, setAvatarBases] = useState<AvatarBase[]>([])
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarBase | null>(null)
  const [username, setUsername] = useState("")
  const [subscriptionDate, setSubscriptionDate] = useState(
    new Date().toISOString().split("T")[0]
  )

  useEffect(() => {
    if (showModal || showEditModal) {
      fetchAvatarBases()
    }
  }, [showModal, showEditModal])

  // Отладка состояния модального окна
  useEffect(() => {
    console.log("AvatarPanel state:", { showEditModal, editingAvatar: editingAvatar?.id })
  }, [showEditModal, editingAvatar])

  const fetchAvatarBases = async () => {
    try {
      const response = await fetch("/api/avatar-base")
      if (response.ok) {
        const data = await response.json()
        setAvatarBases(data)
      }
    } catch (error) {
      console.error("Error fetching avatar bases:", error)
    }
  }

  const handleAddAvatar = async () => {
    if (!selectedAvatar || !username.trim()) {
      alert("Выберите аватар и введите имя пользователя")
      return
    }

    // Проверяем, есть ли уже аватар с таким username
    const existingAvatar = existingAvatars.find((a) => a.username === username.trim())
    if (existingAvatar) {
      alert(`Аватар с именем "${username}" уже существует в этой комнате`)
      return
    }

    // Получаем реальные размеры изображения
    const getImageDimensions = (url: string): Promise<{ width: number; height: number }> => {
      return new Promise((resolve) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.naturalWidth, height: img.naturalHeight })
        }
        img.onerror = () => {
          // Если не удалось загрузить, используем дефолтные размеры
          resolve({ width: 150, height: 150 })
        }
        img.src = url
      })
    }

    try {
      // Получаем размеры изображения
      const imageDimensions = await getImageDimensions(selectedAvatar.imageUrl)
      
      // Ограничиваем максимальный размер до 300px по большей стороне
      const maxSize = 300
      let width = imageDimensions.width
      let height = imageDimensions.height
      
      if (width > maxSize || height > maxSize) {
        const aspectRatio = width / height
        if (width > height) {
          width = maxSize
          height = maxSize / aspectRatio
        } else {
          height = maxSize
          width = maxSize * aspectRatio
        }
      }

      // Получаем userpic из Twitch API
      let userpicUrl: string | null = null
      try {
        const userpicResponse = await fetch(
          `/api/twitch-userpic?username=${encodeURIComponent(username.trim())}`
        )
        if (userpicResponse.ok) {
          const userpicData = await userpicResponse.json()
          userpicUrl = userpicData.userpicUrl || null
        }
      } catch (error) {
        console.error("Error fetching userpic:", error)
        // Продолжаем без userpic
      }

      const response = await fetch("/api/avatars", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          avatarBaseId: selectedAvatar.id,
          imageUrl: selectedAvatar.imageUrl,
          username: username.trim(),
          twitchUrl: `https://twitch.tv/${username.trim()}`,
          userpicUrl,
          x: 735, // Центр canvas по X (1920 / 2 - 75) для аватара
          y: 465, // Центр canvas по Y (1080 / 2 - 75) для аватара
          width: Math.round(width),
          height: Math.round(height),
          layerIndex: 0,
          createdAt: new Date(),
          subscriptionDate: new Date(subscriptionDate),
        }),
      })

      if (response.ok) {
        await onAvatarAdded()
        setShowModal(false)
        setSelectedAvatar(null)
        setUsername("")
        setSubscriptionDate(new Date().toISOString().split("T")[0])
      } else {
        const error = await response.json()
        if (error.existingAvatar) {
          const move = confirm(
            `Аватар с именем "${username}" уже существует в комнате "${error.existingAvatar.roomTitle}". Переместить его в эту комнату?`
          )
          if (move) {
            await fetch(`/api/avatars/${error.existingAvatar.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ roomId }),
            })
            await onAvatarAdded()
            setShowModal(false)
            setSelectedAvatar(null)
            setUsername("")
            setSubscriptionDate(new Date().toISOString().split("T")[0])
          }
        } else {
          alert(error.error || "Ошибка при добавлении аватара")
        }
      }
    } catch (error) {
      console.error("Error adding avatar:", error)
      alert("Ошибка при добавлении аватара")
    }
  }

  return (
    <>
      <div className="p-4 h-full flex flex-col" style={{ minHeight: 0 }}>
        <div className="flex items-center justify-between mb-2 flex-shrink-0">
          <h3 className="font-bold text-lg">Подписчики</h3>
        </div>

        {/* Кнопка добавления - перемещена наверх */}
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary btn-sm w-full mb-3 flex-shrink-0"
        >
          <span>+ Добавить нового</span>
        </button>

        {/* Список размещенных аватаров - с прокруткой */}
        <div className="flex-1 overflow-y-auto min-h-0" style={{ overflowY: 'auto' }}>
          {existingAvatars.length === 0 ? (
            <p className="text-sm text-gray-500 mb-2">Нет добавленных подписчиков</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-1.5 pb-2">
              {existingAvatars.map((avatar) => (
                <div 
                  key={avatar.id} 
                  className="p-2 bg-background-2 rounded border border-stroke-1 cursor-pointer hover:border-primary-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    console.log("Avatar clicked:", avatar.id, avatar)
                    console.log("Setting editingAvatar and showEditModal")
                    setEditingAvatar(avatar)
                    setShowEditModal(true)
                    console.log("State should be updated now")
                  }}
                >
                  <div className="w-full h-16 bg-background-1 rounded mb-1 flex items-center justify-center overflow-hidden relative">
                    <img
                      src={avatar.imageUrl}
                      alt={avatar.username}
                      className={`max-w-full max-h-full object-contain ${!avatar.isActive ? "grayscale" : ""}`}
                    />
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        if (confirm(`Удалить подписчика "${avatar.username}"?`)) {
                          try {
                            const response = await fetch(`/api/avatars/${avatar.id}`, {
                              method: "DELETE",
                            })
                            if (response.ok) {
                              await onAvatarAdded()
                            } else {
                              const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                              console.error("Failed to delete avatar:", response.status, errorData)
                              throw new Error(errorData.error || `Failed to delete avatar: ${response.statusText}`)
                            }
                          } catch (error: any) {
                            console.error("Error deleting avatar:", error)
                            alert(error.message || "Ошибка при удалении подписчика")
                          }
                        }
                      }}
                      className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs z-10"
                      title="Удалить"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-center flex-1 truncate" title={avatar.username}>
                      {avatar.username}
                    </p>
                    {onAvatarLayerChange && (
                      <div className="flex gap-0.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAvatarLayerChange(avatar.id, avatar.layerIndex - 1)
                          }}
                          className="btn btn-xs bg-gray-600 hover:bg-gray-700 text-white px-1.5 py-0.5 text-[10px]"
                          title="Уменьшить слой"
                        >
                          ↓
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onAvatarLayerChange(avatar.id, avatar.layerIndex + 1)
                          }}
                          className="btn btn-xs bg-gray-600 hover:bg-gray-700 text-white px-1.5 py-0.5 text-[10px]"
                          title="Увеличить слой"
                        >
                          ↑
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-[10px] text-center text-gray-500 mt-0.5">
                    Слой: {avatar.layerIndex}
                  </div>
                  {!avatar.isActive && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          const response = await fetch(`/api/avatars/${avatar.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              isActive: true,
                              subscriptionDate: new Date().toISOString(),
                              reactivationCount: (avatar.reactivationCount || 0) + 1,
                            }),
                          })
                          if (response.ok) {
                            await onAvatarAdded()
                          } else {
                            const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
                            console.error("Failed to reactivate avatar:", response.status, errorData)
                            alert(`Ошибка при реактивации подписчика: ${errorData.error || response.statusText}`)
                          }
                        } catch (error: any) {
                          console.error("Error reactivating avatar:", error)
                          alert(`Ошибка при реактивации подписчика: ${error.message || "Unknown error"}`)
                        }
                      }}
                      className="mt-1 w-full btn btn-sm btn-primary"
                      title="Реактивировать подписчика"
                    >
                      <span>Активировать</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Модальное окно */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50000]">
          <div className="bg-background-1 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[50001]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-xl">Добавить нового подписчика</h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setSelectedAvatar(null)
                  setUsername("")
                  setSubscriptionDate(new Date().toISOString().split("T")[0])
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Выбор аватара */}
              <div>
                <label className="block text-sm font-medium mb-2">Выберите аватар</label>
                <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-stroke-1 rounded p-2">
                  {avatarBases.map((avatar) => (
                    <div
                      key={avatar.id}
                      onClick={() => setSelectedAvatar(avatar)}
                      className={`cursor-pointer border-2 rounded p-1 transition-colors ${
                        selectedAvatar?.id === avatar.id
                          ? "border-primary-500 bg-primary-50"
                          : "border-stroke-1 hover:border-primary-300"
                      }`}
                    >
                      <div className="w-full h-20 bg-background-2 rounded flex items-center justify-center overflow-hidden">
                        <img
                          src={avatar.imageUrl}
                          alt="Avatar"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Имя пользователя */}
              <div>
                <label className="block text-sm font-medium mb-2">Имя пользователя Twitch</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="input input-base w-full"
                />
              </div>

              {/* Дата подписки */}
              <div>
                <label className="block text-sm font-medium mb-2">Дата подписки</label>
                <input
                  type="date"
                  value={subscriptionDate}
                  onChange={(e) => setSubscriptionDate(e.target.value)}
                  className="input input-base w-full"
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedAvatar(null)
                    setUsername("")
                    setSubscriptionDate(new Date().toISOString().split("T")[0])
                  }}
                  className="btn btn-base bg-background-2 border-stroke-1 text-secondary"
                >
                  <span>Отмена</span>
                </button>
                <button
                  onClick={handleAddAvatar}
                  disabled={!selectedAvatar || !username.trim()}
                  className="btn btn-primary btn-base disabled:opacity-50"
                >
                  <span>Добавить</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования - рендерим через Portal */}
      {showEditModal && editingAvatar && typeof window !== "undefined" && createPortal(
        <EditAvatarModal
          avatar={editingAvatar}
          avatarBases={avatarBases}
          onClose={() => {
            setShowEditModal(false)
            setEditingAvatar(null)
          }}
          onSave={async (updates) => {
            try {
              const response = await fetch(`/api/avatars/${editingAvatar.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updates),
              })
              if (response.ok) {
                await onAvatarAdded()
                setShowEditModal(false)
                setEditingAvatar(null)
              } else {
                const error = await response.json()
                alert(error.error || "Ошибка при обновлении подписчика")
              }
            } catch (error) {
              console.error("Error updating avatar:", error)
              alert("Ошибка при обновлении подписчика")
            }
          }}
        />,
        document.body
      )}
    </>
  )
}

function EditAvatarModal({
  avatar,
  avatarBases,
  onClose,
  onSave,
}: {
  avatar: Avatar
  avatarBases: AvatarBase[]
  onClose: () => void
  onSave: (updates: Partial<Avatar> & { avatarBaseId?: string; subscriptionDate?: Date }) => Promise<void>
}) {
  const [selectedAvatarBase, setSelectedAvatarBase] = useState<AvatarBase | null>(null)
  const [username, setUsername] = useState(avatar.username)
  const [subscriptionDate, setSubscriptionDate] = useState(
    avatar.subscriptionDate ? new Date(avatar.subscriptionDate).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]
  )

  // Инициализируем selectedAvatarBase при монтировании или изменении avatarBases
  useEffect(() => {
    if (avatarBases.length > 0) {
      const base = avatarBases.find((b) => b.imageUrl === avatar.imageUrl)
      setSelectedAvatarBase(base || avatarBases[0] || null)
    }
  }, [avatarBases, avatar.imageUrl])

  const handleSave = async () => {
    if (!username.trim()) {
      alert("Введите имя пользователя")
      return
    }

    // Получаем userpic из Twitch API, если username изменился
    let userpicUrl: string | null = avatar.userpicUrl || null
    if (username.trim() !== avatar.username) {
      try {
        const userpicResponse = await fetch(
          `/api/twitch-userpic?username=${encodeURIComponent(username.trim())}`
        )
        if (userpicResponse.ok) {
          const userpicData = await userpicResponse.json()
          userpicUrl = userpicData.userpicUrl || null
        }
      } catch (error) {
        console.error("Error fetching userpic:", error)
        // Продолжаем без обновления userpic
      }
    }

    const updates: any = {
      username: username.trim(),
      twitchUrl: `https://twitch.tv/${username.trim()}`,
      subscriptionDate: new Date(subscriptionDate),
      userpicUrl,
    }

    if (selectedAvatarBase && selectedAvatarBase.imageUrl !== avatar.imageUrl) {
      updates.avatarBaseId = selectedAvatarBase.id
      updates.imageUrl = selectedAvatarBase.imageUrl
    }

    await onSave(updates)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[50000]">
      <div className="bg-background-1 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto relative z-[50001]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-xl">Редактировать подписчика</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Выбор аватара */}
          <div>
            <label className="block text-sm font-medium mb-2">Выберите аватар</label>
            <div className="grid grid-cols-6 gap-2 max-h-64 overflow-y-auto border border-stroke-1 rounded p-2">
              {avatarBases.map((avatarBase) => (
                <div
                  key={avatarBase.id}
                  onClick={() => setSelectedAvatarBase(avatarBase)}
                  className={`cursor-pointer border-2 rounded p-1 transition-colors ${
                    selectedAvatarBase?.id === avatarBase.id
                      ? "border-primary-500 bg-primary-50"
                      : "border-stroke-1 hover:border-primary-300"
                  }`}
                >
                  <div className="w-full h-20 bg-background-2 rounded flex items-center justify-center overflow-hidden">
                    <img
                      src={avatarBase.imageUrl}
                      alt="Avatar"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Имя пользователя */}
          <div>
            <label className="block text-sm font-medium mb-2">Имя пользователя Twitch</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="username"
              className="input input-base w-full"
            />
          </div>

          {/* Дата подписки */}
          <div>
            <label className="block text-sm font-medium mb-2">Дата подписки</label>
            <input
              type="date"
              value={subscriptionDate}
              onChange={(e) => setSubscriptionDate(e.target.value)}
              className="input input-base w-full"
            />
          </div>

          {/* Информация о подписчике */}
          <div className="space-y-2 p-3 bg-background-2 rounded border border-stroke-1">
            {avatar.reactivationCount !== undefined && avatar.reactivationCount > 0 && (
              <div className="text-sm text-gray-600">
                Количество реактиваций: {avatar.reactivationCount}
              </div>
            )}
            <div className="text-sm text-gray-600">
              Дата последней реактивации: {
                avatar.subscriptionDate 
                  ? new Date(avatar.subscriptionDate).toLocaleDateString('ru-RU')
                  : avatar.createdAt 
                    ? new Date(avatar.createdAt).toLocaleDateString('ru-RU')
                    : 'Не указана'
              }
            </div>
            {avatar.createdAt && (
              <div className="text-sm text-gray-500">
                Дата создания аккаунта: {new Date(avatar.createdAt).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>

          {/* Кнопки действий */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={async () => {
                if (confirm("Деактивировать этого подписчика?")) {
                  try {
                    const response = await fetch(`/api/avatars/${avatar.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ isActive: false }),
                    })
                    if (response.ok) {
                      await onSave({ isActive: false })
                    } else {
                      alert("Ошибка при деактивации подписчика")
                    }
                  } catch (error) {
                    console.error("Error deactivating avatar:", error)
                    alert("Ошибка при деактивации подписчика")
                  }
                }
              }}
              className="btn btn-base bg-yellow-600 border-yellow-700 text-white hover:bg-yellow-700"
            >
              <span>Деактивировать</span>
            </button>
            <button
              onClick={async () => {
                if (confirm("Обновить подписку? Это сбросит отсчет месяца и увеличит счетчик реактиваций.")) {
                  try {
                    const response = await fetch(`/api/avatars/${avatar.id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        subscriptionDate: new Date(),
                        reactivationCount: (avatar.reactivationCount || 0) + 1,
                        isActive: true,
                      }),
                    })
                    if (response.ok) {
                      await onSave({
                        subscriptionDate: new Date(),
                        reactivationCount: (avatar.reactivationCount || 0) + 1,
                        isActive: true,
                      })
                    } else {
                      alert("Ошибка при обновлении подписки")
                    }
                  } catch (error) {
                    console.error("Error updating subscription:", error)
                    alert("Ошибка при обновлении подписки")
                  }
                }
              }}
              className="btn btn-base bg-green-600 border-green-700 text-white hover:bg-green-700"
            >
              <span>Обновить подписку</span>
            </button>
          </div>

          {/* Кнопки сохранения и отмены */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="btn btn-base bg-background-2 border-stroke-1 text-secondary"
            >
              <span>Отмена</span>
            </button>
            <button
              onClick={handleSave}
              disabled={!selectedAvatarBase || !username.trim()}
              className="btn btn-primary btn-base disabled:opacity-50"
            >
              <span>Сохранить</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
