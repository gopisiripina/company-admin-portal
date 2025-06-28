import React from 'react';

const AnimatedBackground = ({ children }) => {
  const backgroundStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    background: 'linear-gradient(135deg, #FBFBFD 0%, #BCF49D 50%, #1F4842 100%)',
    zIndex: -1
  };

  const floatingCirclesContainerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  };

  const particlesContainerStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none'
  };

  const circles = [
    { size: { width: '200px', height: '200px' }, pos: { top: '5%', left: '5%' }, color: '#BCF49D', delay: '0s', duration: '3s' },
    { size: { width: '300px', height: '300px' }, pos: { bottom: '10%', right: '8%' }, color: '#1F4842', delay: '1s', duration: '4s' },
    { size: { width: '150px', height: '150px' }, pos: { top: '45%', left: '15%' }, color: '#BCF49D', delay: '2s', duration: '5s' },
    { size: { width: '100px', height: '100px' }, pos: { top: '25%', right: '25%' }, color: '#BCF49D', delay: '3s', duration: '6s' },
    { size: { width: '180px', height: '180px' }, pos: { bottom: '40%', left: '60%' }, color: '#1F4842', delay: '1.5s', duration: '7s' },
    { size: { width: '80px', height: '80px' }, pos: { top: '70%', left: '10%' }, color: '#BCF49D', delay: '2.5s', duration: '4.5s' },
    { size: { width: '120px', height: '120px' }, pos: { top: '15%', left: '70%' }, color: '#1F4842', delay: '0.5s', duration: '5.5s' },
    { size: { width: '90px', height: '90px' }, pos: { bottom: '20%', left: '30%' }, color: '#BCF49D', delay: '3.5s', duration: '3.5s' }
  ];

  const getCircleStyle = (circle) => ({
    position: 'absolute',
    borderRadius: '50%',
    ...circle.size,
    ...circle.pos,
    opacity: 0.15,
    background: `radial-gradient(circle, ${circle.color} 0%, transparent 70%)`,
    animation: `pulse ${circle.duration} infinite ease-in-out`,
    animationDelay: circle.delay,
    filter: 'blur(1px)'
  });

  const getParticleStyle = (i) => ({
    position: 'absolute',
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#86efac',
    opacity: 0.4,
    left: `${5 + (i * 7) % 90}%`,
    top: `${10 + (i * 11) % 80}%`,
    animation: `float ${3 + (i % 4)}s infinite ease-in-out`,
    animationDelay: `${i * 0.3}s`
  });

  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          html, body {
            width: 100%;
            height: 100%;
            overflow-x: hidden;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          }
          
          #root {
            width: 100%;
            height: 100%;
          }
          
          @keyframes pulse {
            0%, 100% {
              opacity: 0.15;
              transform: scale(1);
            }
            50% {
              opacity: 0.3;
              transform: scale(1.1);
            }
          }
          
          @keyframes float {
            0%, 100% {
              opacity: 0.4;
              transform: translateY(0px) scale(1);
            }
            33% {
              opacity: 0.6;
              transform: translateY(-10px) scale(1.1);
            }
            66% {
              opacity: 0.3;
              transform: translateY(5px) scale(0.9);
            }
          }
          
          @keyframes slideIn {
            from {
              transform: translateX(-100%);
            }
            to {
              transform: translateX(0);
            }
          }
          
          @keyframes slideOut {
            from {
              transform: translateX(0);
            }
            to {
              transform: translateX(-100%);
            }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes shimmer {
            0% {
              background-position: -1000px 0;
            }
            100% {
              background-position: 1000px 0;
            }
          }
        `}
      </style>
      
      <div style={backgroundStyle}>
        <div style={floatingCirclesContainerStyle}>
          {circles.map((circle, i) => (
            <div key={i} style={getCircleStyle(circle)} />
          ))}
        </div>
        <div style={particlesContainerStyle}>
          {Array.from({ length: 25 }, (_, i) => (
            <div key={i} style={getParticleStyle(i)} />
          ))}
        </div>
      </div>
      
      {children}
    </>
  );
};

export default AnimatedBackground;