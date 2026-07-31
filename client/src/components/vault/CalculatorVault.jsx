import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle, AlertCircle, KeyRound, Shield, Delete, RefreshCw } from 'lucide-react';

export default function CalculatorVault({ onUnlock }) {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [history, setHistory] = useState('');
  
  // Passcode setup state
  const [savedPasscode, setSavedPasscode] = useState(null);
  const [setupStep, setSetupStep] = useState(1); // 1 = first entry, 2 = confirm entry
  const [firstPasscode, setFirstPasscode] = useState('');
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'

  useEffect(() => {
    const passcode = localStorage.getItem('vault_passcode');
    if (passcode) {
      setSavedPasscode(passcode);
      setMessage({
        title: 'Calculator Disguise Active',
        text: 'Enter your 4-digit secret code and press = to unlock.'
      });
      setMessageType('info');
    } else {
      setMessage({
        title: 'Secret Vault Setup',
        text: 'Step 1 of 2: Enter a 4-digit secret passcode and press ='
      });
      setMessageType('info');
    }
  }, []);

  const handleNumber = (digit) => {
    if (display === '0' || display === 'Error') {
      setDisplay(digit);
    } else if (display.length < 14) {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setHistory('');
  };

  const handleDelete = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleToggleSign = () => {
    if (display !== '0' && display !== 'Error') {
      if (display.startsWith('-')) {
        setDisplay(display.substring(1));
      } else {
        setDisplay('-' + display);
      }
    }
  };

  const handleOperator = (op) => {
    setHistory(`${display} ${op}`);
    setEquation(`${display} ${op} `);
    setDisplay('0');
  };

  const handlePercent = () => {
    try {
      const val = parseFloat(display);
      if (!isNaN(val)) {
        setDisplay((val / 100).toString());
      }
    } catch {
      setDisplay('Error');
    }
  };

  const handleEquals = () => {
    const cleanDisplay = display.trim();

    // 1. FIRST TIME SETUP MODE
    if (!savedPasscode) {
      if (setupStep === 1) {
        if (/^\d{4}$/.test(cleanDisplay)) {
          setFirstPasscode(cleanDisplay);
          setSetupStep(2);
          setDisplay('0');
          setMessage({
            title: 'Confirm Passcode',
            text: 'Step 2 of 2: Re-enter the same 4-digit passcode and press ='
          });
          setMessageType('info');
        } else {
          setMessage({
            title: 'Invalid Passcode',
            text: 'Passcode must be exactly 4 digits. Enter 4 digits and press ='
          });
          setMessageType('error');
        }
        return;
      } else if (setupStep === 2) {
        if (cleanDisplay === firstPasscode) {
          localStorage.setItem('vault_passcode', cleanDisplay);
          setSavedPasscode(cleanDisplay);
          setMessage({
            title: 'Passcode Created!',
            text: 'Secret vault created successfully. Unlocking app...'
          });
          setMessageType('success');
          setTimeout(() => {
            onUnlock();
          }, 800);
        } else {
          setMessage({
            title: 'Passcodes Do Not Match',
            text: 'Passcodes did not match. Please enter a 4-digit passcode again and press ='
          });
          setMessageType('error');
          setSetupStep(1);
          setFirstPasscode('');
          setDisplay('0');
        }
        return;
      }
    }

    // 2. EXISTING PASSCODE MODE: Check if secret code entered
    if (savedPasscode && cleanDisplay === savedPasscode) {
      setMessage({
        title: 'Access Granted',
        text: 'Secret vault unlocked successfully!'
      });
      setMessageType('success');
      setTimeout(() => {
        onUnlock();
      }, 500);
      return;
    }

    // 3. STANDARD CALCULATOR MATH EVALUATION
    try {
      let fullExpr = equation + display;
      setHistory(`${fullExpr} =`);
      
      // Sanitize expression for safe calculation
      let sanitized = fullExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/[^0-9+\-*/%. ]/g, '');

      if (!sanitized) {
        setDisplay('0');
        return;
      }

      // Safe evaluation using Function
      const result = new Function(`return ${sanitized}`)();
      if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
        // Format to max 8 decimal places if needed
        const formatted = Number.isInteger(result) ? result.toString() : parseFloat(result.toFixed(8)).toString();
        setDisplay(formatted);
      } else {
        setDisplay('Error');
      }
      setEquation('');
    } catch (e) {
      setDisplay('Error');
      setEquation('');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex flex-col items-center justify-center p-4 selection:bg-none font-sans text-slate-100 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      {/* CALCULATOR CONTAINER */}
      <div className="w-full max-w-sm bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-5 shadow-2xl shadow-cyan-950/30 flex flex-col gap-4 relative z-10">
        
        {/* TOP BAR / DISGUISE HEADER */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800/60 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🧮</span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-400 font-heading">
              Calculator
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Standard v2.4</span>
          </div>
        </div>

        {/* STATUS / PROMPT BANNER */}
        {message && (
          <div
            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
              messageType === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                : messageType === 'error'
                ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                : 'bg-slate-800/50 border-slate-700/60 text-cyan-300'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : messageType === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            ) : (
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{message.title}</p>
              <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">{message.text}</p>
            </div>
          </div>
        )}

        {/* CALCULATOR DISPLAY SCREEN */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-right flex flex-col justify-end min-h-[100px] shadow-inner font-mono">
          <div className="text-slate-500 text-xs h-5 overflow-hidden text-ellipsis whitespace-nowrap">
            {history || equation || ' '}
          </div>
          <div className="text-white text-3xl font-semibold tracking-wider mt-1 overflow-x-auto whitespace-nowrap scrollbar-none">
            {display}
          </div>
        </div>

        {/* BUTTON GRID */}
        <div className="grid grid-cols-4 gap-2.5">
          {/* Row 1 */}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-cyan-400 font-semibold text-lg transition flex items-center justify-center border border-slate-700/50"
          >
            AC
          </button>
          <button
            onClick={handleToggleSign}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold text-lg transition flex items-center justify-center border border-slate-700/50"
          >
            +/-
          </button>
          <button
            onClick={handlePercent}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold text-lg transition flex items-center justify-center border border-slate-700/50"
          >
            %
          </button>
          <button
            onClick={() => handleOperator('÷')}
            className="h-14 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xl transition flex items-center justify-center shadow-lg shadow-cyan-950/50"
          >
            ÷
          </button>

          {/* Row 2 */}
          <button
            onClick={() => handleNumber('7')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            7
          </button>
          <button
            onClick={() => handleNumber('8')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            8
          </button>
          <button
            onClick={() => handleNumber('9')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            9
          </button>
          <button
            onClick={() => handleOperator('×')}
            className="h-14 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xl transition flex items-center justify-center shadow-lg shadow-cyan-950/50"
          >
            ×
          </button>

          {/* Row 3 */}
          <button
            onClick={() => handleNumber('4')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            4
          </button>
          <button
            onClick={() => handleNumber('5')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            5
          </button>
          <button
            onClick={() => handleNumber('6')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            6
          </button>
          <button
            onClick={() => handleOperator('-')}
            className="h-14 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xl transition flex items-center justify-center shadow-lg shadow-cyan-950/50"
          >
            -
          </button>

          {/* Row 4 */}
          <button
            onClick={() => handleNumber('1')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            1
          </button>
          <button
            onClick={() => handleNumber('2')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            2
          </button>
          <button
            onClick={() => handleNumber('3')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            3
          </button>
          <button
            onClick={() => handleOperator('+')}
            className="h-14 rounded-2xl bg-cyan-600/90 hover:bg-cyan-500 active:scale-95 text-white font-bold text-xl transition flex items-center justify-center shadow-lg shadow-cyan-950/50"
          >
            +
          </button>

          {/* Row 5 */}
          <button
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:scale-95 text-slate-300 font-semibold transition flex items-center justify-center border border-slate-700/50"
          >
            <Delete className="w-5 h-5 text-slate-400" />
          </button>
          <button
            onClick={() => handleNumber('0')}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            0
          </button>
          <button
            onClick={handleDecimal}
            className="h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 active:scale-95 text-white font-medium text-xl transition border border-slate-800"
          >
            .
          </button>
          <button
            onClick={handleEquals}
            className="h-14 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-bold text-2xl transition flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
          >
            =
          </button>
        </div>

        {/* FOOTER DISGUISE NOTE */}
        <div className="text-center text-[11px] text-slate-600 pt-1 font-mono">
          Memory: 0.0 MB | Precision: 64-bit
        </div>
      </div>
    </div>
  );
}
