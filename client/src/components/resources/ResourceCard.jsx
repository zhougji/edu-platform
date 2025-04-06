import React from 'react';
import { Link } from 'react-router-dom';

const ResourceCard = ({ resource }) => {
    const getResourceTypeIcon = (type) => {
        switch (type) {
            case 'video':
                return 'fas fa-play-circle';
            case 'document':
                return 'fas fa-file-alt';
            case 'article':
                return 'fas fa-newspaper';
            case 'exercise':
                return 'fas fa-tasks';
            default:
                return 'fas fa-file';
        }
    };

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

    // 格式化日期
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="resource-card">
            <Link to={`/student/resources/${resource._id}`} className="resource-link">
                <div className="resource-thumbnail">
                    {resource.thumbnailUrl ? (
                        <img src={resource.thumbnailUrl} alt={resource.title} />
                    ) : (
                        <div className="resource-thumbnail-placeholder">
                            <i className={getResourceTypeIcon(resource.type)}></i>
                        </div>
                    )}
                    <div className="resource-type-badge">
                        <i className={getResourceTypeIcon(resource.type)}></i>
                        {getResourceTypeName(resource.type)}
                    </div>
                </div>

                <div className="resource-info">
                    <h3 className="resource-title">{resource.title}</h3>

                    <div className="resource-meta">
                        <span className="resource-subject">{resource.subject}</span>
                        <span className="resource-grade">{resource.grade}</span>
                    </div>

                    <p className="resource-description">{resource.description}</p>

                    <div className="resource-footer">
                        <div className="resource-stats">
                            <span className="resource-views">
                                <i className="fas fa-eye"></i> {resource.views}
                            </span>
                            <span className="resource-likes">
                                <i className="fas fa-heart"></i> {resource.likes}
                            </span>
                        </div>

                        <div className="resource-author">
                            <img
                                src={resource.author.avatar || '/images/default-avatar.jpg'}
                                alt={resource.author.name}
                                className="author-avatar"
                            />
                            <span className="author-name">{resource.author.name}</span>
                        </div>

                        <div className="resource-date">
                            {formatDate(resource.createdAt)}
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
};

export default ResourceCard; 