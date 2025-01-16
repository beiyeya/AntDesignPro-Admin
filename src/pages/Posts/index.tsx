import { ProTable } from '@ant-design/pro-components';
import MdEditor from '@uiw/react-md-editor'; // 导入 Markdown 编辑器
import { Button, DatePicker, Form, Input, message, Modal } from 'antd';
import axios from 'axios';
import moment from 'moment';
import React, { useState } from 'react';
import apiConfig from '../../../config/apiConfig';
import { Article } from '../../typings'; // 导入类型

const searchPosts = async (params: Article) => {
  console.log('searchPosts called with params:', params);
  try {
    const response = await axios.get(`${apiConfig.API_BASE_URL}/api/posts`, {
      params,
    });
    return {
      data: response.data,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching posts:', error);
    return {
      data: [],
      success: false,
    };
  }
};

const Posts: React.FC = () => {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [currentRecord, setCurrentRecord] = useState<Article | null>(null);
    const [form] = Form.useForm();
    const [tableVersion, setTableVersion] = useState(0); //控制表格刷新状态

    const handleEdit = (record: Article) => {
        showModal(record);
    };
    //删除功能
    const handleDelete = async (record: Article) => {
        Modal.confirm({
            title: '确认删除',
            content: `确定要删除文章 "${record.title}" 吗？`,
            okText: '确认',
            cancelText: '取消',
            onOk: async () => {
                try {
                    const response = await axios.delete(`${apiConfig.API_BASE_URL}/api/posts/${record.id}`);
                    if (response.status === 200) {
                        message.success('删除成功');
                        setTableVersion(tableVersion + 1); // 更新状态来触发 ProTable 重新渲染
                    }
                } catch (error) {
                    console.error('Error deleting post:', error);
                    Modal.error({ content: '删除失败，请稍后再试。' + error });
                }
            },
            onCancel: () => {
                console.log('Delete canceled');
            },
        });
    };

    //点击编辑弹窗等操作控制显示
    const showModal = (record?: Article) => {
        if (record?.id != undefined) {
            // 编辑操作
            form.setFieldsValue({
                title: record.title,
                date: moment(record.date),
                tags: record.tags,
                categories: record.categories,
                content: record.content,
            });
            setCurrentRecord(record);
        } else {
            // 新增操作
            form.resetFields();
            form.setFieldsValue({
                date: moment(), // 设置默认值为当前时间
            });
            setCurrentRecord(null);
        }
        setIsModalVisible(true);
    };
    const handleOk = () => {
        form
            .validateFields()
            .then((values) => {
                if (currentRecord) {
                    // 编辑操作
                    axios
                        .put(`${apiConfig.API_BASE_URL}/api/posts/${currentRecord.id}`, values)
                        .then(() => {
                            message.success('编辑成功');
                            setIsModalVisible(false);
                            setTableVersion(tableVersion + 1);
                        })
                        .catch((error) => {
                            console.error('Error updating post:', error);
                            message.error('编辑失败，请稍后再试。' + error);
                        });
                } else {
                    // 新增操作
                    axios
                        .post(`${apiConfig.API_BASE_URL}/api/posts`, values)
                        .then(() => {
                            message.success('创建成功');
                            setIsModalVisible(false);
                            setTableVersion(tableVersion + 1);
                        })
                        .catch((error) => {
                            console.error('Error creating post:', error);
                            message.error('创建失败，请稍后再试。');
                        });
                }
            })
            .catch((info) => {
                console.log('Failed:', info);
            });
    };
    const handleCancel = () => {
        setIsModalVisible(false);
        form.resetFields();
    };

    return (
        <>
            <Modal
                width="50%"
                title={currentRecord ? '编辑文章' : '新增文章'}
                visible={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <Form form={form} layout="vertical" initialValues={{ date: moment() }}>
                    <Form.Item
                        name="title"
                        label="标题"
                        rules={[{ required: true, message: '请输入文章标题!' }]}
                    >
                        <Input placeholder="请输入文章标题" />
                    </Form.Item>
                    <Form.Item
                        name="date"
                        label="发布日期"
                        rules={[{ required: true, message: '请选择发布日期!' }]}
                    >
                        <DatePicker
                            style={{ width: '100%' }}
                            format="YYYY-MM-DD HH:mm:ss"
                            placeholder="请选择发布日期"
                            defaultValue={moment()} // 设置默认值为当前时间
                        />
                    </Form.Item>
                    <Form.Item name="tags" label="标签">
                        <Input placeholder="请输入文章标签" />
                    </Form.Item>
                    <Form.Item name="categories" label="分类">
                        <Input placeholder="请输入文章分类" />
                    </Form.Item>
                    {/* Markdown 编辑器 */}
                    <Form.Item
                        name="content"
                        label="内容"
                        rules={[{ required: true, message: '请输入文章内容!' }]}
                    >
                        <MdEditor
                            onChange={(value) => {
                                form.setFieldsValue({ content: value });
                            }}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            <ProTable
                columns={[
                    {
                        title: '标题',
                        dataIndex: 'title',
                        search: true, // 允许按此字段搜索
                    },
                    {
                        title: '发布日期',
                        dataIndex: 'date',
                        valueType: 'dateTime',
                        search: false,
                    },
                    {
                        title: '分类',
                        dataIndex: 'categories',
                        search: true,
                        render: (text) => text.join(', '),
                    },
                    {
                        title: '标签',
                        dataIndex: 'tags',
                        search: true,
                        render: (text) => text.join(', '),
                    },
                    {
                        title: '操作',
                        search: false,
                        dataIndex: 'actions',
                        render: (_, record) => (
                            <>
                                <Button type="primary" onClick={() => handleEdit(record)}>
                                    编辑
                                </Button>
                                <Button
                                    type="danger"
                                    onClick={() => handleDelete(record)}
                                    style={{ marginLeft: 8 }}
                                >
                                    删除
                                </Button>
                            </>
                        ),
                    },
                ]}
                request={searchPosts}
                rowKey="id"
                search={{
                    labelWidth: 120,
                }}
                pagination={{
                    pageSize: 10,
                }}
                key={tableVersion} // 使用状态作为 key 来触发重新渲染
                dateFormatter="string"
                toolBarRender={() => [
                    <Button key="create" type="primary" onClick={showModal}>
                        新增
                    </Button>,
                ]}
            />
        </>
    );
};

export default Posts;
