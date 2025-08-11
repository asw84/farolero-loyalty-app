const axios = require('axios');

const VK_API = 'https://api.vk.com/method';
const v = '5.131';
const groupId = Number(process.env.VK_GROUP_ID);
const token = process.env.VK_GROUP_TOKEN;

// подписка на сообщество
async function isMember(userId) {
  try {
    const { data } = await axios.get(`${VK_API}/groups.isMember`, {
      params: { group_id: groupId, user_id: userId, access_token: token, v }
    });
    return data?.response === 1;
  } catch (error) {
    console.error('Error checking group membership:', error.response?.data || error.message);
    return false;
  }
}

// лайк на пост сообщества
async function hasLikedPost(userId, ownerId, itemId) {
  try {
    const { data } = await axios.get(`${VK_API}/likes.isLiked`, {
      params: { user_id: userId, type: 'post', owner_id: ownerId, item_id: itemId, access_token: token, v }
    });
    return data?.response?.liked === 1;
  } catch (error) {
    console.error('Error checking post like:', error.response?.data || error.message);
    return false;
  }
}

// комментарий к посту
async function hasCommentedPost(userId, ownerId, postId) {
  try {
    const { data } = await axios.get(`${VK_API}/wall.getComments`, {
      params: { owner_id: ownerId, post_id: postId, need_likes: 0, extended: 0, access_token: token, v }
    });
    const items = data?.response?.items || [];
    return items.some(c => c.from_id === userId);
  } catch (error) {
    console.error('Error checking post comment:', error.response?.data || error.message);
    return false;
  }
}

// репост поста
async function hasReposted(userId, ownerId, postId) {
  try {
    const { data } = await axios.get(`${VK_API}/wall.getReposts`, {
      params: { owner_id: ownerId, post_id: postId, access_token: token, v }
    });
    const profiles = data?.response?.profiles || [];
    return profiles.some(p => p.id === userId);
  } catch (error) {
    console.error('Error checking post repost:', error.response?.data || error.message);
    return false;
  }
}

module.exports = { isMember, hasLikedPost, hasCommentedPost, hasReposted };
