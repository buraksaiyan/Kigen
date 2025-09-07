import React from 'react';

export default function SimpleTest() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      backgroundColor: '#000000',
      color: '#FFFFFF',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: '20px',
      textAlign: 'center',
    }}>
      <h1 style={{ 
        fontSize: '48px', 
        margin: '0 0 16px 0',
        fontWeight: 'bold'
      }}>
        🎉 Kigen Works!
      </h1>
      <p style={{ 
        fontSize: '20px', 
        color: '#8E8E93',
        lineHeight: '1.4',
        maxWidth: '600px',
      }}>
        Your React Native app is running successfully in the browser!<br/>
        This means the foundation is solid and ready for development.
      </p>
      <div style={{
        marginTop: '32px',
        padding: '16px 32px',
        backgroundColor: '#1C1C1E',
        borderRadius: '12px',
        border: '1px solid #38383A'
      }}>
        <p style={{ margin: 0, color: '#007AFF' }}>
          ✅ React Native Web: Working<br/>
          ✅ Development Server: Running<br/>
          ✅ Components: Loading<br/>
        </p>
      </div>
    </div>
  );
}
