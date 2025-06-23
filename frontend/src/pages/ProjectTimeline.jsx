import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, User, FileText, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { Modal, Form, Input, DatePicker, Button, Select, Table, Pagination } from 'antd';
import { collection, addDoc, getDocs, query, orderBy, limit, startAfter } from 'firebase/firestore';
import { db } from '../firebase/config'; // Adjust path as needed
import '../styles/ProjectTimeline.css';

const { Option } = Select;

const ProjectTimeline = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  
  const pageSize = 4;

  // Sample data for initial state (replace with Firebase data)
  const sampleTasks = [
    {
      id: 1,
      employeeId: 'EMP001',
      employeeName: 'John Doe',
      taskName: 'Database Design',
      deadline: '2024-12-30',
      status: 'In Progress'
    },
    {
      id: 2,
      employeeId: 'EMP002',
      employeeName: 'Jane Smith',
      taskName: 'Frontend Development',
      deadline: '2024-12-25',
      status: 'Completed'
    },
    {
      id: 3,
      employeeId: 'EMP003',
      employeeName: 'Mike Johnson',
      taskName: 'API Integration',
      deadline: '2024-12-28',
      status: 'Pending'
    },
    {
      id: 4,
      employeeId: 'EMP004',
      employeeName: 'Sarah Wilson',
      taskName: 'Testing & QA',
      deadline: '2024-12-31',
      status: 'In Progress'
    },
    {
      id: 5,
      employeeId: 'EMP005',
      employeeName: 'David Brown',
      taskName: 'Documentation',
      deadline: '2025-01-05',
      status: 'Pending'
    }
  ];

  useEffect(() => {
    // Initialize with sample data (replace with Firebase fetch)
    setTasks(sampleTasks);
    setFilteredTasks(sampleTasks);
  }, []);

  // Filter tasks based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredTasks(tasks);
    } else {
      const filtered = tasks.filter(task =>
        task.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.taskName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.status.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredTasks(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, tasks]);

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredTasks.slice(startIndex, endIndex);
  };

  // Handle add task form submission
  const handleAddTask = async (values) => {
    setLoading(true);
    try {
      // Add to Firebase (uncomment when Firebase is set up)
      
      const docRef = await addDoc(collection(db, 'tasks'), {
        employeeId: values.employeeId,
        employeeName: values.employeeName,
        taskName: values.taskName,
        deadline: values.deadline.format('YYYY-MM-DD'),
        status: values.status,
        createdAt: new Date()
      });
      

      // For now, add to local state
      const newTask = {
        id: Date.now(),
        employeeId: values.employeeId,
        employeeName: values.employeeName,
        taskName: values.taskName,
        deadline: values.deadline.format('YYYY-MM-DD'),
        status: values.status
      };

      setTasks(prev => [...prev, newTask]);
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('Error adding task:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={16} className="status-icon completed" />;
      case 'In Progress':
        return <AlertCircle size={16} className="status-icon in-progress" />;
      case 'Pending':
        return <XCircle size={16} className="status-icon pending" />;
      default:
        return <Clock size={16} className="status-icon" />;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'Completed':
        return 'status-completed';
      case 'In Progress':
        return 'status-in-progress';
      case 'Pending':
        return 'status-pending';
      default:
        return '';
    }
  };

  return (
    <div className="project-timeline-container">
      {/* Header */}
      <div className="timeline-header">
        <div className="header-left">
          <div className="page-title">
            <Calendar size={28} className="title-icon" />
            <h1>Project Timeline</h1>
          </div>
          <p className="page-subtitle">
            Manage and track project tasks and deadlines
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="timeline-controls">
        <div className="search-section">
          <div className="search-container">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by employee name, ID, task, or status..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        <div className="action-section">
          <Button
            type="primary"
            icon={<Plus size={18} />}
            onClick={() => setIsModalVisible(true)}
            className="add-task-btn"
            size="large"
          >
            Add Task
          </Button>
        </div>
      </div>

      {/* Tasks Table */}
      <div className="timeline-table-container">
        <div className="table-wrapper">
          <table className="timeline-table">
            <thead>
              <tr>
                <th>
                  <User size={16} />
                  Employee Name
                </th>
                <th>
                  <FileText size={16} />
                  Employee ID
                </th>
                <th>
                  <FileText size={16} />
                  Task Name
                </th>
                <th>
                  <Calendar size={16} />
                  Deadline
                </th>
                <th>
                  <Clock size={16} />
                  Status
                </th>
              </tr>
            </thead>
<tbody>
  {getCurrentPageData().map((task, index) => (
    <tr 
      key={task.id} 
      className="table-row"
      style={{ animationDelay: `${0.3 + (index * 0.1)}s` }}
    >
      <td className="employee-name">
        <div className="employee-info">
          <div className="employee-avatar">
            {task.employeeName.charAt(0)}
          </div>
          <span>{task.employeeName}</span>
        </div>
      </td>
      <td className="employee-id">{task.employeeId}</td>
      <td className="task-name">{task.taskName}</td>
      <td className="deadline">
        <div className="deadline-info">
          <Calendar size={14} />
          {new Date(task.deadline).toLocaleDateString()}
        </div>
      </td>
      <td className="status">
        <div className={`status-badge ${getStatusClass(task.status)}`}>
          {getStatusIcon(task.status)}
          {task.status}
        </div>
      </td>
    </tr>
  ))}
</tbody>
          </table>

          {getCurrentPageData().length === 0 && (
            <div className="empty-state">
              <FileText size={48} className="empty-icon" />
              <h3>No tasks found</h3>
              <p>Try adjusting your search criteria or add a new task.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredTasks.length > pageSize && (
          <div className="pagination-container">
            <Pagination
              current={currentPage}
              total={filteredTasks.length}
              pageSize={pageSize}
              onChange={setCurrentPage}
              showSizeChanger={false}
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} tasks`
              }
            />
          </div>
        )}
      </div>

      {/* Add Task Modal */}
      <Modal
        title={
          <div className="modal-title">
            <Plus size={20} />
            Add New Task
          </div>
        }
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        className="add-task-modal"
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddTask}
          className="add-task-form"
        >
          <Form.Item
            name="employeeId"
            label="Employee ID"
            rules={[
              { required: true, message: 'Please enter employee ID' },
              { pattern: /^EMP\d{3}$/, message: 'Format should be EMP001' }
            ]}
          >
            <Input
              prefix={<User size={16} />}
              placeholder="e.g., EMP001"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="employeeName"
            label="Employee Name"
            rules={[{ required: true, message: 'Please enter employee name' }]}
          >
            <Input
              prefix={<User size={16} />}
              placeholder="Enter employee name"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="taskName"
            label="Task Name"
            rules={[{ required: true, message: 'Please enter task name' }]}
          >
            <Input
              prefix={<FileText size={16} />}
              placeholder="Enter task description"
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="deadline"
            label="Deadline"
            rules={[{ required: true, message: 'Please select deadline' }]}
          >
            <DatePicker
              size="large"
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
              placeholder="Select deadline"
            />
          </Form.Item>

          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: 'Please select status' }]}
          >
            <Select size="large" placeholder="Select task status">
              <Option value="Pending">Pending</Option>
              <Option value="In Progress">In Progress</Option>
              <Option value="Completed">Completed</Option>
            </Select>
          </Form.Item>

          <div className="form-actions">
            <Button
              onClick={() => {
                setIsModalVisible(false);
                form.resetFields();
              }}
              size="large"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
            >
              Add Task
            </Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectTimeline;