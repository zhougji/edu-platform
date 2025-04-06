import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getResources } from '../../services/resourceService';

const RelatedResources = ({ currentResourceId, subject, grade }) => {
    const [relatedResources, setRelatedResources] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRelatedResources = async () => {
            try {
                setLoading(true);
                // 获取同一学科和年级的其他资源
                const result = await getResources({
                    subject,
                    grade,
                    limit: 4 // 限制为4个相关资源
                });

                // 过滤掉当前资源
                const filtered = result.data.filter(r => r._id !== currentResourceId);

                setRelatedResources(filtered);
                setLoading(false);
            } catch (error) {
                setError('加载相关资源失败');
                setLoading(false);
                console.error('加载相关资源错误:', error);
            }
        };

        if (subject && grade) {
            fetchRelatedResources();
        }
    }, [currentResourceId, subject, grade]);

    if (loading) {
        return <div className="related-resources-loading">加载中...</div>;
    }

    if (error) {
        return <div className="related-resources-error">{error}</div>;
    }

    if (relatedResources.length === 0) {
        return <div className="no-related-resources">暂无相关资源推荐</div>;
    }

    return (
        <div className="related-resources">
            <div className="related-resources-grid">
                {relatedResources.map(resource => (
                    <Link
                        to={`/student/resources/${resource._id}`}
                        key={resource._id}
                        className="related-resource-card"
                    >
                        <div className="related-resource-thumbnail">
                            {resource.thumbnailUrl ? (
                                <img src={resource.thumbnailUrl} alt={resource.title} />
                            ) : (
                                <div className="thumbnail-placeholder">
                                    {resource.type === 'video' && <i className="fas fa-play-circle"></i>}
                                    {resource.type === 'document' && <i className="fas fa-file-alt"></i>}
                                    {resource.type === 'article' && <i className="fas fa-newspaper"></i>}
                                    {resource.type === 'exercise' && <i className="fas fa-tasks"></i>}
                                </div>
                            )}
                        </div>
                        <div className="related-resource-info">
                            <h4 className="related-resource-title">{resource.title}</h4>
                            <div className="related-resource-meta">
                                <span className="related-resource-views">
                                    <i className="fas fa-eye"></i> {resource.views}
                                </span>
                                <span className="related-resource-type">
                                    {resource.type === 'video' && '视频'}
                                    {resource.type === 'document' && '文档'}
                                    {resource.type === 'article' && '文章'}
                                    {resource.type === 'exercise' && '习题'}
                                </span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default RelatedResources; 