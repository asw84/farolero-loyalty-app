const vk = require('../services/vkService');
const { addPoints } = require('../services/loyaltyService');
const amocrm = require('../services/amocrm.service');

// Ожидаем, что в req.user уже есть contactId и vkId (после привязки)
async function verifyAndReward(req, res) {
  try {
    const { action, target, user } = req.body;
    
    const { tg_user_id } = req.user;
    const contactId = await amocrm.findByTelegramId(tg_user_id);
    const vkId = await amocrm.getCustomField(contactId, 'VK_ID_FIELD_ID');
    if (!vkId) return res.status(400).json({ error: 'vk_not_linked' });

    let ok = false;
    let actionType = '';

    switch (action) {
      case 'subscribe':
        ok = await vk.isMember(vkId);
        actionType = 'subscribe';
        if (ok) await addPoints(contactId, actionType); // +20 по ТЗ
        break;
        
      case 'like':
        // target: { ownerId: -GROUP_ID, postId: ID_ПОСТА }
        if (!target?.ownerId || !target?.postId) {
          return res.status(400).json({ error: 'invalid_target' });
        }
        ok = await vk.hasLikedPost(vkId, target.ownerId, target.postId);
        actionType = 'social_like';
        if (ok) await addPoints(contactId, actionType); // +2 по ТЗ
        break;
        
      case 'comment':
        if (!target?.ownerId || !target?.postId) {
          return res.status(400).json({ error: 'invalid_target' });
        }
        ok = await vk.hasCommentedPost(vkId, target.ownerId, target.postId);
        actionType = 'social_comment';
        if (ok) await addPoints(contactId, actionType);
        break;
        
      case 'repost':
        if (!target?.ownerId || !target?.postId) {
          return res.status(400).json({ error: 'invalid_target' });
        }
        ok = await vk.hasReposted(vkId, target.ownerId, target.postId);
        actionType = 'social_repost';
        if (ok) await addPoints(contactId, actionType);
        break;
        
      default:
        return res.status(400).json({ error: 'unknown_action' });
    }

    return res.json({ 
      ok, 
      action: actionType,
      message: ok ? 'Действие подтверждено и баллы начислены' : 'Действие не найдено'
    });
    
  } catch (error) {
    console.error('VK verification error:', error);
    return res.status(500).json({ error: 'vk_verify_failed' });
  }
}

module.exports = { verifyAndReward };
