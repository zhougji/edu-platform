import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getResourceById } from '../../services/resourceService';
import { getCurrentUser } from '../../services/authService';
import RelatedResources from '../../components/resources/RelatedResources';

const ResourceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const currentUser = getCurrentUser();

    const [resource, setResource] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [liked, setLiked] = useState(false);

    // 加载资源详情
    useEffect(() => {
        const fetchResourceDetail = async () => {
            try {
                setLoading(true);
                const resourceData = await getResourceById(id);
                setResource(resourceData);
                setLoading(false);
            } catch (error) {
                setError(error.message || '加载资源详情失败');
                setLoading(false);
                console.error('加载资源详情错误:', error);
            }
        };

        fetchResourceDetail();
    }, [id]);

    // 点赞功能
    const handleLike = async () => {
        if (!currentUser) {
            navigate('/login', { state: { from: `/student/resources/${id}` } });
            return;
        }

        try {
            // 调用点赞API
            const response = await fetch(`/api/resources/${id}/like`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('点赞失败');
            }

            const data = await response.json();

            // 更新资源的点赞数
            setResource(prev => ({
                ...prev,
                likes: data.likes
            }));

            setLiked(true);
        } catch (error) {
            console.error('点赞错误:', error);
            // 可以显示提示消息
        }
    };

    // 格式化日期
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // 渲染资源内容
    const renderResourceContent = () => {
        if (!resource) return null;

        switch (resource.type) {
            case 'video':
                return (
                    <div className="resource-video-container">
                        {resource.fileUrl ? (
                            <video controls className="resource-video">
                                <source src={resource.fileUrl} type="video/mp4" />
                                您的浏览器不支持视频播放
                            </video>
                        ) : (
                            <div className="resource-video-placeholder">
                                <i className="fas fa-play-circle"></i>
                                <span>视频资源暂不可用</span>
                            </div>
                        )}
                    </div>
                );
            case 'document':
                return (
                    <div className="resource-document-container">
                        {resource.fileUrl ? (
                            <div className="document-viewer">
                                <iframe
                                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(resource.fileUrl)}&embedded=true`}
                                    className="document-iframe"
                                    title={resource.title}
                                ></iframe>
                            </div>
                        ) : (
                            <div className="resource-document-placeholder">
                                <i className="fas fa-file-alt"></i>
                                <span>文档资源暂不可用</span>
                            </div>
                        )}
                        {resource.fileUrl && (
                            <a href={resource.fileUrl} download className="download-button">
                                <i className="fas fa-download"></i> 下载文档
                            </a>
                        )}
                    </div>
                );
            case 'article':
                return (
                    <div className="resource-article-container">
                        <div className="article-content" dangerouslySetInnerHTML={{ __html: resource.content }}></div>
                    </div>
                );
            case 'exercise':
                return (
                    <div className="resource-exercise-container">
                        <div className="exercise-content" dangerouslySetInnerHTML={{ __html: resource.content }}></div>
                    </div>
                );
            default:
                return (
                    <div className="resource-content-placeholder">
                        <i className="fas fa-exclamation-circle"></i>
                        <span>无法显示此类型的资源</span>
                    </div>
                );
        }
    };

    // 获取资源类型名称
    const getResourceTypeName = (type) => {
        switch (type) {
            case 'video':
                return '视频';
            case 'document':
                return '文档';
            case 'article':
                return '文章';
            case 'exercise':
                return '习题';
            default:
                return '资源';
        }
    };

    if (loading) {
        return (
            <div className="resource-detail-loading">
                <i className="fas fa-spinner fa-spin"></i>
                <span>正在加载资源...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="resource-detail-error">
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
                <button onClick={() => navigate('/student/resources')} className="back-button">
                    返回资源列表
                </button>
            </div>
        );
    }

    if (!resource) {
        return (
            <div className="resource-not-found">
                <i className="fas fa-search"></i>
                <h3>未找到资源</h3>
                <p>所请求的资源不存在或已被删除</p>
                <button onClick={() => navigate('/student/resources')} className="back-button">
                    返回资源列表
                </button>
            </div>
        );
    }

    return (
        <div className="resource-detail-page">
            <div className="resource-detail-header">
                <button onClick={() => navigate(-1)} className="back-button">
                    <i className="fas fa-arrow-left"></i> 返回
                </button>

                <div className="resource-meta">
                    <span className="resource-type">
                        {getResourceTypeName(resource.type)}
                    </span>
                    <span className="resource-subject">{resource.subject}</span>
                    <span className="resource-grade">{resource.grade}</span>
                </div>
            </div>

            <div className="resource-detail-content">
                <h1 className="resource-title">{resource.title}</h1>

                <div className="resource-info">
                    <div className="resource-author">
                        <img
                            src={resource.author.avatar || '/images/default-avatar.jpg'}
                            alt={resource.author.name}
                            className="author-avatar"
                        />
                        <span className="author-name">{resource.author.name}</span>
                    </div>

                    <div className="resource-stats">
                        <span className="resource-views">
                            <i className="fas fa-eye"></i> {resource.views} 次查看
                        </span>
                        <span className="resource-likes">
                            <i className="fas fa-heart"></i> {resource.likes} 人点赞
                        </span>
                        <span className="resource-date">
                            <i className="fas fa-calendar-alt"></i> {formatDate(resource.createdAt)}
                        </span>
                    </div>

                    <div className="resource-actions">
                        <button
                            className={`like-button ${liked ? 'liked' : ''}`}
                            onClick={handleLike}
                            disabled={liked}
                        >
                            <i className={`${liked ? 'fas' : 'far'} fa-heart`}></i>
                            {liked ? '已点赞' : '点赞'}
                        </button>

                        {resource.fileUrl && (
                            <a
                                href={resource.fileUrl}
                                download
                                className="download-button"
                            >
                                <i className="fas fa-download"></i> 下载
                            </a>
                        )}
                    </div>
                </div>

                <div className="resource-description">
                    <h3>简介</h3>
                    <p>{resource.description}</p>
                </div>

                <div className="resource-content-container">
                    {renderResourceContent()}
                </div>

                {resource.tags && resource.tags.length > 0 && (
                    <div className="resource-tags">
                        <h3>标签</h3>
                        <div className="tags-container">
                            {resource.tags.map((tag, index) => (
                                <span key={index} className="tag">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="related-resources-section">
                <h2>相关资源推荐</h2>
                <RelatedResources
                    currentResourceId={resource._id}
                    subject={resource.subject}
                    grade={resource.grade}
                />
            </div>
        </div>
    );
};

export default ResourceDetail;
