interface ErrorLike {
  code?: string
  details?: string
  hint?: string
  message?: string
  status?: number
}

function isErrorLike(error: unknown): error is ErrorLike {
  return typeof error === 'object' && error !== null
}

export function handleSupabaseError(
  error: unknown,
  fallbackMessage = 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
) {
  if (!isErrorLike(error)) {
    return fallbackMessage
  }

  const message = String(error.message ?? '')
  const normalizedMessage = message.toLowerCase()

  if (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('abort')
  ) {
    return 'Không kết nối được Supabase. Kiểm tra mạng rồi thử lại.'
  }

  if (normalizedMessage.includes('admin key hash is not configured')) {
    return 'Supabase chưa cấu hình admin key hash.'
  }

  if (
    normalizedMessage.includes('invalid or expired session') ||
    normalizedMessage.includes('session token is required')
  ) {
    return 'Phiên quản trị đã hết hạn. Vui lòng đăng nhập lại.'
  }

  if (
    normalizedMessage.includes('invalid admin key') ||
    normalizedMessage.includes('invalid login')
  ) {
    return 'Admin key không đúng. Kiểm tra lại key và thử lại.'
  }

  if (normalizedMessage.includes('display name is required')) {
    return 'Tên người chơi là bắt buộc.'
  }

  if (normalizedMessage.includes('slug is required')) {
    return 'Slug là bắt buộc.'
  }

  if (normalizedMessage.includes('slug must use lowercase')) {
    return 'Slug chỉ dùng chữ thường, số và dấu gạch ngang.'
  }

  if (
    normalizedMessage.includes('players_slug_key') ||
    normalizedMessage.includes('duplicate key')
  ) {
    return 'Slug này đã được dùng cho người chơi khác.'
  }

  if (normalizedMessage.includes('player not found')) {
    return 'Không tìm thấy người chơi cần cập nhật.'
  }

  if (normalizedMessage.includes('payload must be a json object')) {
    return 'Payload tạo trận không hợp lệ.'
  }

  if (normalizedMessage.includes('invalid game_type')) {
    return 'Loại game không hợp lệ. Chỉ hỗ trợ TFT hoặc BILLIARD.'
  }

  if (normalizedMessage.includes('participants must not contain duplicate players')) {
    return 'Danh sách người chơi không được trùng.'
  }

  if (normalizedMessage.includes('all participants must be active players')) {
    return 'Tất cả người chơi trong trận phải đang hoạt động.'
  }

  if (normalizedMessage.includes('tft matches require 3 or 4 participants')) {
    return 'TFT chỉ hỗ trợ trận 3 hoặc 4 người.'
  }

  if (
    normalizedMessage.includes('tft participants require placement') ||
    normalizedMessage.includes('tft placements must be unique')
  ) {
    return 'Top TFT phải nằm trong 1-8 và không được trùng.'
  }

  if (normalizedMessage.includes('total net_amount must equal 0')) {
    return 'Tổng tiền của trận phải bằng 0 trước khi lưu.'
  }

  if (normalizedMessage.includes('void reason is required')) {
    return 'Cần nhập lý do hủy trận.'
  }

  if (normalizedMessage.includes('match not found')) {
    return 'Không tìm thấy trận.'
  }

  if (normalizedMessage.includes('only completed matches can be voided')) {
    return 'Chỉ có thể hủy trận đang ở trạng thái completed. Trận đã void không thể hủy lần nữa.'
  }

  if (normalizedMessage.includes('original match ledger lines not found')) {
    return 'Không tìm thấy bút toán gốc của trận để đảo.'
  }

  if (error.code === '28000') {
    return 'Phiên hoặc admin key không hợp lệ. Vui lòng đăng nhập lại.'
  }

  if (error.status === 401 || error.status === 403) {
    return 'Bạn không có quyền thực hiện thao tác này.'
  }

  return fallbackMessage
}
