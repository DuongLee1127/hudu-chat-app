import ConversationMember from '@/models/conversation_member';

export const getMembership = async (conversationId: string, userId: string) => {
  return ConversationMember.findOne({ conversationId, userId });
};

export const assertMember = async (conversationId: string, userId: string) => {
  const membership = await getMembership(conversationId, userId);
  if (!membership) {
    throw new Error('Bạn không phải thành viên của hội thoại này!');
  }
  return membership;
};

export const assertAdmin = async (conversationId: string, userId: string) => {
  const membership = await assertMember(conversationId, userId);
  if (membership.role !== 'admin') {
    throw new Error('Chỉ quản trị viên mới có quyền thực hiện hành động này!');
  }
  return membership;
};
