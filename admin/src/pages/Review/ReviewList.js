import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Space, Tag, Modal, 
  Input, Select, Form, message 
} from 'antd';
import { 
  CheckCircleOutlined, 
  CloseCircleOutlined, 
  DeleteOutlined, 
  SearchOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { getTravelNotes, approveTravelNote, rejectTravelNote, deleteTravelNote } from '../../api/travelNote';
import { isAdmin } from '../../utils/auth';
import './ReviewList.css';

const { Option } = Select;
const { TextArea } = Input;

// 游记状态
const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

// 状态对应标签
const StatusTag = ({ status }) => {
  switch (status) {
    case STATUS.PENDING:
      return <Tag color="warning">待审核</Tag>;
    case STATUS.APPROVED:
      return <Tag color="success">已通过</Tag>;
    case STATUS.REJECTED:
      return <Tag color="error">未通过</Tag>;
    default:
      return null;
  }
};

const ReviewList = () => {
  const [travelNotes, setTravelNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ status: 'all', keyword: '' });
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [currentNote, setCurrentNote] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [actionType, setActionType] = useState('');
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10, total: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isUserAdmin = isAdmin();
  
  // 获取游记列表数据
  useEffect(() => {
    fetchTravelNotes();
  }, [filters, pagination.current, pagination.pageSize]);
  
  const fetchTravelNotes = async () => {
    setLoading(true);
    try {
      // 调用API获取真实数据
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        status: filters.status !== 'all' ? filters.status : '',
        keyword: filters.keyword
      };
      
      const response = await getTravelNotes(params);
      
      if (response.success) {
        setTravelNotes(response.data);
        setPagination({
          ...pagination,
          total: response.total
        });
      } else {
        message.error(response.message || '获取游记列表失败');
        // 如果获取失败，保持当前数据不变
        setTravelNotes([]);
      }
    } catch (error) {
      console.error('获取游记列表失败:', error);
      message.error('获取游记列表失败，请稍后重试');
      // 如果发生错误，保持当前数据不变
      setTravelNotes([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 处理审核通过
  const handleApprove = async (record) => {
    try {
      // 调用API
      const response = await approveTravelNote(record.id);
      
      if (response.success) {
        // 刷新列表
        fetchTravelNotes();
        message.success('游记审核通过');
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };
  
  // 显示拒绝对话框
  const showRejectModal = (record) => {
    setCurrentNote(record);
    setRejectReason('');
    setRejectModalVisible(true);
  };
  
  // 处理拒绝提交
  const handleRejectSubmit = async () => {
    if (!rejectReason.trim()) {
      message.error('请输入拒绝原因');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 调用API
      const response = await rejectTravelNote(currentNote.id, rejectReason);
      
      if (response.success) {
        setRejectModalVisible(false);
        // 刷新列表
        fetchTravelNotes();
        message.success('游记审核已拒绝');
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // 显示删除确认对话框
  const showDeleteConfirm = (record) => {
    setCurrentNote(record);
    setActionType('delete');
    setConfirmModalVisible(true);
  };
  
  // 显示审核通过确认对话框
  const showApproveConfirm = (record) => {
    setCurrentNote(record);
    setActionType('approve');
    setConfirmModalVisible(true);
  };
  
  // 处理确认操作
  const handleConfirmAction = () => {
    if (actionType === 'delete') {
      handleDelete();
    } else if (actionType === 'approve') {
      handleApprove(currentNote);
    }
    setConfirmModalVisible(false);
  };
  
  // 处理删除
  const handleDelete = async () => {
    try {
      // 调用API
      const response = await deleteTravelNote(currentNote.id);
      
      if (response.success) {
        // 刷新列表
        fetchTravelNotes();
        message.success('游记已删除');
      } else {
        message.error(response.message || '操作失败');
      }
    } catch (error) {
      console.error('操作失败:', error);
      message.error('操作失败');
    }
  };
  
  // 显示游记详情
  const showDetailModal = (record) => {
    setCurrentNote(record);
    setDetailModalVisible(true);
  };
  
  const getConfirmMessage = () => {
    if (actionType === 'delete') {
      return '确定要删除这篇游记吗？删除后将无法恢复。';
    } else if (actionType === 'approve') {
      return '确定要通过这篇游记的审核吗？';
    }
    return '';
  };
  
  return (
    <Card title="游记审核列表" className="review-list-card">
      <div className="filter-container">
        <div className="search-container">
          <Input 
            placeholder="搜索游记标题或作者" 
            prefix={<SearchOutlined />} 
            allowClear
            value={filters.keyword}
            onChange={e => setFilters({ ...filters, keyword: e.target.value })}
            onPressEnter={() => fetchTravelNotes()}
          />
        </div>
        <div className="status-filter">
          <Select
            defaultValue="all"
            value={filters.status}
            onChange={value => setFilters({ ...filters, status: value })}
            style={{ width: 120 }}
          >
            <Option value="all">全部状态</Option>
            <Option value={STATUS.PENDING}>待审核</Option>
            <Option value={STATUS.APPROVED}>已通过</Option>
            <Option value={STATUS.REJECTED}>未通过</Option>
          </Select>
        </div>
      </div>
      
      <Table
        rowKey="_id"
        dataSource={travelNotes}
        columns={[
          {
            title: '游记标题',
            dataIndex: 'title',
            key: 'title',
            render: (text, record) => (
              <a onClick={() => showDetailModal(record)}>{text}</a>
            ),
          },
          {
            title: '作者',
            dataIndex: 'author',
            key: 'author',
            render: (author) => author?.nickname || '未知用户',
          },
          {
            title: '预览图',
            dataIndex: 'images',
            key: 'images',
            render: (images) => (
              <div className="image-preview">
                {images && images.length > 0 && (
                  <img 
                    src={`/api/${images[0]}`} 
                    alt="预览图" 
                    style={{ width: 80, height: 60, objectFit: 'cover' }} 
                  />
                )}
              </div>
            ),
          },
          {
            title: '发布时间',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text) => new Date(text).toLocaleString(),
          },
          {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => <StatusTag status={status} />,
          },
          {
            title: '操作',
            key: 'action',
            render: (_, record) => (
              <Space size="middle">
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={() => showDetailModal(record)}
                >
                  查看
                </Button>
                
                {record.status === STATUS.PENDING && (
                  <>
                    <Button 
                      type="link" 
                      icon={<CheckCircleOutlined />} 
                      style={{ color: 'green' }}
                      onClick={() => showApproveConfirm(record)}
                    >
                      通过
                    </Button>
                    <Button 
                      type="link" 
                      icon={<CloseCircleOutlined />} 
                      style={{ color: 'red' }}
                      onClick={() => showRejectModal(record)}
                    >
                      拒绝
                    </Button>
                  </>
                )}
                
                {isUserAdmin && (
                  <Button 
                    type="link" 
                    icon={<DeleteOutlined />} 
                    danger
                    onClick={() => showDeleteConfirm(record)}
                  >
                    删除
                  </Button>
                )}
              </Space>
            ),
          },
        ]}
        loading={loading}
        pagination={{
          current: pagination.current,
          pageSize: pagination.pageSize,
          total: pagination.total,
          showTotal: (total) => `共 ${total} 条记录`,
          onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
        }}
      />
      
      <Modal
        title="拒绝原因"
        open={rejectModalVisible}
        onOk={handleRejectSubmit}
        onCancel={() => setRejectModalVisible(false)}
        confirmLoading={isSubmitting}
      >
        <Form>
          <Form.Item label="拒绝原因" rules={[{ required: true, message: '请输入拒绝原因' }]}>
            <TextArea
              rows={4}
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="请输入拒绝原因，将显示给用户"
              maxLength={200}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
      
      <Modal
        title="游记详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={800}
      >
        {currentNote && (
          <div className="travel-detail">
            <h2>{currentNote.title}</h2>
            <div className="travel-meta">
              <span>作者：{currentNote.author?.nickname || '未知用户'}</span>
              <span>发布时间：{new Date(currentNote.createdAt).toLocaleString()}</span>
              <StatusTag status={currentNote.status} />
            </div>
            
            {currentNote.rejectReason && (
              <div className="reject-reason">
                <h4>拒绝原因：</h4>
                <p>{currentNote.rejectReason}</p>
              </div>
            )}
            
            <div className="travel-content">
              <div className="travel-images">
                {currentNote.video && (
                  <div className="travel-video">
                    <video 
                      controls 
                      src={`/api/${currentNote.video}`}
                      style={{ maxWidth: '100%', maxHeight: '400px' }}
                    />
                  </div>
                )}
                
                {currentNote.images && currentNote.images.length > 0 && (
                  <div className="image-gallery">
                    {currentNote.images.map((image, index) => (
                      <div className="gallery-item" key={index}>
                        <img 
                          src={`/api/${image}`} 
                          alt={`图片 ${index + 1}`} 
                          style={{ maxWidth: '100%', maxHeight: '200px' }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="travel-text">
                <p>{currentNote.content}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
      
      <Modal
        title="确认操作"
        open={confirmModalVisible}
        onOk={handleConfirmAction}
        onCancel={() => setConfirmModalVisible(false)}
      >
        <p>{getConfirmMessage()}</p>
      </Modal>
    </Card>
  );
};

export default ReviewList; 