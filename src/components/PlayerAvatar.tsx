import { cn } from '@/lib/utils'

interface PlayerAvatarProps {
  avatarUrl: string | null
  displayName: string
  className?: string
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  return initials || '?'
}

export function PlayerAvatar({
  avatarUrl,
  displayName,
  className,
}: PlayerAvatarProps) {
  return (
    <div
      className={cn(
        'flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-emerald-50 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-100',
        className,
      )}
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
