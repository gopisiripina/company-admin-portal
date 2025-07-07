import React from 'react';
import { Button, Result } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HomeOutlined, ArrowLeftOutlined } from '@ant-design/icons';

const ErrorPage = ({ errorType = '404' }) => {
  const navigate = useNavigate();

  const getErrorConfig = (type) => {
    switch (type) {
      case '403':
        return {
          status: '403',
          title: '403',
          subTitle: 'Sorry, you are not authorized to access this page.',
          buttonText: 'Back to Dashboard'
        };
      case '500':
        return {
          status: '500',
          title: '500',
          subTitle: 'Sorry, something went wrong on our end.',
          buttonText: 'Try Again'
        };
      case '404':
      default:
        return {
          status: '404',
          title: '404',
          subTitle: 'Sorry, the page you visited does not exist.',
          buttonText: 'Back to Home'
        };
    }
  };

  const errorConfig = getErrorConfig(errorType);

  const handleBackHome = () => {
    navigate('/'); // Adjust route as needed
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div style={{ 
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#1F4842',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 8px 32px #FBFBFD',
        maxWidth: '500px',
        width: '90%'
      }}>
        <Result
          status={errorConfig.status}
           title={<span style={{ color: '#FBFBFD' }}>{errorConfig.title}</span>}
          subTitle={<span style={{ color: 'white' }}>{errorConfig.subTitle}</span>}
          extra={[
            <Button 
              type="primary" 
              key="home"
              icon={<HomeOutlined />}
              onClick={handleBackHome}
              style={{
                color: '#000000',
                background: 'linear-gradient(155deg, #BCF49D 50%, #1F4842 100%)',
                border: 'none',
                borderRadius: '8px',
                marginRight: '8px'
              }}
            >
              {errorConfig.buttonText}
            </Button>,
            <Button 
              key="back"
              icon={<ArrowLeftOutlined />}
              onClick={handleGoBack}
              style={{
                borderRadius: '8px'
              }}
            >
              Go Back
            </Button>
          ]}
          style={{
            color: '#333'
          }}
        />
      </div>
    </div>
  );
};

export default ErrorPage;