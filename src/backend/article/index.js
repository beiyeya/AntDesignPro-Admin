const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const moment = require('moment');
const articleUtils = require('../../utils/articleUtils'); // 导入工具函数
const app = express();
const relativePath = '../../../../hexoBlog/source/_posts';
const PORT = 3000;
const postsDir = path.join(__dirname, relativePath);
app.use(express.json());

// 启用 CORS---app.use(
app.use(cors({
    origin: 'http://localhost:8000', // 允许的前端域名
    credentials: true, // 允许携带凭证
}));
// API：获取文章列表
app.get('/api/posts', (req, res) => {
    console.log('获取文章列表:查询参数：', req.query);
    const files = fs.readdirSync(postsDir);
    const posts = files.map((file) => {
        const filePath = path.join(postsDir, file);
        const fileContent = fs.readFileSync(filePath, 'utf8');
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
    });

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
});
// API：删除文章
app.delete('/api/posts/:id', async (req, res) => {
    const postId = req.params.id; // 从路由参数中获取文章 ID
    console.log('删除文章id:', postId);
    if (!postId) {
        return res.status(400).json({ error: '文章 ID 未提供' });
    }
    const filePath = path.join(postsDir, postId);
    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文章不存在' });
    }
    // 删除文件
    try {
        fs.unlinkSync(filePath);
        res.status(200).json({ message: '文章删除成功' });
    } catch (error) {
        console.error('删除文章时发生错误:', error);
        res.status(500).json({ error: '删除文章失败' });
    }
});
// API：修改文章
app.put('/api/posts/:id', (req, res) => {
    const postId = req.params.id; // 从路由参数中获取文章 ID
    const { title, content, categories, tags, date } = req.body;
    console.log('修改文章id:', postId, '数据:', req.body);

    // 验证请求数据
    if (!title || !content) {
        return res.status(400).json({ error: '标题和内容是必填项' });
    }
    const filePath = path.join(postsDir, postId);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: '文章不存在' });
    }
    // 构建文章内容
    const fileContent = articleUtils.buildArticleContent({ title, date, categories, tags, content });

    // 写入文件
    try {
        fs.writeFileSync(filePath, fileContent, 'utf8');
        res.status(200).json({ message: '文章修改成功' });
    } catch (error) {
        console.error('修改文章时发生错误:', error);
        res.status(500).json({ error: '修改文章失败' });
    }
});
// API：新增文章
app.post('/api/posts', (req, res) => {
    const { title, content, categories, tags, date } = req.body;
    console.log('新增文章:', req.body);
    // 验证请求数据
    const validationResult = articleUtils.validateArticleData(req.body);
    if (!validationResult.isValid) {
        return res.status(400).json({ error: validationResult.error });
    }
    // 生成文章 ID
    const postId = `${title}-${Date.now()}`; // 示例：使用标题和时间戳生成 ID
    const filePath = path.join(postsDir, `${postId}.md`);
    // 检查文件是否已存在
    if (fs.existsSync(filePath)) {
        return res.status(409).json({ error: '文章已存在' });
    }
    const fileContent = articleUtils.buildArticleContent({ title, date, categories, tags, content });

    // 写入文件
    try {
        fs.writeFileSync(filePath, fileContent, 'utf8');
        res.status(201).json({ message: '文章创建成功', id: postId });
    } catch (error) {
        console.error(`创建文章时发生错误: ${error}`);
        res.status(500).json({ error: '创建文章失败' });
    }
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
