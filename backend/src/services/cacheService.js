const { getRedis } = require('../lib/redis');
const config = require('../config');

function taskListCacheKey(organizationId, assigneeId, queryHash) {
  return `tasks:list:org:${organizationId}:assignee:${assigneeId || 'all'}:${queryHash}`;
}

function assigneePattern(organizationId, assigneeId) {
  return `tasks:list:org:${organizationId}:assignee:${assigneeId}:*`;
}

function orgTaskListPattern(organizationId) {
  return `tasks:list:org:${organizationId}:*`;
}

async function getCachedTaskList(key) {
  const redis = getRedis();
  const cached = await redis.get(key);
  if (!cached) return null;
  return JSON.parse(cached);
}

async function setCachedTaskList(key, data) {
  const redis = getRedis();
  await redis.setex(key, config.cache.taskListTtlSeconds, JSON.stringify(data));
}

async function invalidateAssigneeCache(organizationId, assigneeId) {
  if (!assigneeId) return;
  const redis = getRedis();
  const pattern = assigneePattern(organizationId, assigneeId);
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

async function invalidateOrgTaskListCache(organizationId) {
  const redis = getRedis();
  const pattern = orgTaskListPattern(organizationId);
  const keys = await redis.keys(pattern);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}

async function invalidateTaskCaches(organizationId, oldAssigneeId, newAssigneeId) {
  await invalidateOrgTaskListCache(organizationId);
  if (oldAssigneeId) await invalidateAssigneeCache(organizationId, oldAssigneeId);
  if (newAssigneeId && newAssigneeId !== oldAssigneeId) {
    await invalidateAssigneeCache(organizationId, newAssigneeId);
  }
}

function hashQuery(query) {
  const crypto = require('crypto');
  const normalized = JSON.stringify({
    page: query.page,
    limit: query.limit,
    status: query.status || null,
    priority: query.priority || null,
    assignee: query.assignee || null,
    projectId: query.projectId || null,
  });
  return crypto.createHash('md5').update(normalized).digest('hex');
}

module.exports = {
  taskListCacheKey,
  getCachedTaskList,
  setCachedTaskList,
  invalidateTaskCaches,
  invalidateAssigneeCache,
  invalidateOrgTaskListCache,
  hashQuery,
};
