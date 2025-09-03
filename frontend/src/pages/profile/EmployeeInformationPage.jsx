import React, { useState, useEffect } from 'react';
import {
  Layout,
  Breadcrumb,
  Input,
  Select,
  Row,
  Col,
  Card,
  Avatar,
  Typography,
  Tag,
  Button,
  Tooltip,
  Grid,
  Empty,
  Modal,
  Descriptions,
  Divider,
  List,
  Space
} from 'antd';
import {
  UserOutlined,
  SearchOutlined,
  FilterOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  TeamOutlined,
  LinkedinOutlined,
  GithubOutlined,
  TwitterOutlined,
  CalendarOutlined,
  BankOutlined,
  BookOutlined,
  TrophyOutlined,
  GlobalOutlined,
  ToolOutlined
} from '@ant-design/icons';
import { supabase } from '../../supabase/config';


const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const EmployeeInformationPage = () => {
  const [employees, setEmployees] = React.useState([]);
  const [employeeDocuments, setEmployeeDocuments] = React.useState({});
  const [filteredEmployees, setFilteredEmployees] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [employeeTypeFilter, setEmployeeTypeFilter] = React.useState('all');
  const [selectedEmployee, setSelectedEmployee] = React.useState(null);
  const [modalVisible, setModalVisible] = React.useState(false);
  const [documentsLoading, setDocumentsLoading] = React.useState(false);
  const screens = useBreakpoint();
  const [payrollData, setPayrollData] = useState([]);
   const [salarySlip, setSalarySlip] = useState(null);
  
  React.useEffect(() => {
  const fetchEmployees = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('*');
    if (error) {
      console.error('Error fetching employees:', error);
    } else {
      setEmployees(data);
      setFilteredEmployees(data);
      // Add this to parse documents:
      const docsMap = {};
      data.forEach(employee => {
        if (employee.documents) {
          try {
            docsMap[employee.id] = JSON.parse(employee.documents);
          } catch (e) {
            docsMap[employee.id] = [];
          }
        }
      });
      setEmployeeDocuments(docsMap);
    }
    setLoading(false);
  };

    fetchEmployees();
  }, []);


const handleViewDocument = async (employeeId, fileName) => {
  try {
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .download(`${employeeId}/${fileName}`);
    
    if (error) throw error;
    
    const url = URL.createObjectURL(data);
    window.open(url, '_blank');
  } catch (error) {
    console.error('Error downloading document:', error);
  }
};

  React.useEffect(() => {
    let filteredData = employees;

    if (searchTerm) {
      filteredData = filteredData.filter(employee =>
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (employeeTypeFilter !== 'all') {
      filteredData = filteredData.filter(employee => employee.employee_type === employeeTypeFilter);
    }

    setFilteredEmployees(filteredData);
  }, [searchTerm, employeeTypeFilter, employees]);

  const getTagColor = (employeeType) => {
    switch (employeeType) {
      case 'full-time':
        return '#0D7139';
      case 'internship':
        return '#108ee9';
      case 'temporary':
        return '#f50';
      default:
        return 'default';
    }
  };

  const truncateText = (text, maxLength) => {
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleViewProfile = async (employee) => {
  setSelectedEmployee(employee);
  setModalVisible(true);

  // Fetch documents...
  setDocumentsLoading(true);
  const docs = await fetchEmployeeDocuments(employee.employee_id);
  setEmployeeDocuments(docs);
  setDocumentsLoading(false);

  // ✅ Fetch payroll (salary)
  try {
    const { data, error } = await supabase
      .from('payroll')
      .select('final_payslips, pay_period')
      .eq('employee_id', employee.employee_id)
      .order('pay_period', { ascending: false })
      .limit(2); // current + previous month

    if (error) throw error;

    let slip = null;

    // Get current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const prevMonth = new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .slice(0, 7);

    for (let row of data) {
      if (row.final_payslips && Array.isArray(row.final_payslips)) {
        const foundCurrent = row.final_payslips.find((s) => s.month === currentMonth);
        const foundPrev = row.final_payslips.find((s) => s.month === prevMonth);
        if (foundCurrent) {
          slip = foundCurrent;
          break;
        } else if (!slip && foundPrev) {
          slip = foundPrev;
        }
      }
    }

    setSalarySlip(slip);
  } catch (err) {
    console.error("Error fetching payroll:", err);
    setSalarySlip(null);
  }
};
  const fetchEmployeeDocuments = async (employeeId) => {
  try {
    const { data, error } = await supabase.storage
      .from('employee-documents')
      .list(employeeId, {
        limit: 100,
        offset: 0
      });
    
    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
};


  const socialLinks = (employee) => (
    <div style={{ marginTop: '16px', textAlign: 'center' }}>
      {employee.linkedin_url && (
        <Tooltip title="LinkedIn">
          <a href={employee.linkedin_url} target="_blank" rel="noopener noreferrer">
            <LinkedinOutlined style={{ fontSize: '20px', color: '#0077b5', margin: '0 8px' }} />
          </a>
        </Tooltip>
      )}
      {employee.github_url && (
        <Tooltip title="GitHub">
          <a href={employee.github_url} target="_blank" rel="noopener noreferrer">
            <GithubOutlined style={{ fontSize: '20px', color: '#333', margin: '0 8px' }} />
          </a>
        </Tooltip>
      )}
      {employee.twitter_url && (
        <Tooltip title="Twitter">
          <a href={employee.twitter_url} target="_blank" rel="noopener noreferrer">
            <TwitterOutlined style={{ fontSize: '20px', color: '#1DA1F2', margin: '0 8px' }} />
          </a>
        </Tooltip>
      )}
    </div>
  );

  // Replace your renderProfileModal function with this updated version
  // Replace your existing renderProfileModal function with this updated version
  const renderProfileModal = () => {
    if (!selectedEmployee) return null;

    // -- NEW THEME & STYLES --
    const theme = {
      primary: '#0D7139',      // Main Dark Green
      accent: '#52c41a',       // Lighter Accent Green
      text: '#262626',         // Darker text for better readability
      textSecondary: '#595959',// Softer secondary text
      background: '#f7fcf8',   // Light green background to match page
      cardBg: '#ffffff',       // White
      divider: '#e8e8e8',      // Lighter divider
    };

    const isMobile = !screens.md; // Consider screens smaller than medium as mobile

    const styles = {
      modalBody: {
        padding: 0,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row', // Stack vertically on mobile
        maxHeight: isMobile ? '80vh' : '600px', // Set max height for mobile
        overflowY: isMobile ? 'auto' : 'hidden', // Allow scrolling on mobile
        backgroundColor: theme.background,
        fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif",
      },
      sidebar: {
        width: isMobile ? '100%' : '300px', // Full width on mobile
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
        borderRight: isMobile ? 'none' : `1px solid ${theme.divider}`, // No border on mobile
        borderBottom: isMobile ? `1px solid ${theme.divider}` : 'none', // Border at the bottom on mobile
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      },
      mainContent: {
        flex: 1,
        padding: '2rem',
        overflowY: isMobile ? 'visible' : 'auto', // Handle scrolling within the component
      },
      avatar: {
        width: '120px',
        height: '120px',
        border: `4px solid ${theme.primary}`,
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
        marginBottom: '1rem',
      },
      name: {
        fontSize: '1.75rem',
        fontWeight: '600',
        color: theme.primary,
        margin: '0',
      },
      role: {
        fontSize: '1rem',
        color: theme.accent,
        fontWeight: '500',
        marginBottom: '1.5rem',
      },
      sidebarSection: {
        width: '100%',
        textAlign: 'left',
        marginBottom: '1.5rem',
      },
      sidebarIcon: {
        color: theme.textSecondary,
        marginRight: '12px',
        fontSize: '16px',
      },
      contactItem: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        color: theme.text,
        wordBreak: 'break-word',
      },
      contentCard: {
        background: theme.cardBg,
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
      },
      cardTitle: {
        fontSize: '1.25rem',
        fontWeight: '600',
        color: theme.primary,
        marginBottom: '1.5rem',
        paddingBottom: '0.5rem',
        borderBottom: `2px solid ${theme.primary}`,
        display: 'inline-block',
      },
      detailItem: {
        marginBottom: '1rem',
      },
      detailLabel: {
        display: 'block',
        color: theme.textSecondary,
        fontSize: '0.875rem',
        marginBottom: '4px',
      },
      detailValue: {
        color: theme.text,
        fontWeight: '500',
        fontSize: '1rem',
      },
    };

    return (
      <Modal
        open={modalVisible}
        onCancel={() => {
    setModalVisible(false);
    setEmployeeDocuments([]); // Reset documents when closing
  }}
        width={screens.xs ? '95%' : screens.md ? 800 : 950}
        footer={null}
        closable={false} // We will use a custom close button
        centered
        styles={{ body: styles.modalBody }}
        destroyOnHidden
      >
        {/* --- SIDEBAR --- */}
        <div style={styles.sidebar}>
          <Avatar src={selectedEmployee.profileimage} style={styles.avatar} icon={<UserOutlined />} />
          <h2 style={styles.name}>{selectedEmployee.name}</h2>
          <p style={styles.role}>{selectedEmployee.role}</p>

          <div style={{...styles.sidebarSection, borderTop: `1px solid ${theme.divider}`, paddingTop: '1.5rem'}}>
            <div style={styles.contactItem}>
              <MailOutlined style={styles.sidebarIcon} />
              <Text copyable={{ text: selectedEmployee.email }} style={{ color: theme.text }}>
                {selectedEmployee.email}
              </Text>
            </div>
            
            <div style={styles.contactItem}>
              <PhoneOutlined style={styles.sidebarIcon} />
              <span>{selectedEmployee.mobile || 'N/A'}</span>
            </div>
            {selectedEmployee.address && (
              <div style={styles.contactItem}>
                <HomeOutlined style={styles.sidebarIcon} />
                <span>{selectedEmployee.address}</span>
              </div>
            )}
            
            <div>
              <Text>
                <div >
                    {salarySlip ? (
                      <p>
                      Salary: ₹{salarySlip.amount}
                      </p>
                    ) : (
                      <p>No salary</p>
                    )}
                  </div>
                </Text>
            </div>
          </div>





          {/* Social Links */}
          {(selectedEmployee.linkedin_url || selectedEmployee.github_url || selectedEmployee.twitter_url) && (
            <div style={styles.sidebarSection}>
              <Space size="large">
                {selectedEmployee.linkedin_url && (
                  <a href={selectedEmployee.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <LinkedinOutlined style={{ fontSize: '24px', color: theme.textSecondary }} />
                  </a>
                )}
                {selectedEmployee.github_url && (
                  <a href={selectedEmployee.github_url} target="_blank" rel="noopener noreferrer">
                    <GithubOutlined style={{ fontSize: '24px', color: theme.textSecondary }} />
                  </a>
                )}
                {selectedEmployee.twitter_url && (
                  <a href={selectedEmployee.twitter_url} target="_blank" rel="noopener noreferrer">
                    <TwitterOutlined style={{ fontSize: '24px', color: theme.textSecondary }} />
                  </a>
                )}
              </Space>
            </div>
          )}

          <Button
            type="primary"
            onClick={() => setModalVisible(false)}
            style={{
              background: theme.primary,
              borderColor: theme.primary,
              borderRadius: '8px',
              width: '100%',
              marginTop: isMobile ? '1rem' : 'auto', // Adjust margin for mobile
            }}
          >
            Close Profile
          </Button>
        </div>

        {/* --- MAIN CONTENT --- */}
        <div style={styles.mainContent}>
          <div style={styles.contentCard}>
            <h3 style={styles.cardTitle}>Professional Details</h3>
            <Row gutter={[32, 16]}>
              <Col xs={24} sm={12} style={styles.detailItem}>
                <span style={styles.detailLabel}>Employee ID</span>
                <span style={styles.detailValue}>{selectedEmployee.employee_id || 'N/A'}</span>
              </Col>
              <Col xs={24} sm={12} style={styles.detailItem}>
                <span style={styles.detailLabel}>Department</span>
                <span style={styles.detailValue}>{selectedEmployee.department || 'N/A'}</span>
              </Col>
              <Col xs={24} sm={12} style={styles.detailItem}>
                <span style={styles.detailLabel}>Start Date</span>
                <span style={styles.detailValue}>{formatDate(selectedEmployee.start_date)}</span>
              </Col>
              <Col xs={24} sm={12} style={styles.detailItem}>
                <span style={styles.detailLabel}>Experience</span>
                <span style={styles.detailValue}>{selectedEmployee.total_experience || 'N/A'}</span>
              </Col>
              {selectedEmployee.education && (
                <Col xs={24} style={styles.detailItem}>
                  <span style={styles.detailLabel}>Education</span>
                  <span style={styles.detailValue}>{selectedEmployee.education}</span>
                </Col>
              )}
            </Row>
          </div>

          {(selectedEmployee.technical_skills?.length > 0 || selectedEmployee.languages?.length > 0) && (
            <div style={styles.contentCard}>
              <h3 style={styles.cardTitle}>Skills & Qualifications</h3>
              {selectedEmployee.technical_skills?.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={styles.detailLabel}>Technical Skills</span>
                  <Space wrap>
                    {selectedEmployee.technical_skills.map((skill, i) => (
                      <Tag key={i} color="blue" style={{ borderRadius: '4px', fontSize: '14px', padding: '4px 8px' }}>{skill}</Tag>
                    ))}
                  </Space>
                </div>
              )}
              {selectedEmployee.languages?.length > 0 && (
                 <div>
                   <span style={styles.detailLabel}>Languages</span>
                   <Space wrap>
                     {selectedEmployee.languages.map((lang, i) => (
                       <Tag key={i} color="green" style={{ borderRadius: '4px', fontSize: '14px', padding: '4px 8px' }}>{lang}</Tag>
                     ))}
                   </Space>
                 </div>
              )}
            </div>
          )}

          {selectedEmployee.certifications?.length > 0 && (
            <div style={styles.contentCard}>
              <h3 style={styles.cardTitle}>Certifications</h3>
              {selectedEmployee.certifications.map((cert, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                  <TrophyOutlined style={{ color: theme.primary, marginRight: '8px' }} />
                  <span style={styles.detailValue}>{cert}</span>
                </div>
              ))}
            </div>
          )}

          {/* Documents Section */}
<div style={styles.contentCard}>
  <h3 style={styles.cardTitle}>Documents</h3>
  {documentsLoading ? (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <BookOutlined spin style={{ fontSize: '24px', color: theme.primary }} />
      <p style={{ marginTop: '8px', color: theme.textSecondary }}>Loading documents...</p>
    </div>
  ) : employeeDocuments.length > 0 ? (
    <List
      dataSource={employeeDocuments}
      renderItem={doc => (
        <List.Item
          actions={[
            <Button 
              type="link" 
              onClick={() => handleViewDocument(selectedEmployee.employee_id, doc.name)}
              style={{ color: theme.primary }}
            >
              View PDF
            </Button>
          ]}
        >
          <List.Item.Meta
            avatar={<BookOutlined style={{ color: theme.primary }} />}
            title={doc.name}
            description={`Size: ${(doc.metadata?.size ? (doc.metadata.size / 1024).toFixed(2) + ' KB' : 'Unknown')} • Modified: ${formatDate(doc.updated_at)}`}
          />
        </List.Item>
      )}
    />
  ) : (
    <Empty
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description="No documents found"
      style={{ padding: '20px 0' }}
    />
  )}
  
</div> {/* Emergency Contact Section */}
  {selectedEmployee.emergency_contact && (
    <div style={{...styles.contactItem, flexDirection: 'column', alignItems: 'flex-start', marginTop: '16px', padding: '12px', backgroundColor: '#f0f2f5', borderRadius: '8px'}}>
      <Text strong style={{color: theme.primary, marginBottom: '8px', fontSize: '14px'}}>Emergency Contact:</Text>
      <div style={{fontSize: '13px', color: theme.text}}>
        <div style={{marginBottom: '4px'}}>
          <Text strong>{selectedEmployee.emergency_contact.name || 'N/A'}</Text>
        </div>
        <div style={{marginBottom: '4px'}}>
          <Text type="secondary">{selectedEmployee.emergency_contact.relationship || 'N/A'}</Text>
        </div>
        <div>
          <PhoneOutlined style={{marginRight: '6px', color: theme.textSecondary}} />
          <Text>{selectedEmployee.emergency_contact.phone || 'N/A'}</Text>
        </div>
      </div>
    </div>
  )}
        </div>
        
      </Modal>
    );
  };
  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f7fcf8ff 0%, #edf1ecff 100%)' }}>
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={3} style={{ color: '#0D7139', margin: '16px 0' }}>
          Employee Information
        </Title>
      </Header>
      <Content style={{ padding: screens.xs ? '16px' : '24px' }}>
        <Breadcrumb
  style={{ marginBottom: '16px' }}
  items={[
    {
      title: 'Home',
    },
    {
      title: 'Employees',
    },
  ]}
/>
        <Card
          style={{
            marginBottom: '24px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
          }}
        >
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Input
                prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                placeholder="Search by name or email"
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ borderRadius: '8px' }}
                size="large"
              />
            </Col>
            <Col xs={24} md={12}>
              <Select
                defaultValue="all"
                onChange={(value) => setEmployeeTypeFilter(value)}
                style={{ width: '100%', borderRadius: '8px' }}
                size="large"
                suffixIcon={<FilterOutlined />}
              >
                <Option value="all">All Employee Types</Option>
                <Option value="full-time">Full-time</Option>
                <Option value="internship">Internship</Option>
                <Option value="temporary">Temporary</Option>
              </Select>
            </Col>
          </Row>
        </Card>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <UserOutlined spin style={{ fontSize: '48px', color: '#0D7139' }} />
            <p>Loading Employees...</p>
          </div>
        ) : (
          filteredEmployees.length > 0 ? (
            <Row gutter={[24, 24]}>
              {filteredEmployees.map(employee => (
                <Col xs={24} sm={12} lg={8} xl={6} key={employee.id}>
                  <Card
                    hoverable
                    style={{
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      transition: 'all 0.3s',
                      height: '420px',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    cover={
                      <div style={{
                        background: `linear-gradient(to top, #0D7139, #52c41a)`,
                        height: '100px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center'
                      }}>
                        <Avatar size={80} src={employee.profileimage} icon={<UserOutlined />} style={{ border: '4px solid #fff' }}/>
                      </div>
                    }
                     styles={{ 
    body: {
      flex: 1, 
      display: 'flex', 
      flexDirection: 'column',
      padding: '16px'
    }
  }}
                  >
                    <div style={{ textAlign: 'center', flex: 1 }}>
                      <Title level={5} style={{ marginBottom: '4px', height: '24px' }}>
                        {truncateText(employee.name, 20)}
                      </Title>
                      <Text type="secondary" style={{ display: 'block', height: '20px', marginBottom: '12px' }}>
                        {truncateText(employee.role, 25)}
                      </Text>
                      <div style={{ margin: '12px 0' }}>
                        <Tag
                          icon={<TeamOutlined />}
                          color={getTagColor(employee.employee_type)}
                          style={{ borderRadius: '12px', padding: '4px 10px' }}
                        >
                          {employee.employee_type}
                        </Tag>
                      </div>
                      <div style={{ marginBottom: '8px', height: '20px' }}>
                        <Tooltip title={employee.email}>
                          <Text>
                            <MailOutlined style={{ marginRight: '8px', color: '#0D7139' }} />
                            {truncateText(employee.email, 20)}
                          </Text>
                        </Tooltip>
                      </div>
                      <div style={{ marginBottom: '16px', height: '20px' }}>
                        <Text>
                          <PhoneOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                          {truncateText(employee.mobile?.toString(), 15) || 'N/A'}
                        </Text>
                      </div>
                      {socialLinks(employee)}
                      <Button 
                        type="primary" 
                        style={{ 
                          marginTop: '16px', 
                          background: '#0D7139', 
                          borderColor: '#0D7139', 
                          borderRadius: '8px',
                          width: '100%'
                        }}
                        onClick={() => handleViewProfile(employee)}
                      >
                        View Profile
                      </Button>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span>
                  No employees found for the selected filters.
                </span>
              }
            />
          )
        )}
      </Content>
      {renderProfileModal()}
    </Layout>
  );
};

export default EmployeeInformationPage;