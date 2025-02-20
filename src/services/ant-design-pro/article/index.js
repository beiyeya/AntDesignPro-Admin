const express = require('express');
const cors = require('cors');
const axios = require('axios');
const matter = require('gray-matter');
const moment = require('moment');
const articleUtils = require('../../utils/articleUtils'); // 导入工具函数
const app = express();
const PORT = 3000;
const remoteBaseUrl = 'http://120.26.36.42/ArticleList/'; // 远程服务器的目录路径
app.use(express.json());

// 启用 CORS
app.use(cors({
    origin: 'http://localhost:9000', // 允许的前端域名
    credentials: true, // 允许携带凭证
}));

// API：获取文章列表
app.get('/api/posts', async (req, res) => {
    console.log('获取文章列表:查询参数：', req.query);

    try {
        // 从远程服务器获取文件列表
        const response = await axios.get(remoteBaseUrl);
        const files = response.data.match(/href="([^"]+)"/g).map(match => match.split('"')[1]);

        // 获取每个文件的内容
        const posts = await Promise.all(files.map(async (file) => {
            const fileResponse = await axios.get(`${remoteBaseUrl}${file}`);
            const fileContent = fileResponse.data;
            const { data, content } = matter(fileContent);
            const formattedDate = data.date ? moment.utc(data.date).format('YYYY-MM-DD HH:mm:ss') : '';
            return {
                id: file,
                title: data.title || '',
                date: formattedDate,
                categories: data.categories || [],
                tags: data.tags || [],
                content: content || '',
            };
        }));

        // 根据日期降序排序
        posts.sort((a, b) => {
            const dateA = moment.utc(a.date);
            const dateB = moment.utc(b.date);
            return dateB.diff(dateA);
        });

        // 构建查询条件
        const conditions = articleUtils.buildQueryConditions(req.query);
        // 过滤文章列表
        const filteredPosts = articleUtils.filterPosts(posts, conditions);
        res.json(filteredPosts);
    } catch (error) {
        console.error('获取文章列表失败:', error);
        res.status(500).json({ error: '获取文章列表失败' });
    }
});

// API：删除文章
app.delete('/api/posts/:id', async (req, res) => {
    const postId = req.params.id; // 从路由参数中获取文章 ID
    console.log('删除文章id:', postId);
    if (!postId) {
        return res.status(400).json({ error: '文章 ID 未提供' });
    }

    try {
        // 调用远程API删除文章
        await axios.delete(`${remoteBaseUrl}${postId}`);
        res.status(200).json({ message: '文章删除成功' });
    } catch (error) {
        console.error('删除文章时发生错误:', error);
        res.status(500).json({ error: '删除文章失败' });
    }
});

// API：修改文章
app.put('/api/posts/:id', async (req, res) => {
    const postId = req.params.id; // 从路由参数中获取文章 ID
    const { title, content, categories, tags, date } = req.body;
    console.log('修改文章id:', postId, '数据:', req.body);

    // 验证请求数据
    if (!title || !content) {
        return res.status(400).json({ error: '标题和内容是必填项' });
    }

    try {
        // 调用远程API修改文章
        await axios.put(`${remoteBaseUrl}${postId}`, {
            title,
            content,
            categories,
            tags,
            date: moment(date).format('YYYY-MM-DD HH:mm:ss') // 格式化日期
        });
        res.status(200).json({ message: '文章修改成功' });
    } catch (error) {
        console.error('修改文章时发生错误:', error);
        res.status(500).json({ error: '修改文章失败' });
    }
});

// API：新增文章
app.post('/api/posts', async (req, res) => {
    const { title, content, categories, tags, date } = req.body;
    console.log('新增文章:', req.body);

    // 验证请求数据
    const validationResult = articleUtils.validateArticleData(req.body);
    if (!validationResult.isValid) {
        return res.status(400).json({ error: validationResult.error });
    }

    try {
        // 调用远程API新增文章
        const response = await axios.post(remoteBaseUrl, {
            title,
            content,
            categories,
            tags,
            date: moment(date).format('YYYY-MM-DD HH:mm:ss') // 格式化日期
        });
        res.status(201).json({ message: '文章创建成功', id: response.data.id });
    } catch (error) {
        console.error('创建文章时发生错误:', error);
        res.status(500).json({ error: '创建文章失败' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});