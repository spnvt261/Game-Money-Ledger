import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  avatarUrl: string | null
  displayName: string
  className?: string
}

const fallbackTones = [
  'bg-emerald-50 text-emerald-800 ring-emerald-100',
  'bg-sky-50 text-sky-800 ring-sky-100',
  'bg-amber-50 text-amber-800 ring-amber-100',
  'bg-rose-50 text-rose-800 ring-rose-100',
  'bg-violet-50 text-violet-800 ring-violet-100',
]

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || '?'
}

function getFallbackTone(name: string) {
  const codePoint = name.trim().charCodeAt(0)
  const index = Number.isFinite(codePoint) ? codePoint % fallbackTones.length : 0

  return fallbackTones[index]
}

export function PlayerAvatar({
  avatarUrl,
  displayName,
  className,
}: PlayerAvatarProps) {
  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg text-sm font-semibold ring-1',
        getFallbackTone(displayName),
        className,
      )}
      title={displayName}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        getInitials(displayName)
      )}
    </div>
  )
}
