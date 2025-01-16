// utils.js
const moment = require('moment');
// 定义一个函数来构建查询条件
function buildQueryConditions(query) {
    const conditions = {};
    if (query.title) {
        conditions.title = query.title.toString().toLowerCase();
    }
    if (query.categories) {
        conditions.categories = query.categories.toString().toLowerCase().split(',');
    }
    if (query.tags) {
        conditions.tags = query.tags.toString().toLowerCase().split(',');
    }
    return conditions;
}

// 定义一个函数来过滤文章列表
function filterPosts(posts, conditions) {
    return posts.filter((post) => {
        if (conditions.title && !post.title.toLowerCase().includes(conditions.title)) {
            return false;
        }
        if (
            conditions.categories &&
            !conditions.categories.every((cat) => post.categories.includes(cat))
        ) {
            return false;
        }
        if (conditions.tags && !conditions.tags.every((tag) => post.tags.includes(tag))) {
            return false;
        }
        return true;
    });
}

// 构建文章内容
function buildArticleContent({ title, date, categories, tags, content }) {
    const formattedDate = moment(date).format('YYYY-MM-DD HH:mm:ss');
    return `---
title: ${title}
date: ${formattedDate}
categories: [${categories || []}]
tags: [${tags || []}]
---

${content}
`;
}

// 验证请求数据
function validateArticleData(reqBody) {
    if (!reqBody.title || !reqBody.content) {
        return { isValid: false, error: '标题和内容是必填项' };
    }
    return { isValid: true };
}

module.exports = {
    buildQueryConditions,
    filterPosts,
    buildArticleContent,
    validateArticleData,
};
