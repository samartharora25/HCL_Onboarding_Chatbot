import React, { useState, useEffect, useRef } from 'react';

const Captcha = ({ onVerify, refreshTrigger }) => {
  const [captchaCode, setCaptchaCode] = useState('');
  const [userInput, setUserInput] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const canvasRef = useRef(null);

  // Generate random alphanumeric string
  const generateCaptchaString = () => {
    const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const drawCaptcha = (code) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#f0f7ff');
    gradient.addColorStop(1, '#e0efff');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw noise lines
    ctx.strokeStyle = '#cfe2ff';
    for (let i = 0; i < 6; i++) {
      ctx.lineWidth = Math.random() * 2 + 1;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    // Draw text with random rotation, color, and scaling
    ctx.font = 'bold 28px "Outfit", "Inter", sans-serif';
    ctx.textBaseline = 'middle';
    
    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      const charWidth = canvas.width / (code.length + 1);
      const x = charWidth * (i + 0.5) + (Math.random() * 5 - 2.5);
      const y = canvas.height / 2 + (Math.random() * 10 - 5);
      
      ctx.save();
      ctx.translate(x, y);
      // Random rotation between -15 and +15 degrees
      const angle = (Math.random() * 30 - 15) * Math.PI / 180;
      ctx.rotate(angle);
      
      // Harmonies of brand colors
      const colors = ['#1f6ef0', '#153f8b', '#0f2d66', '#3c86ff'];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      
      ctx.fillText(char, 0, 0);
      ctx.restore();
    }

    // Draw random noise points
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = '#a7caff';
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, Math.random() * 1.5 + 0.5, 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const handleRefresh = () => {
    const newCode = generateCaptchaString();
    setCaptchaCode(newCode);
    setUserInput('');
    setIsVerified(false);
    setErrorMsg('');
    onVerify(false, '');
    drawCaptcha(newCode);
  };

  // Re-draw captcha when component mounts, trigger ref, or parent requests refresh
  useEffect(() => {
    handleRefresh();
  }, [refreshTrigger]);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setUserInput(val);
    
    // Check validation on-the-fly or when length matches
    if (val.length === 6) {
      if (val === captchaCode) {
        setIsVerified(true);
        setErrorMsg('');
        onVerify(true, val);
      } else {
        setIsVerified(false);
        setErrorMsg('Invalid Captcha');
        onVerify(false, val);
      }
    } else {
      setIsVerified(false);
      setErrorMsg('');
      onVerify(false, val);
    }
  };

  return (
    <div className="captcha-container">
      <label className="label-style">Security Verification</label>
      <div className="captcha-row">
        <canvas 
          ref={canvasRef} 
          width={180} 
          height={50} 
          className="captcha-canvas"
        />
        <button 
          type="button" 
          onClick={handleRefresh} 
          className="captcha-refresh-btn"
          title="Refresh Captcha"
        >
          🔄
        </button>
      </div>
      <input
        type="text"
        placeholder="Enter 6-digit captcha"
        value={userInput}
        onChange={handleInputChange}
        maxLength={6}
        className={`input-style text-center font-mono tracking-widest ${
          isVerified ? 'border-green-500' : errorMsg ? 'border-red-500' : ''
        }`}
      />
      {errorMsg && <p className="captcha-error-text">{errorMsg}</p>}
      {isVerified && <p className="captcha-success-text">✓ Captcha verified</p>}
    </div>
  );
};

export default Captcha;
